import React, { useState, useEffect } from 'react';
import client from '../utils/api';
import {
    ShieldAlert,
    MapPin,
    UserX,
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
    Cpu,
    AlertOctagon,
    BarChart2,
    TrendingUp
} from 'lucide-react';

// ─── Category Config ───────────────────────────────────────────────────────────
const CATEGORIES = [
    {
        key: 'Identity',
        label: 'Identity Fraud',
        description: 'Face mismatches & device binding violations',
        icon: UserX,
        color: '#f43f5e',
        gradient: 'from-rose-500/10 to-rose-900/5',
        border: 'border-rose-500/20',
    },
    {
        key: 'Territory',
        label: 'Location Anomalies',
        description: 'GPS spoofing, mock locations & geofence breaches',
        icon: MapPin,
        color: '#f97316',
        gradient: 'from-orange-500/10 to-orange-900/5',
        border: 'border-orange-500/20',
    },
    {
        key: 'Productivity',
        label: 'Productivity Flags',
        description: 'Missed visits, stationary alerts & SLA breaches',
        icon: Clock,
        color: '#eab308',
        gradient: 'from-yellow-500/10 to-yellow-900/5',
        border: 'border-yellow-500/20',
    },
    {
        key: 'Compliance',
        label: 'Compliance Issues',
        description: 'Policy violations & data integrity flags',
        icon: Cpu,
        color: '#8b5cf6',
        gradient: 'from-violet-500/10 to-violet-900/5',
        border: 'border-violet-500/20',
    },
];

