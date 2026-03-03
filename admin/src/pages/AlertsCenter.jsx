import React, { useState, useEffect } from 'react';
import client from '../utils/api';
import {
    AlertTriangle,
    ShieldAlert,
    MapPin,
    UserX,
    Clock,
    CheckCircle,
    XCircle,
    Filter,
    ChevronRight,
    Search,
    RefreshCw
} from 'lucide-react';

const AlertsCenter = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'pending',
        severity: '',
        type: ''
    });

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, [filters]);

    const fetchAlerts = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.severity) params.append('severity', filters.severity);
            if (filters.type) params.append('type', filters.type);

            const res = await client.get(`/admin/field/alerts?${params.toString()}`);
            setAlerts(res.data || []);
        } catch (e) {
            console.error('Failed to fetch alerts', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (alertId, action) => {
        try {
            await client.put(`/admin/field/alerts/${alertId}`, { status: action });
            fetchAlerts();
        } catch (e) {
            console.error('Action failed', e);
        }
    };

    const getSeverityStyles = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Identity': return <UserX size={18} />;
            case 'Territory': return <MapPin size={18} />;
            case 'Compliance': return <ShieldAlert size={18} />;
            case 'Productivity': return <Clock size={18} />;
            default: return <AlertTriangle size={18} />;
        }
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <header className="flex justify-between items-center bg-slate-900/40 p-6 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <AlertTriangle className="text-rose-500" /> Alerts Center
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Real-time security and operational anomaly monitoring</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        className="bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary-500"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                        <option value="all">All Alerts</option>
                    </select>
                    <button
                        onClick={fetchAlerts}
                        className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 transition-colors"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2">
                    <div className="bg-slate-900/40 rounded-3xl border border-slate-800/50 p-5">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Filter size={14} /> Filter Settings
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Anomaly Type</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Identity', 'Territory', 'Compliance', 'Productivity'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFilters({ ...filters, type: filters.type === type ? '' : type })}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.type === type ? 'bg-primary-500/20 border-primary-500 text-primary-400' : 'bg-slate-800/30 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Severity Level</label>
                                <div className="space-y-2">
                                    {['critical', 'high', 'medium', 'low'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setFilters({ ...filters, severity: filters.severity === s ? '' : s })}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold transition-all ${filters.severity === s ? 'bg-slate-800 border-primary-500' : 'bg-slate-950/20 border-slate-800 hover:bg-slate-800/50'}`}
                                        >
                                            <span className="capitalize">{s}</span>
                                            <div className={`w-2 h-2 rounded-full ${s === 'critical' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : s === 'high' ? 'bg-orange-500' : s === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-rose-500/10 to-indigo-500/10 rounded-3xl border border-rose-500/20 p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <ShieldAlert className="text-rose-400" size={24} />
                            <h4 className="font-bold text-white text-sm">Automated Guards</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">System is actively monitoring Face ID mismatches, Mock Location usage, and Geofence deviations.</p>
                    </div>
                </div>

                {/* Alerts Stream */}
                <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
                    {loading && alerts.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center bg-slate-900/40 rounded-3xl border border-slate-800/50">
                            <div className="text-center">
                                <RefreshCw className="animate-spin text-primary-500 mx-auto mb-4" size={32} />
                                <p className="text-slate-400 font-medium">Scanning for anomalies...</p>
                            </div>
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/40 rounded-3xl border border-slate-800/50 text-center p-10">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle className="text-emerald-500" size={40} />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">System Secure</h2>
                            <p className="text-slate-400 max-w-md">No anomalies found matching your current filters. Everything seems to be operating normally.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-10">
                            {alerts.map((alert) => (
                                <div key={alert._id} className="bg-slate-900/40 rounded-2xl border border-slate-800/50 overflow-hidden hover:border-slate-700 transition-all group">
                                    <div className="flex items-stretch">
                                        <div className={`w-1.5 ${alert.severity === 'critical' ? 'bg-rose-500' : alert.severity === 'high' ? 'bg-orange-500' : 'bg-amber-500'}`}></div>
                                        <div className="flex-1 p-5">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-3 rounded-xl border ${getSeverityStyles(alert.severity)}`}>
                                                        {getTypeIcon(alert.type)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-white">{alert.type} Incident</span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getSeverityStyles(alert.severity)}`}>
                                                                {alert.severity}
                                                            </span>
                                                        </div>
                                                        <p className="text-white text-sm font-medium leading-relaxed">{alert.detail}</p>
                                                        <div className="flex flex-wrap items-center gap-4 mt-3">
                                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                                                                <Search size={12} className="text-primary-500" /> {alert.employee_name}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                                                                <Clock size={12} className="text-primary-500" /> {new Date(alert.timestamp).toLocaleString()}
                                                            </div>
                                                            {alert.metadata?.lat && (
                                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                                                                    <MapPin size={12} className="text-rose-500" /> {alert.metadata.lat.toFixed(4)}, {alert.metadata.long?.toFixed(4) || alert.metadata.lng?.toFixed(4)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {alert.status === 'pending' && (
                                                    <div className="flex items-center gap-2 self-end md:self-center">
                                                        <button
                                                            onClick={() => handleAction(alert._id, 'dismissed')}
                                                            className="px-4 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 text-xs font-bold transition-all flex items-center gap-2"
                                                        >
                                                            <XCircle size={14} /> Dismiss
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(alert._id, 'resolved')}
                                                            className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-lg shadow-primary-500/20 transition-all flex items-center gap-2"
                                                        >
                                                            <CheckCircle size={14} /> Resolve
                                                        </button>
                                                    </div>
                                                )}

                                                {alert.status !== 'pending' && (
                                                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase">
                                                        {alert.status === 'resolved' ? (
                                                            <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={14} /> Resolved</span>
                                                        ) : (
                                                            <span className="text-slate-400 flex items-center gap-1"><XCircle size={14} /> Dismissed</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlertsCenter;
