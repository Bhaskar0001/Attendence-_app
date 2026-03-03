import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Dimensions, Image, ScrollView } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import GlassCard from '../components/GlassCard';
import { getAnalytics, getSystemSettings } from '../utils/api';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import Svg, { Circle } from 'react-native-svg';
import { Scan, Wifi, MapPin, History, LogOut, User, Clock as ClockIcon, RefreshCcw, Shield, Info, PlaneTakeoff, Users } from 'lucide-react-native';
import * as Reanimated from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
} = Reanimated;
const Animated = Reanimated.default || Reanimated;

const { width, height } = Dimensions.get('window');

// Compact Progress Ring
const ProgressRing = ({ progress, size, strokeWidth, color }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size}>
                <Circle stroke="rgba(255,255,255,0.06)" fill="none" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
                <Circle
                    stroke={color} fill="none" cx={size / 2} cy={size / 2} r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
            <View style={{ position: 'absolute' }}>
                <Text style={{ color: 'white', fontSize: 11, fontWeight: '800' }}>{Math.round(progress)}%</Text>
            </View>
        </View>
    );
};

const HomeScreen = ({ route, navigation }) => {
    const { theme: orgTheme } = useTheme();
    const primaryColor = orgTheme?.primaryColor || '#6366f1';

    const email = route?.params?.email || '';
    const [user, setUser] = useState(route?.params?.user || null);
    const [location, setLocation] = useState(null);
    const [wifiConnected, setWifiConnected] = useState(false);
    const [wifiInfo, setWifiInfo] = useState({ ssid: '', bssid: '', strength: -50 });
    const [systemSettings, setSystemSettings] = useState({ office_start_time: '09:00', required_hours: 8 });
    const [analytics, setAnalytics] = useState({ today_hours: 0, week_total: 0, daily_breakdown: {}, current_status: 'check-out' });
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [readableAddress, setReadableAddress] = useState('Locating...');

    const isFocused = useIsFocused();
    const needsEnrollment = route?.params?.needs_face_enrollment || user?.needs_face_enrollment || false;

    const refreshRotation = useSharedValue(0);
    const activePulse = useSharedValue(1);

    useEffect(() => {
        activePulse.value = withRepeat(
            withSequence(withTiming(1.04, { duration: 1200 }), withTiming(1, { duration: 1200 })),
            -1, true
        );
    }, []);

    useEffect(() => {
        if (isFocused) {
            fetchStats();
            fetchSystemSettings();
            refreshDeviceState();
        }
        let interval;
        if (isFocused) interval = setInterval(fetchStats, 60000);
        return () => interval && clearInterval(interval);
    }, [isFocused]);

    useEffect(() => {
        (async () => {
            if (!user) {
                try {
                    const saved = await SecureStore.getItemAsync('userData');
                    if (saved) setUser(JSON.parse(saved));
                } catch (e) { }
            }
        })();
    }, []);

    const fetchSystemSettings = async () => {
        try { setSystemSettings(await getSystemSettings()); } catch (e) { }
    };

    const refreshDeviceState = async () => {
        try {
            const state = await NetInfo.fetch();
            if (state.type === 'wifi' && state.isConnected) {
                setWifiConnected(true);
                setWifiInfo({ ssid: state.details.ssid || 'CONNECTED', bssid: state.details.bssid || '', strength: state.details.strength || -50 });
            } else {
                setWifiConnected(false);
            }
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                setLocation(loc);
                const rev = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                if (rev?.length > 0) {
                    const item = rev[0];
                    setReadableAddress(item.street || item.district || item.city || 'Verified Zone');
                }
            }
        } catch (err) { }
    };

    const handleLogout = async () => {
        try {
            await Promise.all([
                SecureStore.deleteItemAsync('userEmail'),
                SecureStore.deleteItemAsync('userPassword'),
                SecureStore.deleteItemAsync('userToken'),
                SecureStore.deleteItemAsync('userData'),
            ]);
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch (e) { }
    };

    const fetchStats = async () => {
        setIsRefreshing(true);
        refreshRotation.value = withRepeat(withTiming(360, { duration: 900 }), -1, false);
        try {
            const data = await getAnalytics();
            setAnalytics(data);
        } catch (err) {
            console.error('Failed to fetch analytics', err);
        } finally {
            setLoadingAnalytics(false);
            setIsRefreshing(false);
            refreshRotation.value = withTiming(0, { duration: 300 });
        }
    };

    const animatedRefreshStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${refreshRotation.value}deg` }],
    }));

    const animatedActiveButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: activePulse.value }],
    }));

    const OFFICE_SSID = analytics?.office_wifi_ssid || '';
    const isOfficeWiFi = wifiConnected && (OFFICE_SSID === '' || wifiInfo.ssid === OFFICE_SSID);

    const handleScanPress = (type) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (needsEnrollment) {
            Alert.alert('Enrollment Required', 'Please enroll your face in Profile.', [{ text: 'Profile', onPress: () => navigation.navigate('Profile', { email }) }]);
            return;
        }
        if (!isOfficeWiFi && OFFICE_SSID !== '') {
            Alert.alert('Office WiFi Required', `Connect to "${OFFICE_SSID}" to mark attendance.\nCurrent: "${wifiInfo.ssid || 'Unknown'}"`, [{ text: 'OK' }]);
            return;
        }
        navigation.navigate('AttendanceScan', {
            location, wifiInfo: { bssid: wifiInfo.bssid, wifi_ssid: wifiInfo.ssid, strength: wifiInfo.strength },
            email, intendedType: type, officeStartTime: systemSettings.office_start_time, office_wifi_ssid: OFFICE_SSID,
        });
    };

    const todayProgress = Math.min(100, (analytics.today_hours / systemSettings.required_hours) * 100);
    const isCheckedIn = analytics.current_status === 'check-in';

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
        >
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => { Haptics.selectionAsync(); navigation.navigate('Profile', { email }); }}
                >
                    <View style={[styles.avatarMini, { backgroundColor: primaryColor }]}>
                        {user?.profile_image
                            ? <Image source={{ uri: `data:image/jpeg;base64,${user.profile_image}` }} style={styles.avatarImg} />
                            : <User size={16} color="white" />
                        }
                    </View>
                    <View>
                        <Text style={styles.greeting}>Welcome Back,</Text>
                        <Text style={styles.userName} numberOfLines={1}>{user?.full_name || email || 'Guest'}</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconCircle} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); fetchStats(); }}>
                        <Animated.View style={animatedRefreshStyle}>
                            <RefreshCcw size={16} color={primaryColor} />
                        </Animated.View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutButton} onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); handleLogout(); }}>
                        <LogOut size={16} color="#f43f5e" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* STATUS PILLS */}
            <View style={styles.pillsRow}>
                <View style={[styles.pill, { borderColor: isOfficeWiFi ? '#10b98130' : '#f43f5e30' }]}>
                    <View style={[styles.pillIcon, { backgroundColor: isOfficeWiFi ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)' }]}>
                        <Wifi size={13} color={isOfficeWiFi ? '#10b981' : '#f43f5e'} />
                    </View>
                    <View>
                        <Text style={styles.pillLabel}>WIFI</Text>
                        <Text style={[styles.pillValue, { color: isOfficeWiFi ? '#10b981' : '#f43f5e' }]} numberOfLines={1}>
                            {wifiConnected ? wifiInfo.ssid || 'CONNECTED' : 'OFFLINE'}
                        </Text>
                    </View>
                </View>

                <View style={[styles.pill, { borderColor: location ? '#10b98130' : '#f43f5e30' }]}>
                    <View style={[styles.pillIcon, { backgroundColor: location ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)' }]}>
                        <MapPin size={13} color={location ? '#10b981' : '#f43f5e'} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.pillLabel}>GPS</Text>
                        <Text style={[styles.pillValue, { color: location ? '#10b981' : '#f43f5e' }]} numberOfLines={1}>
                            {location ? readableAddress : 'SEARCHING'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* ANALYTICS CARD */}
            <GlassCard style={styles.analyticsCard}>
                <View style={styles.analyticsTop}>
                    <View style={styles.analyticsLeft}>
                        <ProgressRing progress={todayProgress} size={64} strokeWidth={7} color={primaryColor} />
                    </View>
                    <View style={styles.analyticsRight}>
                        <Text style={styles.hoursValue}>{analytics.today_hours.toFixed(1)}<Text style={styles.hoursUnit}> hrs</Text></Text>
                        <Text style={styles.hoursLabel}>WORKED TODAY</Text>
                        <View style={styles.statusBadge}>
                            <Info size={10} color="#94a3b8" />
                            <Text style={styles.statusBadgeText}>Enterprise Policy Active</Text>
                        </View>
                    </View>
                    <View style={styles.analyticsGoal}>
                        <View style={styles.goalRow}>
                            <ClockIcon size={11} color={primaryColor} />
                            <Text style={styles.goalText}>{systemSettings.office_start_time}</Text>
                        </View>
                        <View style={[styles.goalBadge, { backgroundColor: `${primaryColor}18` }]}>
                            <Text style={[styles.goalBadgeText, { color: primaryColor }]}>Goal {systemSettings.required_hours}h</Text>
                        </View>
                    </View>
                </View>
            </GlassCard>

            {/* CHECK IN/OUT BUTTONS */}
            <View style={styles.buttonRow}>
                <Animated.View style={[styles.btnWrapper, !isCheckedIn && isOfficeWiFi && animatedActiveButtonStyle]}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: primaryColor }, (isCheckedIn || !isOfficeWiFi) && styles.disabledBtn]}
                        onPress={() => handleScanPress('check-in')}
                        disabled={isCheckedIn || needsEnrollment || !isOfficeWiFi}
                    >
                        <View style={styles.btnIconBox}>
                            <Scan size={24} color="white" />
                        </View>
                        <Text style={styles.btnText}>CHECK IN</Text>
                        {isCheckedIn && <View style={styles.activeDot} />}
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View style={[styles.btnWrapper, isCheckedIn && isOfficeWiFi && animatedActiveButtonStyle]}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.checkOutBtn, (!isCheckedIn || !isOfficeWiFi) && styles.disabledBtn]}
                        onPress={() => handleScanPress('check-out')}
                        disabled={!isCheckedIn || needsEnrollment || !isOfficeWiFi}
                    >
                        <View style={styles.btnIconBox}>
                            <LogOut size={24} color="white" />
                        </View>
                        <Text style={styles.btnText}>CHECK OUT</Text>
                        {isCheckedIn && <View style={[styles.activeDot, { backgroundColor: '#f43f5e' }]} />}
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* QUICK SERVICES */}
            <Text style={styles.sectionLabel}>QUICK SERVICES</Text>
            <View style={styles.serviceRow}>
                <TouchableOpacity style={styles.serviceCard} onPress={() => navigation.navigate('History', { email })}>
                    <View style={[styles.serviceIcon, { backgroundColor: 'rgba(148,163,184,0.1)' }]}>
                        <History size={18} color="#94a3b8" />
                    </View>
                    <Text style={styles.serviceTitle}>History</Text>
                    <Text style={styles.serviceSub}>Past logs</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.serviceCard} onPress={() => navigation.navigate('LeaveRequest', { email })}>
                    <View style={[styles.serviceIcon, { backgroundColor: `${primaryColor}18` }]}>
                        <PlaneTakeoff size={18} color={primaryColor} />
                    </View>
                    <Text style={styles.serviceTitle}>Leave / OD</Text>
                    <Text style={styles.serviceSub}>Requests</Text>
                </TouchableOpacity>

                {user?.is_manager && (
                    <TouchableOpacity style={[styles.serviceCard, { borderColor: `${primaryColor}40`, borderWidth: 1.5 }]} onPress={() => navigation.navigate('TeamPortal', { email })}>
                        <View style={[styles.serviceIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                            <Users size={18} color="#10b981" />
                        </View>
                        <Text style={styles.serviceTitle}>Team</Text>
                        <Text style={styles.serviceSub}>Manage</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ENROLLMENT OVERLAY */}
            {needsEnrollment && (
                <View style={styles.enrollmentOverlay}>
                    <GlassCard style={styles.enrollmentCard}>
                        <View style={styles.lockCircle}>
                            <Shield color="#f43f5e" size={28} />
                        </View>
                        <Text style={styles.enrollmentTitle}>BIOMETRIC ENROLLMENT</Text>
                        <Text style={styles.enrollmentDesc}>Please enroll your face once to enable attendance features.</Text>
                        <TouchableOpacity style={[styles.enrollmentBtn, { backgroundColor: primaryColor }]} onPress={() => navigation.navigate('Profile', { email })}>
                            <Text style={styles.enrollmentBtnText}>ENROLL FACE DATA</Text>
                        </TouchableOpacity>
                    </GlassCard>
                </View>
            )}
        </ScrollView>
    );
};

const s = StyleSheet.create;
const styles = s({
    container: { flex: 1, backgroundColor: '#0f172a' },
    content: { paddingHorizontal: 18, paddingTop: 56, paddingBottom: 24 },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    profileButton: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    avatarMini: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    greeting: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
    userName: { color: 'white', fontSize: 15, fontWeight: '800', maxWidth: width * 0.45 },
    headerActions: { flexDirection: 'row', gap: 10 },
    iconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(99,102,241,0.12)', alignItems: 'center', justifyContent: 'center' },
    logoutButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(244,63,94,0.1)', alignItems: 'center', justifyContent: 'center' },

    // Pills
    pillsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
    pill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(30,41,59,0.6)', borderRadius: 18, padding: 12, borderWidth: 1 },
    pillIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    pillLabel: { color: '#475569', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
    pillValue: { fontSize: 11, fontWeight: '800', marginTop: 1 },

    // Analytics
    analyticsCard: { padding: 18, borderRadius: 24, marginBottom: 14 },
    analyticsTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    analyticsLeft: {},
    analyticsRight: { flex: 1 },
    hoursValue: { color: 'white', fontSize: 26, fontWeight: '900', lineHeight: 30 },
    hoursUnit: { fontSize: 12, color: '#64748b', fontWeight: '600' },
    hoursLabel: { color: '#64748b', fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 0.5 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    statusBadgeText: { fontSize: 9, fontWeight: '700', color: '#64748b' },
    analyticsGoal: { alignItems: 'flex-end', gap: 6 },
    goalRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    goalText: { color: '#64748b', fontSize: 10, fontWeight: '700' },
    goalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    goalBadgeText: { fontSize: 10, fontWeight: '900' },

    // Buttons
    buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    btnWrapper: { flex: 1 },
    actionBtn: {
        height: height * 0.16,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    checkOutBtn: { backgroundColor: '#f43f5e' },
    btnIconBox: {
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center',
    },
    btnText: { color: 'white', fontWeight: '900', fontSize: 13, letterSpacing: 0.8 },
    disabledBtn: { opacity: 0.35, backgroundColor: '#1e293b' },
    activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10b981' },

    // Services
    sectionLabel: { color: '#334155', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12 },
    serviceRow: { flexDirection: 'row', gap: 12 },
    serviceCard: {
        flex: 1, backgroundColor: 'rgba(30,41,59,0.5)', borderRadius: 22,
        padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    },
    serviceIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    serviceTitle: { color: 'white', fontSize: 12, fontWeight: '700', textAlign: 'center' },
    serviceSub: { color: '#475569', fontSize: 10, marginTop: 2, textAlign: 'center' },

    // Enrollment Overlay
    enrollmentOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,6,23,0.92)', zIndex: 100, alignItems: 'center', justifyContent: 'center', padding: 24 },
    enrollmentCard: { width: '100%', padding: 32, alignItems: 'center', borderRadius: 36 },
    lockCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(244,63,94,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    enrollmentTitle: { color: 'white', fontSize: 17, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
    enrollmentDesc: { color: '#94a3b8', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
    enrollmentBtn: { width: '100%', paddingVertical: 16, borderRadius: 18, alignItems: 'center' },
    enrollmentBtnText: { color: 'white', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
});

export default HomeScreen;
