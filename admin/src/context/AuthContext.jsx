import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        const storedUser = localStorage.getItem('admin_user');
        const storedOrg = localStorage.getItem('admin_org');

        if (token && storedUser) {
            setAdmin(JSON.parse(storedUser));
            if (storedOrg) {
                setOrganization(JSON.parse(storedOrg));
            }
        }
        setLoading(false);
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
            return false;
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
