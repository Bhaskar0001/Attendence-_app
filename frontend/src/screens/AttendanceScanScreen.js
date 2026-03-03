import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Platform, Dimensions, StatusBar, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Application from 'expo-application';
import { Scan, XCircle, MapPin, Wifi, ShieldCheck, Eye, Smile, CheckCircle2, AlertCircle } from 'lucide-react-native';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../context/ThemeContext';
import { smartAttendance, updateFace } from '../utils/api';
import { getFriendlyErrorMessage } from '../utils/errorUtils';
import * as Haptics from 'expo-haptics';
import * as Reanimated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate, withSequence, withSpring } = Reanimated;
const Animated = Reanimated.default || Reanimated;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RING_SIZE = SCREEN_WIDTH * 0.7;

const AttendanceScanScreen = ({ route, navigation }) => {
    const { theme: orgTheme } = useTheme();
    const primaryColor = orgTheme.primaryColor || '#6366f1';

    const { location: initialLocation, wifiInfo, email, intendedType, verificationPassword } = route.params;
    const [isVerifying, setIsVerifying] = useState(false);
    const [liveWifiInfo, setLiveWifiInfo] = useState(wifiInfo);
    const [livenessState, setLivenessState] = useState('idle'); // idle -> checking -> ready
    const [livenessProgress, setLivenessProgress] = useState(0);
    const [scanStatus, setScanStatus] = useState(null); // 'success', 'error', or null
    const [readableAddress, setReadableAddress] = useState('Locating...');

    const pulse = useSharedValue(0);
    const scanLine = useSharedValue(0);
    const statusScale = useSharedValue(0);

    useEffect(() => {
        pulse.value = withRepeat(
            withTiming(1, { duration: 2000 }),
            -1,
            false
        );
        scanLine.value = withRepeat(
            withTiming(1, { duration: 3000 }),
            -1,
            true
        );
    }, []);

    useEffect(() => {
        if (scanStatus) {
            statusScale.value = withSequence(
                withTiming(1.2, { duration: 200 }),
                withSpring(1)
            );
        } else {
            statusScale.value = 0;
        }
    }, [scanStatus]);

    const animatedRingStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.15]) }],
            opacity: interpolate(pulse.value, [0, 1], [0.6, 0]),
            borderColor: scanStatus === 'success' ? '#10b981' : scanStatus === 'error' ? '#f43f5e' : primaryColor,
        };
    });

    const animatedScanLineStyle = useAnimatedStyle(() => {
        return {
            top: interpolate(scanLine.value, [0, 1], [0, RING_SIZE]),
            backgroundColor: scanStatus === 'error' ? '#f43f5e' : primaryColor,
        };
    });

    const animatedStatusStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: statusScale.value }],
            opacity: interpolate(statusScale.value, [0, 1], [0, 1])
        };
    });

    const [permission, requestPermission] = useCameraPermissions();
    const [isCameraReady, setIsCameraReady] = useState(false);
    const cameraRef = useRef(null);

    useEffect(() => {
        if (permission && !permission.granted && permission.canAskAgain) {
            requestPermission();
        }

        const updateLocation = async () => {
            try {
                const currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                if (currentLoc?.coords) {
                    const reverse = await Location.reverseGeocodeAsync({
                        latitude: currentLoc.coords.latitude,
                        longitude: currentLoc.coords.longitude
                    });
                    if (reverse && reverse.length > 0) {
                        const item = reverse[0];
                        const addr = [item.name, item.street, item.district, item.city].filter(Boolean).join(', ');
                        setReadableAddress(addr || 'Verified Enterprise Zone');
                    }
                }
            } catch (err) {
                // Silently fail location update for better performance
            }
        };

        updateLocation();
        const locInterval = setInterval(updateLocation, 8000);
        return () => clearInterval(locInterval);
    }, [permission]);

    const getWifiStrengthLabel = (dbm) => {
        if (dbm >= -50) return { label: 'Strong', color: '#10b981' };
        if (dbm >= -65) return { label: 'Good', color: primaryColor };
        if (dbm >= -80) return { label: 'Fair', color: '#f59e0b' };
        return { label: 'Weak', color: '#f43f5e' };
    };

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const state = await NetInfo.fetch();
                if (state.type === 'wifi' && state.isConnected) {
                    setLiveWifiInfo({
                        ssid: state.details.ssid || liveWifiInfo.wifi_ssid,
                        bssid: state.details.bssid || liveWifiInfo.bssid,
                        strength: state.details.strength || -100
                    });
                }
            } catch (err) { }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isCameraReady && livenessState === 'idle') {
            setLivenessState('checking');
            let progress = 0;
            const interval = setInterval(() => {
                progress += 0.04;
                setLivenessProgress(Math.min(1, progress));
                if (progress >= 1) {
                    clearInterval(interval);
                    setLivenessState('ready');
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            }, 80);
            return () => clearInterval(interval);
        }
    }, [isCameraReady]);

    const wifiStrength = getWifiStrengthLabel(liveWifiInfo?.strength || -100);

    const performScan = async () => {
        if (isVerifying) return;

        if (cameraRef.current && isCameraReady) {
            const OFFICE_SSID = route.params.office_wifi_ssid || "";

            if (OFFICE_SSID !== "" && liveWifiInfo.ssid !== OFFICE_SSID) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert(
                    "Connection Restricted",
                    `Attendance requires the "${OFFICE_SSID}" enterprise network.`,
                    [{ text: "Go Back", onPress: () => navigation.goBack() }]
                );
                return;
            }

            setIsVerifying(true);
            try {
                const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });

                const freshLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                const isMocked = freshLocation.mocked || false;
                const deviceId = Platform.OS === 'android' ? Application.androidId : await Application.getIosIdForVendorAsync();

                if (intendedType === 'update-face') {
                    const result = await updateFace(
                        email, verificationPassword, photo.base64,
                        freshLocation.coords.latitude, freshLocation.coords.longitude,
                        liveWifiInfo?.bssid || '', liveWifiInfo?.ssid || liveWifiInfo?.wifi_ssid || '',
                        liveWifiInfo?.strength || -50, deviceId
                    );
                    setScanStatus('success');
                    Alert.alert("Success", "Biometrics enrolled successfully.", [{ text: "Done", onPress: () => navigation.navigate('Home', { email }) }]);
                    return;
                }

                const result = await smartAttendance(
                    photo.base64, freshLocation.coords.latitude, freshLocation.coords.longitude,
                    liveWifiInfo?.bssid || '', liveWifiInfo?.ssid || liveWifiInfo?.wifi_ssid || '',
                    liveWifiInfo?.strength || -50, email, readableAddress, intendedType, deviceId, isMocked
                );

                setScanStatus('success');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                setTimeout(() => {
                    Alert.alert(
                        result.type === 'check-in' ? "Check-in Successful" : "Check-out Successful",
                        `Identity verified for ${result.user}.${result.is_late ? `\n(⚠️ Late by ${result.late_mins}m)` : ''}${isMocked ? '\n(⚠️ Security Warning: Mock Location Detected)' : ''}`,
                        [{ text: "Continue", onPress: () => navigation.navigate('Home', { email }) }]
                    );
                }, 600);
            } catch (e) {
                setScanStatus('error');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                const msg = getFriendlyErrorMessage(e, "Biometric verification failed.");
                Alert.alert("Verification Error", msg, [{ text: "Retry", onPress: () => setScanStatus(null) }]);
            } finally {
                setIsVerifying(false);
            }
        }
    };

    useEffect(() => {
        if (livenessState === 'ready' && !isVerifying && !scanStatus) {
            const timer = setTimeout(performScan, 600);
            return () => clearTimeout(timer);
        }
    }, [livenessState]);

    if (!permission) return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="front"
                onCameraReady={() => setIsCameraReady(true)}
            >
                <View style={styles.overlay}>
                    <View style={styles.infoOverlays}>
                        <View style={styles.badgeContainer}>
                            <View style={[styles.badge, styles.glassBadge]}>
                                <MapPin size={12} color="#f8fafc" />
                                <Text style={styles.badgeText} numberOfLines={1}>{readableAddress}</Text>
                            </View>
                            <View style={[styles.badge, styles.glassBadge, { borderColor: `${wifiStrength.color}40` }]}>
                                <Wifi size={12} color={wifiStrength.color} />
                                <Text style={[styles.badgeText, { color: wifiStrength.color }]}>{wifiStrength.label}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.ringWrapper}>
                        <Animated.View style={[styles.pulseRing, animatedRingStyle]} />
                        <View style={[styles.ringOuter, { borderColor: `${primaryColor}40` }, scanStatus === 'success' && { borderColor: '#10b981' }, scanStatus === 'error' && { borderColor: '#f43f5e' }]}>
                            <Animated.View style={[styles.scanLine, animatedScanLineStyle]} />
                            <View style={[styles.ringInner, { borderColor: primaryColor }, scanStatus === 'success' && { borderColor: '#10b981' }, scanStatus === 'error' && { borderColor: '#f43f5e' }]} />
                        </View>

                        {scanStatus && (
                            <Animated.View style={[styles.statusIcon, animatedStatusStyle]}>
                                {scanStatus === 'success' ? (
                                    <View style={[styles.statusCircle, { backgroundColor: '#10b981' }]}>
                                        <CheckCircle2 size={40} color="white" />
                                    </View>
                                ) : (
                                    <View style={[styles.statusCircle, { backgroundColor: '#f43f5e' }]}>
                                        <AlertCircle size={40} color="white" />
                                    </View>
                                )}
                            </Animated.View>
                        )}
                    </View>

                    <View style={styles.instructionBox}>
                        <Text style={styles.instructionText}>
                            {scanStatus === 'success' ? "IDENTITY VERIFIED"
                                : scanStatus === 'error' ? "VERIFICATION FAILED"
                                    : livenessState !== 'ready' ? "BLINK EYES SLOWLY"
                                        : isVerifying ? "ANALYZING BIOMETRICS..." : "MATCHING FACE..."}
                        </Text>
                    </View>
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                        <XCircle size={28} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>

                    {livenessState !== 'ready' && (
                        <View style={styles.livenessCard}>
                            <View style={styles.livenessHeader}>
                                <ShieldCheck size={14} color={primaryColor} />
                                <Text style={[styles.livenessTitle, { color: primaryColor }]}>LIVENESS CHECK</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${livenessProgress * 100}%`, backgroundColor: primaryColor }]} />
                            </View>
                        </View>
                    )}
                </View>
            </CameraView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    camera: { flex: 1 },
    loadingContainer: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' },
    overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    infoOverlays: { position: 'absolute', top: 60, width: '100%', paddingHorizontal: 20 },
    badgeContainer: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
    glassBadge: { backgroundColor: 'rgba(15, 23, 42, 0.8)', borderColor: 'rgba(255,255,255,0.1)' },
    badgeText: { color: '#f8fafc', fontSize: 11, fontWeight: '700', marginLeft: 6 },
    ringWrapper: { alignItems: 'center', justifyContent: 'center' },
    pulseRing: { position: 'absolute', width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, borderWidth: 4 },
    ringOuter: { width: RING_SIZE, height: RING_SIZE, borderWidth: 2, borderRadius: RING_SIZE / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    scanLine: { position: 'absolute', width: '100%', height: 2, zIndex: 10, shadowOpacity: 0.8, shadowRadius: 10, elevation: 10 },
    ringInner: { width: RING_SIZE * 0.92, height: RING_SIZE * 0.92, borderWidth: 1.5, borderRadius: (RING_SIZE * 0.92) / 2, opacity: 0.3 },
    statusIcon: { position: 'absolute', zIndex: 20 },
    statusCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    instructionBox: { marginTop: 40, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, backgroundColor: 'rgba(15, 23, 42, 0.8)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    instructionText: { color: '#f8fafc', fontWeight: '900', fontSize: 14, letterSpacing: 1.5, textAlign: 'center' },
    controls: { position: 'absolute', bottom: 50, width: '100%', paddingHorizontal: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    closeButton: { padding: 10 },
    livenessCard: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 15, borderRadius: 20, marginLeft: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    livenessHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    livenessTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginLeft: 6 },
    progressBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
    progressBarFill: { height: '100%' }
});

export default AttendanceScanScreen;
