import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifySession = async () => {
            const token = localStorage.getItem('admin_token');
            const storedUser = localStorage.getItem('admin_user');
            const storedOrg = localStorage.getItem('admin_org');

            if (token && storedUser) {
                // Optimistically set from local storage
                setAdmin(JSON.parse(storedUser));
                if (storedOrg) setOrganization(JSON.parse(storedOrg));

                // Fetch fresh profile for latest allowed_features
                try {
                    const res = await api.get('/admin/me');
                    setAdmin(res.data);
                    localStorage.setItem('admin_user', JSON.stringify(res.data));
                } catch (err) {
                    console.error("Session verification failed", err);
                    // if 401, we might want to logout, but for now just clear if needed.
                }
            }
            setLoading(false);
        };
        verifySession();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/admin/login', { email, password });
            const { access_token, user, organization } = response.data;


            localStorage.setItem('admin_token', access_token);
            localStorage.setItem('admin_user', JSON.stringify(user));

            setAdmin(user);

            if (organization) {
                localStorage.setItem('admin_org', JSON.stringify(organization));
                setOrganization(organization);
            } else {
                localStorage.removeItem('admin_org');
                setOrganization(null);
            }

            return true;
        } catch (err) {
            console.error('Login error:', err);
            throw err; // Re-throw to allow UI to map the error
        }
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_org');
        setAdmin(null);
        setOrganization(null);
    };

    return (
        <AuthContext.Provider value={{ admin, organization, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
