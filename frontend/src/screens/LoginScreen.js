import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
    Platform, Alert, ActivityIndicator, StyleSheet, Image, Dimensions
} from 'react-native';
import GlassCard from '../components/GlassCard';
import { Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import { loginUser } from '../utils/api';
import { getFriendlyErrorMessage } from '../utils/errorUtils';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
    const { theme, resetTheme } = useTheme();
    const primaryColor = theme.primaryColor || '#6366f1';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkSavedCredentials = async () => {
            try {
                const savedEmail = await SecureStore.getItemAsync('userEmail');
                const savedPass = await SecureStore.getItemAsync('userPassword');
                if (savedEmail && savedPass) {
                    setEmail(savedEmail);
                    setPassword(savedPass);
                }
            } catch (e) {
                // Silently fail if persistence check errors
            }
        };
        checkSavedCredentials();
    }, []);

    const performLogin = async () => {
        if (!email || !password) {
            Alert.alert('Incomplete', 'Please provide both email and password.');
            return;
        }
        setLoading(true);
        try {
            const deviceId = Platform.OS === 'android' ?
                Application.androidId :
                await Application.getIosIdForVendorAsync();

            const data = await loginUser(email, password, deviceId, theme.orgId || null);

            // Save for future
            await SecureStore.setItemAsync('userEmail', email);
            await SecureStore.setItemAsync('userPassword', password);
            await SecureStore.setItemAsync('userToken', data.access_token);
            await SecureStore.setItemAsync('userData', JSON.stringify(data.user));

            navigation.navigate('Home', {
                email: email,
                token: data.access_token,
                user: data.user
            });
        } catch (e) {
            const errorMsg = getFriendlyErrorMessage(e, "Check your internet and try again.");
            Alert.alert('Access Denied', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.innerContainer}>
                        <View style={styles.header}>
                            <TouchableOpacity style={styles.logoContainer} onPress={resetTheme}>
                                {theme.logoUrl ? (
                                    <Image source={{ uri: theme.logoUrl }} style={styles.orgLogo} resizeMode="contain" />
                                ) : (
                                    <View style={[styles.defaultLogo, { backgroundColor: `${primaryColor}20` }]}>
                                        <ShieldCheck size={32} color={primaryColor} />
                                    </View>
                                )}
                            </TouchableOpacity>
                            <Text style={styles.title}>{theme.orgName}</Text>
                            <Text style={styles.subtitle}>
                                {theme.orgId ? 'Enterprise Desk Portal' : 'AI Attendance Network'}
                            </Text>
                        </View>

                        <GlassCard style={styles.card}>
                            <Text style={styles.cardTitle}>Sign In</Text>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Corporate Email</Text>
                                <View style={styles.inputContainer}>
                                    <Mail size={18} color={primaryColor} />
                                    <TextInput
                                        placeholder="user@enterprise.com"
                                        placeholderTextColor="#94a3b8"
                                        style={styles.input}
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Secure Password</Text>
                                <View style={styles.inputContainer}>
                                    <Lock size={18} color={primaryColor} />
                                    <TextInput
                                        placeholder="••••••••"
                                        placeholderTextColor="#94a3b8"
                                        style={styles.input}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: primaryColor }, loading && styles.buttonDisabled]}
                                onPress={performLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Text style={styles.buttonText}>Authenticate</Text>
                                        <ArrowRight size={20} color="white" style={{ marginLeft: 10 }} />
                                    </>
                                )}
                            </TouchableOpacity>
                        </GlassCard>

                        <View style={styles.footer}>
                            <View style={styles.securityBadge}>
                                <CheckCircle2 size={12} color="#10b981" />
                                <Text style={styles.securityText}>AES-256 Encrypted Session</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.changeOrg}
                                onPress={() => navigation.navigate('OrganizationSelect')}
                            >
                                <Text style={styles.changeOrgText}>Switch Organization</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { flex: 1 },
    keyboardView: { flex: 1 },
    innerContainer: { flex: 1, paddingHorizontal: 30, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 40 },
    logoContainer: { width: 80, height: 80, borderRadius: 24, overflow: 'hidden', marginBottom: 20 },
    orgLogo: { width: '100%', height: '100%' },
    defaultLogo: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    title: { color: '#f8fafc', fontSize: 28, fontWeight: 'bold' },
    subtitle: { color: '#94a3b8', fontSize: 14, marginTop: 5 },
    card: { padding: 30, borderRadius: 32 },
    cardTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '800', marginBottom: 25 },
    inputWrapper: { marginBottom: 20 },
    inputLabel: { color: '#64748b', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
    },
    input: { flex: 1, color: '#f8fafc', marginLeft: 12, fontSize: 15 },
    button: {
        flexDirection: 'row',
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    footer: { marginTop: 30, alignItems: 'center' },
    securityBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    securityText: { color: '#64748b', fontSize: 11, fontWeight: '600', marginLeft: 6 },
    changeOrg: { padding: 10 },
    changeOrgText: { color: '#94a3b8', fontSize: 13, fontWeight: '500', textDecorationLine: 'underline' }
});

export default LoginScreen;
