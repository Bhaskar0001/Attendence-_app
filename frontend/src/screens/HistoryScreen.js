import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Dimensions, StatusBar } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getAttendanceHistory } from '../utils/api';
import GlassCard from '../components/GlassCard';
import { Calendar, Clock, MapPin, ChevronLeft, Download, Filter, Search, ArrowRight, UserCheck, AlertCircle, FileText, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

const { width } = Dimensions.get('window');

const HistoryScreen = ({ route, navigation }) => {
    const { theme: orgTheme } = useTheme();
    const primaryColor = orgTheme.primaryColor || '#6366f1';

    const { email } = route.params || {};
    const [history, setHistory] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [historyData, analyticsData] = await Promise.all([
                getAttendanceHistory(email),
                getAnalytics(email)
            ]);
            setHistory(historyData.history || []);
            setAnalytics(analyticsData);
        } catch (error) {
            Alert.alert("History Unavailable", "Could not synchronize with enterprise records.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const generatePDF = async () => {
        try {
            const html = `
                <html>
                    <head>
                        <style>
                            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #1e293b; }
                            h1 { color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 10px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th { background-color: #f8fafc; text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; }
                            td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
                            .type-in { color: #10b981; font-weight: bold; }
                            .type-out { color: #f43f5e; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <h1>Attendance Audit Log</h1>
                        <p><strong>Member ID:</strong> ${email}</p>
                        <p><strong>Generation Date:</strong> ${new Date().toLocaleDateString()}</p>
                        <table>
                            <tr>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Event Type</th>
                                <th>Location</th>
                            </tr>
                            ${history.map(item => `
                                <tr>
                                    <td>${new Date(item.timestamp).toLocaleDateString()}</td>
                                    <td>${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td class="${item.type === 'IN' ? 'type-in' : 'type-out'}">${item.type}</td>
                                    <td>${item.location_name || 'Verified Zone'}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </body>
                </html>
            `;
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);
        } catch (error) {
            Alert.alert("PDF Export Failed", "Environmental error during document generation.");
        }
    };

    const renderItem = ({ item, index }) => {
        const date = new Date(item.timestamp);
        const isEntry = item.type === 'IN';

        return (
            <GlassCard style={styles.logCard}>
                <View style={styles.logLeft}>
                    <View style={[styles.typeIndicator, { backgroundColor: isEntry ? '#10b98120' : '#f43f5e20' }]}>
                        {isEntry ? <ArrowRight size={16} color="#10b981" /> : <ChevronLeft size={16} color="#f43f5e" />}
                    </View>
                    <View>
                        <Text style={styles.logType}>{isEntry ? 'Check In' : 'Check Out'}</Text>
                        <Text style={styles.logTime}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                </View>

                <View style={styles.logRight}>
                    <View style={styles.dateBox}>
                        <Text style={styles.dateDay}>{date.getDate()}</Text>
                        <Text style={styles.dateMonth}>{date.toLocaleString('default', { month: 'short' }).toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.locationInfo}>
                    <MapPin size={10} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.locationText} numberOfLines={1}>
                        {item.location_name || 'Enterprise Verified Zone'}
                    </Text>
                </View>
            </GlassCard>
        );
    };

    const stats = {
        total: analytics?.total_logs_week || history.length,
        today: history.filter(h => new Date(h.timestamp).toDateString() === new Date().toDateString()).length,
        onTime: analytics?.on_time_count || 0
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingCtn]}>
                <ActivityIndicator size="large" color={primaryColor} />
                <Text style={styles.loadingText}>Synchronizing Records...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" transparent />

            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Activity Audit</Text>
                    <Text style={styles.headerSubtitle}>{email}</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={generatePDF}>
                        <FileText size={20} color={primaryColor} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.goBack()}>
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.statsRow}>
                <GlassCard style={styles.statItem}>
                    <Text style={styles.statLabel}>TOTAL LOGS</Text>
                    <Text style={styles.statValue}>{stats.total}</Text>
                    <UserCheck size={14} color={primaryColor} style={styles.statIcon} />
                </GlassCard>
                <GlassCard style={styles.statItem}>
                    <Text style={styles.statLabel}>THIS WEEK</Text>
                    <Text style={styles.statValue}>{stats.today}</Text>
                    <CheckCircle2 size={14} color="#10b981" style={styles.statIcon} />
                </GlassCard>
            </View>

            <View style={styles.listContainer}>
                <View style={styles.listHeader}>
                    <Text style={styles.listTitle}>RECENT ACTIVITY</Text>
                    <TouchableOpacity style={styles.filterBtn}>
                        <Filter size={14} color="white" />
                        <Text style={styles.filterText}>Filter</Text>
                    </TouchableOpacity>
                </View>

                {history.length > 0 ? (
                    <FlatList
                        data={history}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => index.toString()}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        onRefresh={onRefresh}
                        refreshing={refreshing}
                        ListFooterComponent={<View style={{ height: 40 }} />}
                    />
                ) : (
                    <View style={styles.emptyState}>
                        <AlertCircle size={48} color="rgba(255,255,255,0.1)" />
                        <Text style={styles.emptyText}>No audit records found for this period.</Text>
                        <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: primaryColor }]} onPress={onRefresh}>
                            <Text style={styles.refreshBtnText}>Pull Latest Records</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <LinearGradient
                colors={['transparent', '#020617']}
                style={styles.bottomGradient}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    loadingCtn: { alignItems: 'center', justifyContent: 'center', gap: 16 },
    loadingText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, marginBottom: 32 },
    headerTitle: { color: 'white', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    headerSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' },
    headerActions: { flexDirection: 'row', gap: 12 },
    actionBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    statsRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 24, marginBottom: 32 },
    statItem: { flex: 1, padding: 16, borderRadius: 20, position: 'relative' },
    statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
    statValue: { color: 'white', fontSize: 22, fontWeight: '800' },
    statIcon: { position: 'absolute', top: 16, right: 16, opacity: 0.5 },
    listContainer: { flex: 1, borderTopLeftRadius: 40, borderTopRightRadius: 40, backgroundColor: 'rgba(15, 23, 42, 0.3)', paddingHorizontal: 24, paddingTop: 32 },
    listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 },
    listTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
    filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    filterText: { color: 'white', fontSize: 11, fontWeight: '700' },
    listContent: { gap: 16 },
    logCard: { padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
    logLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    typeIndicator: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    logType: { color: 'white', fontSize: 15, fontWeight: '700' },
    logTime: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '500' },
    logRight: { alignItems: 'flex-end' },
    dateBox: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    dateDay: { color: 'white', fontSize: 14, fontWeight: '800' },
    dateMonth: { color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '900' },
    locationInfo: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    locationText: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '500', flex: 1 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, opacity: 0.8 },
    emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '600', textAlign: 'center', maxWidth: 200 },
    refreshBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
    refreshBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
    bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, pointerEvents: 'none' }
});

export default HistoryScreen;
