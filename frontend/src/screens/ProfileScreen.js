import React, { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator, Image, Dimensions, StatusBar } from 'react-native';
import GlassCard from '../components/GlassCard';
import { User, Mail, Shield, ChevronRight, LogOut, ArrowLeft, Award, Settings, Lock, Camera, Briefcase, Building2, Calendar as CalendarIcon } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { getFriendlyErrorMessage } from '../utils/errorUtils';
import { LinearGradient } from 'expo-linear-gradient';
import * as Reanimated from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const Animated = Reanimated.default || Reanimated;

const ProfileScreen = ({ route, navigation }) => {
    const { theme: orgTheme } = useTheme();
    const primaryColor = orgTheme.primaryColor || '#6366f1';

    const { email } = route.params || {};
    const [isModalVisible, setModalVisible] = useState(false);
    const [password, setPassword] = useState('');
    const [updating, setUpdating] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const savedUser = await SecureStore.getItemAsync('userData');
                if (savedUser) setUser(JSON.parse(savedUser));
            } catch (e) { }
        };
        loadUser();
    }, []);

    const profileData = {
        name: user?.full_name || email?.split('@')[0] || 'Member',
        email: user?.email || email || 'member@enterprise.flow',
        id: user?.employee_id || '...',
        department: user?.department || 'Operations',
        designation: user?.designation || 'Staff',
        joined: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '...'
    };

    const handleReenrollment = async () => {
        if (!password) {
            Alert.alert("Required", "Please enter your password to continue.");
            return;
        }

        setUpdating(true);
        try {
            setModalVisible(false);
            navigation.navigate('AttendanceScan', {
                email,
                intendedType: 'update-face',
                verificationPassword: password
            });
        } catch (e) {
            Alert.alert("Error", getFriendlyErrorMessage(e));
        } finally {
            setUpdating(false);
            setPassword('');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <StatusBar barStyle="light-content" transparent />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={22} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Account Profile</Text>
                <TouchableOpacity style={styles.settingsButton}>
                    <Settings size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
            </View>

            <View style={styles.heroSection}>
                <View style={styles.avatarWrapper}>
                    <LinearGradient
                        colors={[`${primaryColor}40`, 'transparent']}
                        style={styles.avatarRing}
                    >
                        <View style={styles.avatarInner}>
                            {user?.profile_image ? (
                                <Image
                                    source={{ uri: `data:image/jpeg;base64,${user.profile_image}` }}
                                    style={styles.avatarImage}
                                />
                            ) : (
                                <User size={50} color="rgba(255,255,255,0.4)" strokeWidth={1.5} />
                            )}
                        </View>
                    </LinearGradient>
                    {/* Camera badge hidden until avatar upload is supported by backend */}
                    {/* <TouchableOpacity style={[styles.cameraBadge, { backgroundColor: primaryColor }]}>
                        <Camera size={14} color="white" />
                    </TouchableOpacity> */}
                </View>

                <Text style={styles.userNameText}>{profileData.name}</Text>
                <View style={styles.roleBadge}>
                    <Text style={[styles.roleText, { color: primaryColor }]}>{profileData.designation.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.gridSection}>
                <Text style={styles.sectionLabel}>ORGANIZATION DETAILS</Text>
                <View style={styles.grid}>
                    <GlassCard style={styles.gridItem}>
                        <Briefcase size={18} color={primaryColor} />
                        <Text style={styles.gridLabel}>Department</Text>
                        <Text style={styles.gridValue}>{profileData.department}</Text>
                    </GlassCard>
                    <GlassCard style={styles.gridItem}>
                        <Award size={18} color={primaryColor} />
                        <Text style={styles.gridLabel}>Employee ID</Text>
                        <Text style={styles.gridValue}>{profileData.id}</Text>
                    </GlassCard>
                </View>
            </View>

            <View style={styles.listSection}>
                <Text style={styles.sectionLabel}>PERSONAL INFORMATION</Text>
                <GlassCard style={styles.listCard}>
                    <View style={styles.listItem}>
                        <View style={styles.listIconBox}>
                            <Mail size={16} color="rgba(255,255,255,0.5)" />
                        </View>
                        <View style={styles.listTextContainer}>
                            <Text style={styles.listLabel}>Primary Email</Text>
                            <Text style={styles.listValue}>{profileData.email}</Text>
                        </View>
                    </View>
                    <View style={styles.listDivider} />
                    <View style={styles.listItem}>
                        <View style={styles.listIconBox}>
                            <CalendarIcon size={16} color="rgba(255,255,255,0.5)" />
                        </View>
                        <View style={styles.listTextContainer}>
                            <Text style={styles.listLabel}>Member Since</Text>
                            <Text style={styles.listValue}>{profileData.joined}</Text>
                        </View>
                    </View>
                </GlassCard>
            </View>

            <View style={styles.listSection}>
                <Text style={styles.sectionLabel}>SECURITY & PRIVACY</Text>
                <GlassCard style={styles.listCard}>
                    <TouchableOpacity style={styles.listItem} onPress={() => setModalVisible(true)}>
                        <View style={styles.listIconBox}>
                            <Lock size={16} color={primaryColor} />
                        </View>
                        <View style={styles.listTextContainer}>
                            <Text style={styles.listValue}>Biometric Re-enrollment</Text>
                        </View>
                        <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                    </TouchableOpacity>
                </GlassCard>
            </View>

            <TouchableOpacity
                style={styles.logoutBtn}
                onPress={async () => {
                    try {
                        await Promise.all([
                            SecureStore.deleteItemAsync('userEmail'),
                            SecureStore.deleteItemAsync('userPassword'),
                            SecureStore.deleteItemAsync('userToken'),
                            SecureStore.deleteItemAsync('userData')
                        ]);
                        navigation.navigate('Login');
                    } catch (e) {
                        navigation.navigate('Login');
                    }
                }}
            >
                <LogOut size={18} color="#f43f5e" />
                <Text style={styles.logoutBtnText}>Logout from Kiosk</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.versionLabel}>Enterprise Edition v2.5.0</Text>
                <View style={styles.footerLogo}>
                    <Shield size={10} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.footerText}>Secure Biometric Identity</Text>
                </View>
            </View>

            <Modal
                animationType="fade"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Security Check</Text>
                            <Text style={styles.modalSubtitle}>Please enter your password to unlock Biometric Re-enrollment.</Text>
                        </View>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Account Password"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancel}
                                onPress={() => { setModalVisible(false); setPassword(''); }}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalConfirm, { backgroundColor: primaryColor }]}
                                onPress={handleReenrollment}
                                disabled={updating}
                            >
                                {updating ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.modalConfirmText}>Verify</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 },
    headerTitle: { color: 'white', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
    backButton: { padding: 4 },
    settingsButton: { padding: 4 },
    heroSection: { alignItems: 'center', marginBottom: 40 },
    avatarWrapper: { position: 'relative', marginBottom: 20 },
    avatarRing: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center' },
    avatarInner: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(15, 23, 42, 0.8)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    cameraBadge: { position: 'absolute', bottom: 5, right: 5, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#020617' },
    userNameText: { color: 'white', fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8 },
    roleBadge: { backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    roleText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
    sectionLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 16, marginLeft: 4 },
    gridSection: { marginBottom: 32 },
    grid: { flexDirection: 'row', gap: 16 },
    gridItem: { flex: 1, padding: 16, borderRadius: 20, gap: 8 },
    gridLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700' },
    gridValue: { color: 'white', fontSize: 14, fontWeight: '800' },
    listSection: { marginBottom: 32 },
    listCard: { borderRadius: 24, paddingVertical: 8 },
    listItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    listIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    listTextContainer: { flex: 1 },
    listLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '700', marginBottom: 2, textTransform: 'uppercase' },
    listValue: { color: 'white', fontSize: 14, fontWeight: '600' },
    listDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 68 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 20, backgroundColor: 'rgba(244, 63, 94, 0.05)', borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.1)', marginTop: 8 },
    logoutBtnText: { color: '#f43f5e', fontWeight: '800', fontSize: 14, marginLeft: 10 },
    footer: { marginTop: 40, alignItems: 'center', gap: 8 },
    versionLabel: { color: 'rgba(255,255,255,0.15)', fontSize: 11, fontWeight: '700' },
    footerLogo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerText: { color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.95)', justifyContent: 'center', padding: 24 },
    modalCard: { padding: 30, borderRadius: 32, gap: 24 },
    modalHeader: { gap: 8 },
    modalTitle: { color: 'white', fontSize: 22, fontWeight: '900' },
    modalSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 22 },
    modalInput: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 18, color: 'white', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalCancel: { flex: 1, padding: 18, borderRadius: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
    modalConfirm: { flex: 1, padding: 18, borderRadius: 16, alignItems: 'center' },
    modalCancelText: { color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
    modalConfirmText: { color: 'white', fontWeight: '900' }
});

export default ProfileScreen;
