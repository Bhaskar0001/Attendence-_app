import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { theme } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import {
    Calendar,
    MessageSquare,
    ChevronLeft,
    Send,
    Clock,
    CheckCircle2,
    XCircle,
    ClipboardList,
    Plus,
    Camera,
    Image as ImageIcon,
    Trash2
} from 'lucide-react-native';
import { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import api from '../utils/api';

const { width } = Dimensions.get('window');

const LeaveRequestScreen = ({ navigation, route }) => {
    const { email } = route.params;
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [leaveType, setLeaveType] = useState('sick');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [proofPhoto, setProofPhoto] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const cameraRef = useRef(null);
    const [submitting, setSubmitting] = useState(false);

    // Discussion state
    const [activeDiscussion, setActiveDiscussion] = useState(null);
    const [chatMessage, setChatMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);

    useEffect(() => {
        fetchMyRequests();
    }, []);

    const fetchMyRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/leave/my-requests');
            setRequests(res.data);
        } catch (err) {
            console.error('Failed to fetch requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!startDate || !endDate || !reason) {
            Alert.alert("Missing Info", "Please fill all fields.");
            return;
        }
        try {
            setSubmitting(true);
            await api.post('/api/leave/request', {
                leave_type: leaveType,
                start_date: startDate,
                end_date: endDate,
                reason: reason,
                proof_url: proofPhoto ? `data:image/jpeg;base64,${proofPhoto.base64}` : null
            });
            setShowForm(false);
            fetchMyRequests();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err) {
            Alert.alert("Error", "Failed to submit request.");
        } finally {
            setSubmitting(false);
        }
    };

    const sendMessage = async () => {
        if (!chatMessage.trim() || !activeDiscussion) return;
        try {
            setSendingMessage(true);
            await api.post(`/api/leave/requests/${activeDiscussion._id}/message`, {
                message: chatMessage
            });
            setChatMessage('');
            // Refresh discussion
            const res = await api.get(`/api/leave/requests/${activeDiscussion._id}/discussion`);
            setActiveDiscussion({ ...activeDiscussion, discussion: res.data });
        } catch (err) {
            console.error(err);
        } finally {
            setSendingMessage(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return '#10b981';
            case 'rejected': return '#f43f5e';
            case 'cancelled': return '#64748b';
            default: return '#f59e0b';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color="white" size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Leaves & OD</Text>
                <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.addButton}>
                    <Plus color="white" size={24} />
                </TouchableOpacity>
            </View>

            {showForm ? (
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.formContainer}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <GlassCard style={styles.formCard}>
                            <Text style={styles.sectionTitle}>Request Approval</Text>

                            <Text style={styles.label}>Type</Text>
                            <View style={styles.typeRow}>
                                {['sick', 'casual', 'on_duty'].map(t => (
                                    <TouchableOpacity
                                        key={t}
                                        onPress={() => setLeaveType(t)}
                                        style={[styles.typeBtn, leaveType === t && styles.typeBtnActive]}
                                    >
                                        <Text style={[styles.typeBtnText, leaveType === t && styles.typeBtnTextActive]}>{t.replace('_', ' ').toUpperCase()}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Dates (YYYY-MM-DD)</Text>
                            <View style={styles.dateRow}>
                                <TextInput
                                    style={styles.inputHalf}
                                    placeholder="Start Date"
                                    placeholderTextColor="#475569"
                                    value={startDate}
                                    onChangeText={setStartDate}
                                />
                                <TextInput
                                    style={styles.inputHalf}
                                    placeholder="End Date"
                                    placeholderTextColor="#475569"
                                    value={endDate}
                                    onChangeText={setEndDate}
                                />
                            </View>

                            <Text style={styles.label}>Reason</Text>
                            <TextInput
                                style={styles.textArea}
                                multiline
                                placeholder="Explain briefly..."
                                placeholderTextColor="#475569"
                                value={reason}
                                onChangeText={setReason}
                            />

                            <Text style={styles.label}>Proof (Optional)</Text>
                            {proofPhoto ? (
                                <View style={styles.proofPreviewContainer}>
                                    <Image source={{ uri: proofPhoto.uri }} style={styles.proofPreview} />
                                    <TouchableOpacity
                                        style={styles.removeProofBtn}
                                        onPress={() => setProofPhoto(null)}
                                    >
                                        <Trash2 color="white" size={16} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.addProofBtn}
                                    onPress={() => setShowCamera(true)}
                                >
                                    <Camera color="#6366f1" size={24} />
                                    <Text style={styles.addProofText}>TAKE PROOF PHOTO</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                                {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>SUBMIT REQUEST</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                                <Text style={styles.cancelBtnText}>CANCEL</Text>
                            </TouchableOpacity>
                        </GlassCard>
                    </ScrollView>
                </KeyboardAvoidingView>
            ) : showCamera ? (
                <View style={styles.cameraContainer}>
                    <CameraView ref={cameraRef} style={styles.camera} facing="back">
                        <View style={styles.cameraOverlay}>
                            <TouchableOpacity style={styles.closeCameraBtn} onPress={() => setShowCamera(false)}>
                                <XCircle color="white" size={32} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.captureBtn}
                                onPress={async () => {
                                    if (cameraRef.current) {
                                        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
                                        setProofPhoto(photo);
                                        setShowCamera(false);
                                    }
                                }}
                            >
                                <View style={styles.captureBtnInner} />
                            </TouchableOpacity>
                        </View>
                    </CameraView>
                </View>
            ) : activeDiscussion ? (
                <View style={styles.chatContainer}>
                    <View style={styles.chatHeader}>
                        <TouchableOpacity onPress={() => setActiveDiscussion(null)}>
                            <ChevronLeft color="white" size={24} />
                        </TouchableOpacity>
                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.chatTitle}>Discussion Channel</Text>
                            <Text style={styles.chatSubtitle}>{activeDiscussion.leave_type.toUpperCase()} - {activeDiscussion.status}</Text>
                        </View>
                    </View>

                    <ScrollView style={styles.messageList} contentContainerStyle={{ padding: 20 }}>
                        {activeDiscussion.discussion.map((msg, i) => (
                            <View key={i} style={[styles.messageBubble, msg.role === 'employee' ? styles.myMessage : styles.adminMessage]}>
                                <Text style={styles.messageText}>{msg.message}</Text>
                                <Text style={styles.messageTime}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.chatInputRow}>
                        <TextInput
                            style={styles.chatInput}
                            placeholder="Type a message..."
                            placeholderTextColor="#64748b"
                            value={chatMessage}
                            onChangeText={setChatMessage}
                        />
                        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={sendingMessage}>
                            <Send color="white" size={20} />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContainer}>
                    {requests.length > 0 ? (
                        requests.map((req) => (
                            <TouchableOpacity key={req._id} onPress={() => setActiveDiscussion(req)}>
                                <GlassCard style={styles.requestCard}>
                                    <View style={styles.cardHeader}>
                                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(req.status) }]} />
                                        <Text style={[styles.statusText, { color: getStatusColor(req.status) }]}>{req.status.toUpperCase()}</Text>
                                        <Text style={styles.dateText}>{new Date(req.created_at).toLocaleDateString()}</Text>
                                    </View>
                                    <Text style={styles.cardType}>{req.leave_type.replace('_', ' ').toUpperCase()}</Text>
                                    <Text style={styles.cardRange}>{req.start_date} → {req.end_date}</Text>
                                    <Text style={styles.cardReason} numberOfLines={1}>{req.reason}</Text>

                                    <View style={styles.cardFooter}>
                                        <View style={styles.msgIndicator}>
                                            <MessageSquare size={14} color="#94a3b8" />
                                            <Text style={styles.msgCount}>{req.discussion?.length || 0} messages</Text>
                                        </View>
                                        <ChevronLeft size={20} color="#334155" style={{ transform: [{ rotate: '180deg' }] }} />
                                    </View>
                                </GlassCard>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <ClipboardList color="#1e293b" size={64} style={{ marginBottom: 20 }} />
                            <Text style={styles.emptyText}>No requests yet.</Text>
                            <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowForm(true)}>
                                <Text style={styles.emptyAddText}>Create First Request</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    title: { color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
    addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
    listContainer: { padding: 20 },
    requestCard: { padding: 20, marginBottom: 16, borderRadius: 32 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1, flex: 1 },
    dateText: { fontSize: 10, color: '#475569', fontWeight: 'bold' },
    cardType: { color: 'white', fontSize: 16, fontWeight: '900', marginBottom: 4 },
    cardRange: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 8 },
    cardReason: { color: '#475569', fontSize: 12 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)' },
    msgIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    msgCount: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' },
    formContainer: { flex: 1, padding: 20 },
    formCard: { padding: 30, borderRadius: 40 },
    sectionTitle: { color: 'white', fontSize: 20, fontWeight: '900', marginBottom: 24, textAlign: 'center' },
    label: { color: '#94a3b8', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 10, marginTop: 16 },
    typeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    typeBtn: { flex: 1, height: 44, borderRadius: 15, borderWeight: 1, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
    typeBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
    typeBtnText: { color: '#475569', fontSize: 10, fontWeight: '900' },
    typeBtnTextActive: { color: 'white' },
    dateRow: { flexDirection: 'row', gap: 12 },
    inputHalf: { flex: 1, height: 54, backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: 16, paddingHorizontal: 16, color: 'white', fontWeight: '600', borderWidth: 1, borderColor: '#1e293b' },
    textArea: { height: 100, backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: 16, padding: 16, color: 'white', fontWeight: '600', borderWidth: 1, borderColor: '#1e293b', textAlignVertical: 'top' },
    submitBtn: { height: 60, backgroundColor: '#6366f1', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 32, shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    submitBtnText: { color: 'white', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    cancelBtn: { paddingVertical: 16, alignItems: 'center' },
    cancelBtnText: { color: '#475569', fontWeight: 'bold', fontSize: 12 },
    chatContainer: { flex: 1 },
    chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    chatTitle: { color: 'white', fontSize: 16, fontWeight: '900' },
    chatSubtitle: { color: '#64748b', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    messageList: { flex: 1 },
    messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 20, marginBottom: 12 },
    myMessage: { alignSelf: 'flex-end', backgroundColor: '#6366f1', borderBottomRightRadius: 2 },
    adminMessage: { alignSelf: 'flex-start', backgroundColor: '#1e293b', borderBottomLeftRadius: 2 },
    messageText: { color: 'white', fontSize: 13, lineHeight: 18 },
    messageTime: { fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'right' },
    chatInputRow: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#0f172a', paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
    chatInput: { flex: 1, height: 50, backgroundColor: '#1e293b', borderRadius: 25, paddingHorizontal: 20, color: 'white' },
    sendBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 400 },
    emptyText: { color: '#475569', fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
    emptyAddBtn: { backgroundColor: 'rgba(99, 102, 241, 0.1)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.2)' },
    emptyAddText: { color: '#6366f1', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
    addProofBtn: { height: 100, backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
    addProofText: { color: '#6366f1', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    proofPreviewContainer: { marginTop: 10, position: 'relative' },
    proofPreview: { width: '100%', height: 200, borderRadius: 16 },
    removeProofBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(244, 63, 94, 0.8)', padding: 8, borderRadius: 12 },
    cameraContainer: { flex: 1, backgroundColor: 'black' },
    camera: { flex: 1 },
    cameraOverlay: { flex: 1, justifyContent: 'space-between', padding: 40, alignItems: 'center' },
    closeCameraBtn: { alignSelf: 'flex-start' },
    captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
    captureBtnInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white' }
});

export default LeaveRequestScreen;
