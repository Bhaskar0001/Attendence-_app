import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Production API URL is set via EXPO_PUBLIC_API_URL in .env
// For local dev: set EXPO_PUBLIC_API_URL=http://<your-local-ip>:8001 in .env
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001';


const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds for face processing
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for token injection
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (e) {
            console.error("[API] Failed to fetch token from SecureStore", e);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling 401s (Unauthorized)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            // Potential session expiration - clear stale token
            try {
                await SecureStore.deleteItemAsync('userToken');
            } catch (e) { }
        }
        return Promise.reject(error);
    }
);


// Call this on app start to verify connectivity
export const testConnection = async () => {
    try {
        await api.get('/');
        return true;
    } catch (e) {
        return false;
    }
};

export const registerUser = async (fullName, email, password, employeeId, designation, department, faceImage, deviceId) => {
    const response = await api.post('/register', {
        full_name: fullName,
        email: email,
        password: password,
        employee_id: employeeId,
        designation: designation,
        department: department,
        face_image: faceImage,
        device_id: deviceId,
    });
    return response.data;
};

export const loginUser = async (email, password, deviceId, organizationId = null) => {
    const body = { email, password, device_id: deviceId };
    if (organizationId) body.organization_id = organizationId;
    const response = await api.post('/login', body);
    return response.data;
};

export const getProfile = async (token) => {
    // Note: Bearer is now handled by interceptor, but we keep this for backward compatibility if needed
    const response = await api.get(`/me?token=${token}`);
    return response.data;
};

export const verifyPresence = async (email, imageBase64, lat, long, wifiBssid, wifiSsid, wifiStrength, deviceId) => {
    const response = await api.post('/verify-presence', {
        email,
        image: imageBase64,
        lat,
        long,
        wifi_bssid: wifiBssid || '',
        wifi_ssid: wifiSsid || '',
        wifi_strength: wifiStrength || -50,
        device_id: deviceId,
    });
    return response.data;
};

export const smartAttendance = async (imageBase64, lat, long, wifiBssid, wifiSsid, wifiStrength, email = "smart@auto.com", address = null, intendedType = null, deviceId = null, mockDetected = false) => {
    const response = await api.post('/smart-attendance', {
        email: email,
        image: imageBase64,
        lat,
        long,
        wifi_bssid: wifiBssid || '',
        wifi_ssid: wifiSsid || '',
        wifi_strength: wifiStrength || -50,
        address: address,
        intended_type: intendedType,
        device_id: deviceId,
        mock_detected: mockDetected
    });
    return response.data;
};

export const getAttendanceLogs = async (email) => {
    const response = await api.get(`/logs/${email}`);
    return response.data;
};

export const getAttendanceHistory = async (email) => {
    // Alias for getAttendanceLogs to match screen usage
    const response = await api.get(`/logs/${email}`);
    return response.data;
};

export const getSystemSettings = async () => {
    const response = await api.get('/settings');
    return response.data;
};

export const getAnalytics = async () => {
    const response = await api.get(`/analytics/me`);
    return response.data;
};

export const updateFace = async (email, password, faceImageBase64, lat, long, wifiBssid, wifiSsid, wifiStrength, deviceId) => {
    const response = await api.post('/update-face', {
        email,
        password,
        face_image: faceImageBase64,
        lat,
        long,
        wifi_bssid: wifiBssid || '',
        wifi_ssid: wifiSsid || '',
        wifi_strength: wifiStrength || -50,
        device_id: deviceId,
    });
    return response.data;
};

export const searchOrganizations = async (query) => {
    const response = await api.get(`/organizations/search?q=${query}`);
    return response.data;
};

// --- Leave / OD Management ---
export const createLeaveRequest = async (leaveType, startDate, endDate, reason, proofUrl = null) => {
    const response = await api.post('/api/leave/request', {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason,
        proof_url: proofUrl
    });
    return response.data;
};

export const getMyLeaveRequests = async () => {
    const response = await api.get('/api/leave/my-requests');
    return response.data;
};

export const getLeaveDiscussion = async (requestId) => {
    const response = await api.get(`/api/leave/requests/${requestId}/discussion`);
    return response.data;
};

export const postLeaveMessage = async (requestId, message) => {
    const response = await api.post(`/api/leave/requests/${requestId}/message`, { message });
    return response.data;
};

export default api;
