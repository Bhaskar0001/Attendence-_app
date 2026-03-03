import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Search, ChevronRight, Building2, ShieldCheck } from 'lucide-react-native';
import { searchOrganizations } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

export default function OrganizationSelectScreen() {
    const navigation = useNavigation();
    const { selectOrganization } = useTheme();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);
        return () => clearTimeout(handler);
    }, [query]);

    useEffect(() => {
        if (debouncedQuery.length >= 2) {
            handleSearch(debouncedQuery);
        } else {
            setResults([]);
        }
    }, [debouncedQuery]);

    const handleSearch = async (text) => {
        setLoading(true);
        try {
            const data = await searchOrganizations(text);
            setResults(data);
        } catch (error) {
            // Search error handled silently
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (org) => {
        await selectOrganization(org);
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    const handleSkip = async () => {
        // Reset to default
        await selectOrganization({
            id: null,
            name: 'OfficeFlow',
            logo_url: null,
            primary_color: '#3b82f6',
            slug: null
        });
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => handleSelect(item)}
            className="flex-row items-center bg-slate-800/50 p-4 rounded-xl mb-3 border border-slate-700 active:bg-slate-800"
        >
            <View className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center mr-4 border border-slate-600">
                {item.logo_url ? (
                    <Image source={{ uri: item.logo_url }} className="w-8 h-8 rounded" resizeMode="contain" />
                ) : (
                    <Building2 size={24} color={item.primary_color || "#94a3b8"} />
                )}
            </View>
            <View className="flex-1">
                <Text className="text-white font-bold text-lg">{item.name}</Text>
                <Text className="text-slate-400 text-xs uppercase tracking-wider">{item.slug}</Text>
            </View>
            <ChevronRight size={20} color="#64748b" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#0f172a]">
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 p-6"
            >
                <View className="items-center mb-10 mt-10">
                    <View className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/30">
                        <ShieldCheck size={40} color="#3b82f6" />
                    </View>
                    <Text className="text-3xl font-bold text-white text-center">Find Your Workspace</Text>
                    <Text className="text-slate-400 text-center mt-2 px-4">
                        Search for your organization to access your employee portal.
                    </Text>
                </View>

                <View className="relative mb-6">
                    <Search size={20} color="#94a3b8" style={{ position: 'absolute', left: 16, top: 16, zIndex: 10 }} />
                    <TextInput
                        placeholder="Search Organization..."
                        placeholderTextColor="#64748b"
                        className="bg-slate-900 border border-slate-700 text-white rounded-2xl py-4 pl-12 pr-4 text-base"
                        value={query}
                        onChangeText={setQuery}
                        autoCapitalize="none"
                    />
                    {loading && (
                        <View style={{ position: 'absolute', right: 16, top: 16 }}>
                            <ActivityIndicator size="small" color="#3b82f6" />
                        </View>
                    )}
                </View>

                <FlatList
                    data={results}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    ListEmptyComponent={
                        query.length > 1 && !loading ? (
                            <Text className="text-center text-slate-500 mt-10">No organizations found</Text>
                        ) : null
                    }
                    className="flex-1"
                />

                <TouchableOpacity
                    onPress={handleSkip}
                    className="py-4 items-center"
                >
                    <Text className="text-slate-500 font-medium">I don't have an organization code</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
