import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
    Zap, Send, Users, Clock, Target, Star, AlarmClock,
    ChevronDown, History, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NUDGE_TYPES = [
    { key: 'general', label: 'General Message', icon: Send, color: '#6366f1', bg: 'bg-indigo-500/10' },
    { key: 'target_missed', label: 'Target Missed', icon: Target, color: '#f43f5e', bg: 'bg-rose-500/10' },
    { key: 'late_start', label: 'Late Start', icon: AlarmClock, color: '#f97316', bg: 'bg-orange-500/10' },
    { key: 'great_job', label: 'Great Job!', icon: Star, color: '#10b981', bg: 'bg-emerald-500/10' },
];

const QUICK_MESSAGES = {
    general: ['Please check in with status update.', 'Update your plan for today.', 'Team sync in 15 minutes.'],
    target_missed: ['Your daily visit target is not on track.', 'You have pending visits from plan.', 'Please complete your beat plan for today.'],
    late_start: ['Please check in — you are late today.', 'Your start time was missed. Contact me.', 'Heads up: day started 30 min ago.'],
    great_job: ['Excellent work today! Keep it up 🔥', 'Top performer this week — amazing!', 'You closed multiple deals today. Brilliant work!'],
};

export default function NudgeCenter() {
    const { admin, organization } = useAuth();
    const primaryColor = organization?.primary_color || '#6366f1';

    const [team, setTeam] = useState([]);
    const [selectedEmails, setSelectedEmails] = useState([]);
    const [nudgeType, setNudgeType] = useState('general');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('compose');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [teamRes, historyRes] = await Promise.allSettled([
                api.get('/admin/employees'),
                api.get('/admin/nudge/history'),
            ]);
            if (teamRes.status === 'fulfilled') {
                const fieldTeam = (teamRes.value.data || []).filter(e => e.employee_type === 'field');
                setTeam(fieldTeam);
            }
            if (historyRes.status === 'fulfilled') {
                setHistory(historyRes.value.data || []);
            }
        } catch (e) {
            console.error('Failed to fetch nudge data', e);
        } finally {
            setLoading(false);
        }
    };

    const toggleMember = (email) => {
        setSelectedEmails(prev =>
            prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
        );
    };

    const selectAll = () => setSelectedEmails(team.map(m => m.email));
    const clearAll = () => setSelectedEmails([]);

    const handleSend = async () => {
        if (selectedEmails.length === 0 || !message.trim()) return;
        setSending(true);
        try {
            await api.post('/admin/nudge', {
                employee_emails: selectedEmails,
                message: message.trim(),
                nudge_type: nudgeType,
            });
            setMessage('');
            setSelectedEmails([]);
            setNudgeType('general');
            fetchData();
            setActiveTab('history');
        } catch (e) {
            alert(e.response?.data?.detail || 'Failed to send nudge.');
        } finally {
            setSending(false);
        }
    };

    const currentType = NUDGE_TYPES.find(t => t.key === nudgeType) || NUDGE_TYPES[0];
    const NudgeIcon = currentType.icon;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}22` }}>
                            <Zap size={20} style={{ color: primaryColor }} />
                        </div>
                        Nudge Center
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Motivate and communicate with your field team</p>
                </div>
                <div className="flex gap-2">
                    {['compose', 'history'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab
                                ? 'bg-white/10 text-white border border-white/10'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {tab === 'compose' ? '✏️ Compose' : '📋 History'}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'compose' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Type + Message */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Type Picker */}
                        <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">1 — Nudge Type</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {NUDGE_TYPES.map(t => {
                                    const TIcon = t.icon;
                                    return (
                                        <button
                                            key={t.key}
                                            onClick={() => { setNudgeType(t.key); setMessage(''); }}
                                            className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-sm font-semibold ${nudgeType === t.key
                                                ? 'border-white/20 bg-white/5'
                                                : 'border-slate-800 hover:border-slate-700'
                                                }`}
                                            style={nudgeType === t.key ? { color: t.color } : { color: '#94a3b8' }}
                                        >
                                            <TIcon size={16} />
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Messages */}
                        <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">2 — Quick Message</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {(QUICK_MESSAGES[nudgeType] || []).map((msg, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setMessage(msg)}
                                        className={`text-xs px-3 py-2 rounded-lg border transition-all ${message === msg
                                            ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400'
                                            : 'border-slate-800 text-slate-400 hover:border-slate-700'
                                            }`}
                                    >
                                        {msg}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-white text-sm resize-none focus:border-indigo-500/50 focus:outline-none transition-colors"
                                rows={3}
                                placeholder="Or type a custom message..."
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                maxLength={280}
                            />
                            <p className="text-right text-xs text-slate-600 mt-1">{message.length} / 280</p>
                        </div>

                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={sending || !message || selectedEmails.length === 0}
                            className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-3 transition-all disabled:opacity-40"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {sending ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send size={18} />
                                    Send to {selectedEmails.length > 0 ? `${selectedEmails.length} member${selectedEmails.length > 1 ? 's' : ''}` : 'team'}
                                </>
                            )}
                        </button>
                    </div>

                    {/* Right: Team Selection */}
                    <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">3 — Recipients</p>
                            <div className="flex gap-2">
                                <button onClick={selectAll} className="text-xs font-semibold" style={{ color: primaryColor }}>All</button>
                                <button onClick={clearAll} className="text-xs font-semibold text-slate-500">Clear</button>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <div className="w-6 h-6 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
                                </div>
                            ) : team.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-10">No field team members found</p>
                            ) : (
                                team.map(m => (
                                    <button
                                        key={m.email}
                                        onClick={() => toggleMember(m.email)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${selectedEmails.includes(m.email)
                                            ? 'border-indigo-500/30 bg-indigo-500/10'
                                            : 'border-slate-800 hover:border-slate-700'
                                            }`}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                                            style={{
                                                backgroundColor: selectedEmails.includes(m.email) ? primaryColor : '#1e293b',
                                                color: selectedEmails.includes(m.email) ? '#fff' : '#94a3b8'
                                            }}
                                        >
                                            {(m.full_name || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{m.full_name}</p>
                                            <p className="text-[10px] text-slate-500 truncate">{m.email}</p>
                                        </div>
                                        {selectedEmails.includes(m.email) && (
                                            <CheckCircle2 size={16} style={{ color: primaryColor }} />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* History Tab */
                <div className="space-y-3">
                    {history.length === 0 ? (
                        <div className="bg-slate-900/50 rounded-2xl p-12 border border-slate-800 text-center">
                            <History size={32} className="text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-500">No nudges sent yet</p>
                        </div>
                    ) : (
                        history.map((log, i) => {
                            const typeInfo = NUDGE_TYPES.find(t => t.key === log.nudge_type) || NUDGE_TYPES[0];
                            const LogIcon = typeInfo.icon;
                            return (
                                <motion.div
                                    key={log._id || i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 flex items-start gap-4"
                                >
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${typeInfo.color}15` }}>
                                        <LogIcon size={18} style={{ color: typeInfo.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white font-medium">{log.message}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            To {log.recipients?.length || 0} member(s) · {new Date(log.sent_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-md" style={{ color: typeInfo.color, backgroundColor: `${typeInfo.color}15` }}>
                                        {typeInfo.label}
                                    </span>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
