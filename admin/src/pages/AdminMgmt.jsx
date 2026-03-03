import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    Shield,
    UserPlus,
    Trash2,
    Mail,
    User,
    Lock,
    Loader2,
    Search,
    AlertCircle,
    CheckCircle2,
    X,
    Users,
    Headset,
    Building2,
    Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ROLE_CONFIG = {
    owner: { label: 'Owner', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Shield, desc: 'Full control over organization & admins.' },
    hr: { label: 'HR Manager', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: Building2, desc: 'Manage employees, leaves, & attendance.' },
    support: { label: 'Support Desk', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Headset, desc: 'View logs & manage basic settings.' },
    manager: { label: 'Team Manager', color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', icon: Users, desc: 'Manage assigned team members only.' }
};

const AdminMgmt = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionMessage, setActionMessage] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'hr'
    });

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const response = await api.get('/admin/sub-admins');
            setAdmins(response.data);
        } catch (err) {
            console.error("Failed to fetch admins", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/admin/sub-admins', formData);
            setActionMessage({ type: 'success', text: 'Admin added successfully!' });
            setShowAddModal(false);
            setFormData({ full_name: '', email: '', password: '', role: 'hr' });
            fetchAdmins();
        } catch (err) {
            setActionMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to add admin.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAdmin = async (email) => {
        if (!window.confirm(`Are you sure you want to remove ${email} from the admin team?`)) return;

        try {
            await api.delete(`/admin/sub-admins/${email}`);
            setAdmins(admins.filter(a => a.email !== email));
            setActionMessage({ type: 'success', text: 'Admin removed successfully.' });
        } catch (err) {
            setActionMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to remove admin.' });
        }
    };

    const filteredAdmins = admins.filter(admin =>
        admin.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Role Management</h1>
                    <p className="text-slate-400">Define administrative access and team scoping</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-primary-900/20 active:scale-95"
                >
                    <UserPlus size={20} />
                    New Admin
                </button>
            </div>

            {/* Quick Stats & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-600/20 rounded-2xl flex items-center justify-center border border-primary-500/30">
                            <Shield className="text-primary-500" size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Total Staff</p>
                            <h3 className="text-2xl font-bold text-white">{admins.length}</h3>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl flex items-center">
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary-500/50 transition-all text-slate-200 placeholder:text-slate-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Alert Messages */}
            <AnimatePresence>
                {actionMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex items-center gap-3 p-4 rounded-xl border ${actionMessage.type === 'success'
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}
                    >
                        {actionMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <span className="flex-1 text-sm font-medium">{actionMessage.text}</span>
                        <button onClick={() => setActionMessage(null)} className="hover:opacity-70 transition-opacity">
                            <X size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Admins Table-like Grid */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center text-slate-500">
                        <Loader2 className="animate-spin mb-4" size={40} />
                        <p>Loading role accounts...</p>
                    </div>
                ) : filteredAdmins.length === 0 ? (
                    <div className="p-20 text-center text-slate-500">
                        <Shield className="mx-auto mb-4 opacity-20" size={60} />
                        <p>No administrative accounts found.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800/50">
                        {filteredAdmins.map((admin) => {
                            const config = ROLE_CONFIG[admin.role] || ROLE_CONFIG.hr;
                            const Icon = config.icon;
                            return (
                                <div key={admin.email} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${config.bg} ${config.border} ${config.color}`}>
                                            <Icon size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-white font-semibold">{admin.full_name}</h4>
                                                <span className={`${config.bg} ${config.color} ${config.border} text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest`}>
                                                    {config.label}
                                                </span>
                                            </div>
                                            <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-0.5">
                                                <Mail size={12} />
                                                {admin.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right mr-4 hidden sm:block">
                                            <p className="text-slate-400 text-xs font-medium">Joined On</p>
                                            <p className="text-white text-sm">{new Date(admin.created_at).toLocaleDateString()}</p>
                                        </div>

                                        {/* Actions */}
                                        {admin.role !== 'owner' && (
                                            <button
                                                onClick={() => handleDeleteAdmin(admin.email)}
                                                className="p-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                                title="Revoke Admin Access"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal for adding sub-admin */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-slate-900 border border-slate-800 w-full max-w-xl p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-indigo-500" />

                            <button
                                onClick={() => setShowAddModal(false)}
                                className="absolute right-6 top-6 text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-white mb-1">New Administrative Role</h2>
                                <p className="text-slate-400">Assign permissions based on administrative requirements</p>
                            </div>

                            <form onSubmit={handleAddAdmin} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Full Name"
                                            required
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary-500/50 transition-all text-slate-200"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        />
                                    </div>

                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            required
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary-500/50 transition-all text-slate-200"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="password"
                                        placeholder="Portal Password"
                                        required
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary-500/50 transition-all text-slate-200"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-slate-300 ml-1">Select Administrative Role</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {['hr', 'support', 'manager'].map((role) => {
                                            const config = ROLE_CONFIG[role];
                                            const Icon = config.icon;
                                            const isSelected = formData.role === role;
                                            return (
                                                <button
                                                    key={role}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, role: role })}
                                                    className={`p-4 rounded-2xl border text-left transition-all ${isSelected
                                                        ? `${config.bg} ${config.border} ring-2 ring-primary-500/20`
                                                        : 'bg-slate-950/30 border-slate-800 hover:border-slate-700'
                                                        }`}
                                                >
                                                    <Icon className={isSelected ? config.color : 'text-slate-500'} size={24} />
                                                    <p className={`font-bold mt-2 text-sm ${isSelected ? 'text-white' : 'text-slate-400'}`}>{config.label}</p>
                                                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">{config.desc}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-primary-900/20 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Create Role Account'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminMgmt;
