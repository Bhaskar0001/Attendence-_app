import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: inject admin token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        config._retryCount = config._retryCount || 0;
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: 401 auto-logout + retry on 5xx / network errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config, response } = error;

        // Auto-logout on 401
        if (response && response.status === 401) {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            localStorage.removeItem('admin_org');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // Retry logic for network errors or 5xx (max 2 retries)
        const MAX_RETRIES = 2;
        if (config && config._retryCount < MAX_RETRIES) {
            const isNetworkError = !response;
            const isServerError = response && response.status >= 500;
            if (isNetworkError || isServerError) {
                config._retryCount += 1;
                const delay = Math.pow(2, config._retryCount) * 500;
                await new Promise(resolve => setTimeout(resolve, delay));
                return api(config);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