const SEVERITY_STYLES = {
    critical: { badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30', bar: 'bg-rose-500', dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]' },
    high: { badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30', bar: 'bg-orange-500', dot: 'bg-orange-400' },
    medium: { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30', bar: 'bg-amber-400', dot: 'bg-amber-400' },
    low: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
};

// ─── Alert Card Component ──────────────────────────────────────────────────────
const AlertCard = ({ alert, onResolve, onDismiss }) => {
    const sev = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium;

    return (
        <div className="relative bg-slate-900/60 rounded-2xl border border-slate-800/60 overflow-hidden hover:border-slate-700/80 transition-all group">
            {/* Left severity bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${sev.bar}`} />

            <div className="p-4 pl-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sev.dot}`} />
                        <p className="text-white font-semibold text-sm leading-snug line-clamp-2">
                            {alert.detail}
                        </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border flex-shrink-0 ${sev.badge}`}>
                        {alert.severity}
                    </span>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-3">
                    <span className="flex items-center gap-1">
                        <UserX size={10} className="text-primary-500" />
                        {alert.employee_name || alert.employee_id}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock size={10} className="text-primary-500" />
                        {new Date(alert.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                    {alert.metadata?.lat && (
                        <span className="flex items-center gap-1">
                            <MapPin size={10} className="text-rose-400" />
                            {Number(alert.metadata.lat).toFixed(4)}, {Number(alert.metadata.lng || alert.metadata.long || 0).toFixed(4)}
                        </span>
                    )}
                </div>

                {/* Actions */}
                {alert.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onDismiss(alert._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 text-[11px] font-bold transition-all"
                        >
                            <XCircle size={12} /> Dismiss
                        </button>
                        <button
                            onClick={() => onResolve(alert._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold transition-all"
                        >
                            <CheckCircle size={12} /> Resolve
                        </button>
                    </div>
                ) : (
                    <span className={`text-[11px] font-bold ${alert.status === 'resolved' ? 'text-emerald-500' : 'text-slate-500'} flex items-center gap-1`}>
                        {alert.status === 'resolved' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {alert.status === 'resolved' ? 'Resolved' : 'Dismissed'}
                    </span>
                )}
            </div>
        </div>
    );
};

// ─── Stat Mini Card ────────────────────────────────────────────────────────────
const StatMini = ({ label, value, color, icon: Icon }) => (
    <div className="bg-slate-900/40 rounded-2xl border border-slate-800/50 p-4 flex items-center gap-4">
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}18` }}>
            <Icon size={20} style={{ color }} />
        </div>
        <div>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{label}</p>
        </div>
    </div>
);

// ─── Main FraudDashboard Component ───────────────────────────────────────────
const FraudDashboard = () => {
    const [alertsByCategory, setAlertsByCategory] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('pending');
    const [activeCategory, setActiveCategory] = useState('Identity');

    const fetchAll = async () => {
        setLoading(true);
        try {
            const promises = CATEGORIES.map(cat =>
                client.get(`/admin/field/alerts?type=${cat.key}&status=${selectedStatus || 'all'}`)
            );
            const results = await Promise.all(promises);
            const grouped = {};
            CATEGORIES.forEach((cat, i) => {
                grouped[cat.key] = results[i].data || [];
            });
            setAlertsByCategory(grouped);
        } catch (e) {
            console.error('FraudDashboard fetch failed', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 60000);
        return () => clearInterval(interval);
    }, [selectedStatus]);

    const handleAction = async (alertId, action) => {
        try {
            await client.put(`/admin/field/alerts/${alertId}`, { status: action });
            fetchAll();
        } catch (e) {
            console.error('Alert action failed', e);
        }
    };

    const totalPending = Object.values(alertsByCategory).flat().filter(a => a.status === 'pending').length;
    const totalCritical = Object.values(alertsByCategory).flat().filter(a => a.severity === 'critical').length;
    const totalHigh = Object.values(alertsByCategory).flat().filter(a => a.severity === 'high').length;
    const activeCat = CATEGORIES.find(c => c.key === activeCategory);
    const activeAlerts = alertsByCategory[activeCategory] || [];

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header */}
            <header className="bg-gradient-to-r from-rose-900/30 to-slate-900/40 p-6 rounded-3xl border border-rose-500/20 backdrop-blur-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-3">
                            <AlertOctagon className="text-rose-400" size={26} />
                            Fraud Intelligence Dashboard
                        </h1>
                        <p className="text-slate-400 text-sm mt-1.5">
                            Real-time anomaly detection: Identity, Location & Productivity threats
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedStatus}
                            onChange={e => setSelectedStatus(e.target.value)}
                            className="bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2 text-sm"
                        >
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                            <option value="">All</option>
                        </select>
                        <button
                            onClick={fetchAll}
                            className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 transition-colors"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatMini label="Pending Alerts" value={totalPending} color="#f43f5e" icon={AlertOctagon} />
                <StatMini label="Critical" value={totalCritical} color="#f43f5e" icon={ShieldAlert} />
                <StatMini label="High Severity" value={totalHigh} color="#f97316" icon={TrendingUp} />
                <StatMini label="Categories" value={CATEGORIES.length} color="#8b5cf6" icon={BarChart2} />
            </div>

            <div className="flex gap-6 flex-1 overflow-hidden min-h-0">
                {/* Category Sidebar */}
                <div className="w-64 flex-shrink-0 space-y-3 overflow-y-auto">
                    {CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        const count = (alertsByCategory[cat.key] || []).length;
                        const isActive = activeCategory === cat.key;

                        return (
                            <button
                                key={cat.key}
                                onClick={() => setActiveCategory(cat.key)}
                                className={`w-full text-left bg-gradient-to-br ${cat.gradient} rounded-2xl border ${cat.border} p-4 transition-all ${isActive ? 'ring-2 scale-[1.02]' : 'hover:scale-[1.01] opacity-80 hover:opacity-100'}`}
                                style={isActive ? { ringColor: cat.color } : {}}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <Icon size={18} style={{ color: cat.color }} />
                                    <span
                                        className="text-xs font-black px-2 py-0.5 rounded-full"
                                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                                    >
                                        {count}
                                    </span>
                                </div>
                                <p className="text-white font-bold text-sm">{cat.label}</p>
                                <p className="text-slate-400 text-[10px] mt-0.5 leading-snug">{cat.description}</p>
                            </button>
                        );
                    })}
                </div>

                {/* Alert Stream */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {/* Category Header */}
                    {activeCat && (
                        <div className={`bg-gradient-to-r ${activeCat.gradient} rounded-2xl border ${activeCat.border} p-4 flex items-center gap-3`}>
                            {React.createElement(activeCat.icon, { size: 20, style: { color: activeCat.color } })}
                            <div>
                                <p className="text-white font-bold">{activeCat.label}</p>
                                <p className="text-slate-400 text-xs">{activeCat.description}</p>
                            </div>
                            <span
                                className="ml-auto text-sm font-black px-3 py-1 rounded-full"
                                style={{ backgroundColor: `${activeCat.color}20`, color: activeCat.color }}
                            >
                                {activeAlerts.length} alert{activeAlerts.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <RefreshCw className="animate-spin text-rose-400" size={30} />
                        </div>
                    ) : activeAlerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                <CheckCircle className="text-emerald-400" size={32} />
                            </div>
                            <p className="text-white font-bold">No Alerts</p>
                            <p className="text-slate-500 text-sm text-center max-w-xs">
                                No {activeCategory.toLowerCase()} anomalies detected with the current filter.
                            </p>
                        </div>
                    ) : (
                        activeAlerts.map(alert => (
                            <AlertCard
                                key={alert._id}
                                alert={alert}
                                onResolve={id => handleAction(id, 'resolved')}
                                onDismiss={id => handleAction(id, 'dismissed')}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default FraudDashboard;
