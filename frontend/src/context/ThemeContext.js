
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const ThemeContext = createContext();

export const defaultTheme = {
    primaryColor: '#3b82f6', // Default Blue
    secondaryColor: '#1e293b', // Slate 800
    backgroundColor: '#0f172a', // Slate 900
    logoUrl: null,
    orgName: 'OfficeFlow',
    orgId: null,
    orgSlug: null
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(defaultTheme);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const storedOrg = await SecureStore.getItemAsync('selected_org');
            if (storedOrg) {
                const orgData = JSON.parse(storedOrg);
                updateTheme(orgData);
            }
        } catch (error) {
            console.error("Failed to load theme:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateTheme = (orgData) => {
        // orgData should match the backend response structure
        // { id, name, slug, logo_url, primary_color }
        const newTheme = {
            ...defaultTheme,
            primaryColor: orgData.primary_color || defaultTheme.primaryColor,
            logoUrl: orgData.logo_url,
            orgName: orgData.name,
            orgId: orgData.id,
            orgSlug: orgData.slug
        };
        setTheme(newTheme);
    };

    const selectOrganization = async (orgData) => {
        updateTheme(orgData);
        await SecureStore.setItemAsync('selected_org', JSON.stringify(orgData));
    };

    const resetTheme = async () => {
        setTheme(defaultTheme);
        await SecureStore.deleteItemAsync('selected_org');
    };

    return (
        <ThemeContext.Provider value={{ theme, selectOrganization, resetTheme, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
