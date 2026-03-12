import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { testConnection } from './src/utils/api';
import * as SecureStore from 'expo-secure-store';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import AttendanceScanScreen from './src/screens/AttendanceScanScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LeaveRequestScreen from './src/screens/LeaveRequestScreen';
import OrganizationSelectScreen from './src/screens/OrganizationSelectScreen';
import TeamPortalScreen from './src/screens/TeamPortalScreen';
import LeaveDiscussionScreen from './src/screens/LeaveDiscussionScreen';

const Stack = createStackNavigator();

function AppContent() {
    const { theme, isLoading } = useTheme();

    const [hasToken, setHasToken] = React.useState(false);
    const [authLoading, setAuthLoading] = React.useState(true);
    const [forceChangeRoute, setForceChangeRoute] = React.useState(false);

    React.useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await SecureStore.getItemAsync('userToken');
                const userDataStr = await SecureStore.getItemAsync('userData');
                if (token && userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    if (userData.force_password_change) {
                        setForceChangeRoute(true);
                    }
                    setHasToken(true);
                } else {
                    setHasToken(false);
                }
            } catch (e) {
                setHasToken(false);
            } finally {
                setAuthLoading(false);
            }
        };
        checkAuth();
    }, []);

    if (isLoading || authLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.primaryColor || "#3b82f6"} />
            </View>
        );
    }

    const initialRoute = hasToken ? (forceChangeRoute ? "ForceChangePassword" : "Home") : (theme.orgId ? "Login" : "OrganizationSelect");

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={initialRoute}
                screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: theme.backgroundColor }
                }}
            >
                <Stack.Screen name="OrganizationSelect" component={OrganizationSelectScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="ForceChangePassword" component={require('./src/screens/ForceChangePasswordScreen').default} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="History" component={HistoryScreen} />
                <Stack.Screen name="AttendanceScan" component={AttendanceScanScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="LeaveRequest" component={LeaveRequestScreen} />
                <Stack.Screen name="TeamPortal" component={TeamPortalScreen} />
                <Stack.Screen name="LeaveDiscussion" component={LeaveDiscussionScreen} />
            </Stack.Navigator>
            <StatusBar style="light" />
        </NavigationContainer>
    );
}

export default function App() {
    console.log("[App] Initializing...");
    useEffect(() => {
        testConnection();
    }, []);

    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}
