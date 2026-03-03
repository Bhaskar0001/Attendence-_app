import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Image, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import { ChevronLeft, Users, Clock, PlaneTakeoff, CheckCircle2, XCircle, MessageSquare } from 'lucide-react-native';
import api from '../utils/api'; // Using the centralized api utility
import { theme as globalTheme } from '../utils/theme';

const TeamPortalScreen = ({ navigation, route }) => {
    const { theme } = useTheme();
    const primaryColor = theme.primaryColor || '#6366f1';
    const [subordinates, setSubordinates] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('attendance');

    useEffect(() => {
        fetchTeamData();
    }, []);

    const fetchTeamData = async () => {
        setLoading(true);
        try {
            // Fetch team attendance and leave requests
            const [teamRes, leaveRes] = await Promise.all([
                api.get('/api/manager/team-attendance'),
                api.get('/api/manager/pending-leaves')
            ]);
            setSubordinates(teamRes.data || []);
            setLeaveRequests(leaveRes.data || []);
        } catch (error) {
            console.error("Failed to fetch team data", error);
            // Fallback for demo if endpoints not yet ready
            setSubordinates([
                { id: '1', full_name: 'John Doe', status: 'check-in', last_time: '09:00 AM', email: 'john@example.com' },
                { id: '2', full_name: 'Jane Smith', status: 'check-out', last_time: '05:30 PM', email: 'jane@example.com' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveAction = async (requestId, action) => {
        try {
            await api.post(`/api/leave/request/${requestId}/approve`, { status: action });
            Alert.alert("Success", `Request ${action === 'approved' ? 'approved' : 'rejected'}`);
            fetchTeamData();
        } catch (error) {
            Alert.alert("Error", "Failed to update request");
        }
    };

    const renderAttendanceItem = ({ item }) => (
        <GlassCard style={styles.memberCard}>
            <View style={styles.memberInfo}>
                <View style={[styles.avatar, { backgroundColor: primaryColor }]}>
                    <Text style={styles.avatarText}>{item.full_name.charAt(0)}</Text>
                </View>
                <View>
                    <Text style={styles.memberName}>{item.full_name}</Text>
                    <Text style={styles.memberEmail}>{item.email}</Text>
                </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'check-in' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)' }]}>
                <Text style={[styles.statusText, { color: item.status === 'check-in' ? '#10b981' : '#f43f5e' }]}>
                    {item.status === 'check-in' ? 'ACTIVE' : 'AWAY'}
                </Text>
                <Text style={styles.timeText}>{item.last_time}</Text>
            </View>
        </GlassCard>
    );

    const renderLeaveItem = ({ item }) => (
        <GlassCard style={styles.leaveCard}>
            <View style={styles.leaveHeader}>
                <View style={styles.leaveUser}>
                    <PlaneTakeoff size={20} color={primaryColor} />
                    <Text style={styles.leaveTitle}>{item.full_name}</Text>
                </View>
                <Text style={styles.leaveDate}>{item.start_date} - {item.end_date}</Text>
            </View>
            <Text style={styles.leaveReason} numberOfLines={2}>{item.reason}</Text>
            <View style={styles.leaveActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#10b981' }]}
                    onPress={() => handleLeaveAction(item.id, 'approved')}
                >
                    <CheckCircle2 size={18} color="#10b981" />
                    <Text style={[styles.actionBtnText, { color: '#10b981' }]}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#f43f5e' }]}
                    onPress={() => handleLeaveAction(item.id, 'rejected')}
                >
                    <XCircle size={18} color="#f43f5e" />
                    <Text style={[styles.actionBtnText, { color: '#f43f5e' }]}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#94a3b8' }]}
                    onPress={() => navigation.navigate('LeaveDiscussion', { requestId: item.id })}
                >
                    <MessageSquare size={18} color="#94a3b8" />
                    <Text style={[styles.actionBtnText, { color: '#94a3b8' }]}>Chat</Text>
                </TouchableOpacity>
            </View>
        </GlassCard>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color="white" size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Team Portal</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'attendance' && { borderBottomColor: primaryColor, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('attendance')}
                >
                    <Clock size={20} color={activeTab === 'attendance' ? primaryColor : '#94a3b8'} />
                    <Text style={[styles.tabText, activeTab === 'attendance' && { color: primaryColor }]}>Attendance</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'leaves' && { borderBottomColor: primaryColor, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('leaves')}
                >
                    <PlaneTakeoff size={20} color={activeTab === 'leaves' ? primaryColor : '#94a3b8'} />
                    <Text style={[styles.tabText, activeTab === 'leaves' && { color: primaryColor }]}>Leaves</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={primaryColor} />
                </View>
            ) : (
                <FlatList
                    data={activeTab === 'attendance' ? subordinates : leaveRequests}
                    renderItem={activeTab === 'attendance' ? renderAttendanceItem : renderLeaveItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Users size={48} color="rgba(255,255,255,0.1)" />
                            <Text style={styles.emptyText}>No active {activeTab} records</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, marginBottom: 20 },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: '800' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 8 },
    tabText: { color: '#94a3b8', fontSize: 14, fontWeight: '700' },
    listContent: { padding: 20 },
    memberCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 20, marginBottom: 12 },
    memberInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: 'white', fontSize: 18, fontWeight: '800' },
    memberName: { color: 'white', fontSize: 16, fontWeight: '700' },
    memberEmail: { color: '#64748b', fontSize: 12 },
    statusBadge: { alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    statusText: { fontSize: 10, fontWeight: '900' },
    timeText: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
    leaveCard: { padding: 16, borderRadius: 20, marginBottom: 12 },
    leaveHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    leaveUser: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    leaveTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
    leaveDate: { color: '#94a3b8', fontSize: 12 },
    leaveReason: { color: '#94a3b8', fontSize: 14, lineHeight: 20, marginBottom: 16 },
    leaveActions: { flexDirection: 'row', gap: 10 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
    actionBtnText: { fontSize: 12, fontWeight: '700' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#64748b', fontSize: 16, marginTop: 16 }
});

export default TeamPortalScreen;
