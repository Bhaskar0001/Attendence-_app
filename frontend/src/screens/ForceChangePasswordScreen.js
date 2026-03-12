import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
    Platform, Alert, ActivityIndicator, StyleSheet
} from 'react-native';
import GlassCard from '../components/GlassCard';
import { Lock, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';

const ForceChangePasswordScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const primaryColor = theme.primaryColor || '#6366f1';

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const performPasswordChange = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Incomplete', 'Please fill all password fields.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            // Include token from secure storage manually if needed, or rely on axios interceptors.
            const token = await SecureStore.getItemAsync('userToken');
            const res = await api.post('/api/me/change-password',
                { old_password: oldPassword, new_password: newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.status === 'success') {
                const userDataStr = await SecureStore.getItemAsync('userData');
                if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    userData.force_password_change = false;
                    await SecureStore.setItemAsync('userData', JSON.stringify(userData));

                    Alert.alert('Success', 'Password updated successfully.', [
                        {
                            text: 'Continue', onPress: () => {
                                navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
                            }
                        }
                    ]);
                } else {
                    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                }
            }
        } catch (e) {
            let errorMsg = 'Failed to update password.';
            if (e.response?.data?.detail) {
                errorMsg = typeof e.response.data.detail === 'string'
                    ? e.response.data.detail
                    : JSON.stringify(e.response.data.detail);
            }
            Alert.alert('Action Failed', errorMsg);
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
                            <Text style={styles.title}>Update Required</Text>
                            <Text style={styles.subtitle}>
                                For security reasons, you must change your default password before accessing the system.
                            </Text>
                        </View>

                        <GlassCard style={styles.card}>
                            <Text style={styles.cardTitle}>Set New Password</Text>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Current Password</Text>
                                <View style={styles.inputContainer}>
                                    <Lock size={18} color={primaryColor} />
                                    <TextInput
                                        placeholder="••••••••"
                                        placeholderTextColor="#94a3b8"
                                        style={styles.input}
                                        value={oldPassword}
                                        onChangeText={setOldPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>New Password</Text>
                                <View style={styles.inputContainer}>
                                    <Lock size={18} color={primaryColor} />
                                    <TextInput
                                        placeholder="••••••••"
                                        placeholderTextColor="#94a3b8"
                                        style={styles.input}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Confirm New Password</Text>
                                <View style={styles.inputContainer}>
                                    <Lock size={18} color={primaryColor} />
                                    <TextInput
                                        placeholder="••••••••"
                                        placeholderTextColor="#94a3b8"
                                        style={styles.input}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: primaryColor }, loading && styles.buttonDisabled]}
                                onPress={performPasswordChange}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Text style={styles.buttonText}>Confirm Change</Text>
                                        <ArrowRight size={20} color="white" style={{ marginLeft: 10 }} />
                                    </>
                                )}
                            </TouchableOpacity>
                        </GlassCard>
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
    title: { color: '#f8fafc', fontSize: 26, fontWeight: 'bold', textAlign: 'center' },
    subtitle: { color: '#94a3b8', fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 20 },
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
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default ForceChangePasswordScreen;
