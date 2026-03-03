import React, { useState, useEffect } from 'react';
import {
    Calendar,
    User,
    MessageSquare,
    CheckCircle,
    XCircle,
    Clock,
    Send,
    Filter,
    ChevronRight,
    Loader2,
    ShieldAlert
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const LeaveRequests = () => {
    const { admin } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [chatMessage, setChatMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/leave/requests?status=${filter}`);
            setRequests(res.data);
        } catch (err) {
            console.error('Failed to fetch leave requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId, action) => {
        try {
            await api.post(`/admin/leave/requests/${requestId}/${action}`);
            fetchRequests();
            if (selectedRequest?._id === requestId) {
                setSelectedRequest(null);
            }
        } catch (err) {
            alert('Failed to process request');
        }
    };

    const sendMessage = async () => {
        if (!chatMessage.trim() || !selectedRequest) return;
        try {
            setSendingMessage(true);
            await api.post(`/api/leave/requests/${selectedRequest._id}/message`, {
                message: chatMessage
            });
            setChatMessage('');
            // Refresh discussion
            const res = await api.get(`/api/leave/requests/${selectedRequest._id}/discussion`);
            setSelectedRequest({ ...selectedRequest, discussion: res.data });
        } catch (err) {
            alert('Failed to send message');
        } finally {
            setSendingMessage(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'rejected': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'cancelled': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            default: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Leave & OD Management</h1>
                    <p className="text-slate-400">Manage employee leave requests and on-duty approvals.</p>
                </div>

                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                    {['pending', 'approved', 'rejected', 'cancelled'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filter === s ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Request List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <Loader2 className="animate-spin text-primary-500" size={32} />
                        </div>
                    ) : requests.length > 0 ? (
                        requests.map((req) => (
                            <div
                                key={req._id}
                                onClick={() => setSelectedRequest(req)}
                                className={`bg-slate-900/40 backdrop-blur-md border p-6 rounded-[2rem] transition-all cursor-pointer group ${selectedRequest?._id === req._id ? 'border-primary-500 ring-1 ring-primary-500/20' : 'border-slate-800 hover:border-slate-700'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-400 border border-slate-700/50">
                                            {req.full_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white tracking-tight">{req.full_name}</h3>
                                            <p className="text-xs text-slate-500">{req.employee_id}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(req.status)}`}>
                                        {req.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Type</p>
                                        <p className="text-sm font-semibold text-slate-200 capitalize">{req.leave_type.replace('_', ' ')}</p>
                                    </div>
                                    <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Duration</p>
                                        <p className="text-sm font-semibold text-slate-200">{req.start_date} → {req.end_date}</p>
                                    </div>
                                    <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50 col-span-2 md:col-span-1">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Reason</p>
                                        <p className="text-sm text-slate-400 line-clamp-1">{req.reason}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <MessageSquare size={14} />
                                        <span className="text-xs font-bold capitalize">{req.discussion?.length || 0} messages</span>
                                    </div>
                                    <ChevronRight className={`text-slate-600 group-hover:text-primary-400 transition-all ${selectedRequest?._id === req._id ? 'rotate-90' : ''}`} size={20} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-[2rem] py-20 text-center">
                            <Calendar className="mx-auto text-slate-700 mb-4" size={48} />
                            <p className="text-slate-500">No {filter} requests found.</p>
                        </div>
                    )}
                </div>

                {/* Discussion & Details Sidebar */}
                <div className="lg:col-span-1">
                    {selectedRequest ? (
                        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] sticky top-8 h-[calc(100vh-8rem)] flex flex-col overflow-hidden shadow-2xl">
                            {/* Header */}
                            <div className="p-6 border-b border-slate-800/50 bg-slate-900/40">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center text-primary-400 border border-primary-500/20">
                                        <User size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-lg font-bold text-white truncate leading-tight">{selectedRequest.full_name}</h2>
                                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                            {selectedRequest.leave_type.replace('_', ' ')} Request
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Period:</span>
                                        <span className="text-slate-200 font-bold">{selectedRequest.start_date} to {selectedRequest.end_date}</span>
                                    </div>
                                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 italic text-sm text-slate-400">
                                        "{selectedRequest.reason}"
                                    </div>
                                </div>

                                {selectedRequest.status === 'pending' && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleAction(selectedRequest._id, 'approve')}
                                            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
                                        >
                                            <CheckCircle size={16} /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleAction(selectedRequest._id, 'reject')}
                                            className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-lg shadow-rose-900/20"
                                        >
                                            <XCircle size={16} /> Reject
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
                                <div className="text-center">
                                    <span className="text-[10px] bg-slate-950 px-3 py-1 rounded-full text-slate-500 font-black uppercase tracking-widest border border-slate-800">
                                        Discussion Channel
                                    </span>
                                </div>
                                {selectedRequest.discussion && selectedRequest.discussion.length > 0 ? (
                                    selectedRequest.discussion.map((msg, i) => (
                                        <div key={i} className={`flex flex-col ${msg.sender_id === admin.email ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${msg.sender_id === admin.email
                                                    ? 'bg-primary-600 text-white rounded-tr-none'
                                                    : 'bg-slate-800 text-slate-200 rounded-tl-none'
                                                }`}>
                                                {msg.message}
                                            </div>
                                            <span className="text-[10px] text-slate-600 mt-1 font-bold">
                                                {msg.sender_id === admin.email ? 'You' : msg.sender_name} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-slate-600 text-[10px] py-8 uppercase tracking-widest font-bold">
                                        No messages yet. Clarify doubts here.
                                    </p>
                                )}
                            </div>

                            {/* Chat Input */}
                            <div className="p-6 border-t border-slate-800/50 bg-slate-950/30">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={chatMessage}
                                        onChange={(e) => setChatMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Type your query..."
                                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 pr-12 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 transition-all"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={sendingMessage || !chatMessage.trim()}
                                        className="absolute right-2 top-1.5 w-9 h-9 bg-primary-600 text-white rounded-xl flex items-center justify-center hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full border border-dashed border-slate-800 rounded-[2.5rem] flex items-center justify-center p-8 text-center bg-slate-900/10 text-slate-600">
                            <div>
                                <ShieldAlert className="mx-auto mb-4 opacity-20" size={48} />
                                <p className="text-sm font-medium">Select a request to view details and start discussion.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeaveRequests;
