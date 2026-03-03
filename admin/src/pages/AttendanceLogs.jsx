import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Search,
    Filter,
    Download,
    FileText,
    Clock,
    User,
    MapPin,
    Wifi,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    AlertCircle,
    Loader2,
    ExternalLink
} from 'lucide-react';
import api from '../utils/api';

const AttendanceLogs = () => {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/logs?limit=100');
            setLogs(res.data);
        } catch (err) {
            setError('Unable to retrieve attendance audit trail.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesType = filterType === 'all' || log.type?.toLowerCase() === filterType;
        const searchStr = searchTerm.toLowerCase();
        const matchesSearch = searchTerm === '' ||
            (log.full_name && log.full_name.toLowerCase().includes(searchStr)) ||
            (log.email && log.email.toLowerCase().includes(searchStr)) ||
            (log.employee_id && log.employee_id.toLowerCase().includes(searchStr));

        return matchesType && matchesSearch;
    });

    const handleExport = async () => {
        try {
            const response = await api.get('/admin/export-logs-pdf', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'attendance_audit_report.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Export failed: ' + err.message);
        }
    };

    const handleExportExcel = async () => {
        try {
            const res = await api.get('/admin/export-logs-excel', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Excel Export failed:', err);
            alert('Failed to export Excel report');
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Attendance Audit Logs</h1>
                    <p className="text-slate-400">Review and export comprehensive attendance history.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-lg shadow-black/20">
                        <Calendar size={18} className="text-primary-500" />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <button
                        onClick={handleExportExcel}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 border border-slate-700 shadow-lg shadow-black/20 flex items-center gap-2"
                    >
                        <Download size={18} />
                        Export Excel
                    </button>
                    <button
                        onClick={handleExport}
                        className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-primary-900/40 flex items-center gap-2"
                    >
                        <FileText size={18} />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner shadow-black/20">
                    {['all', 'check-in', 'check-out'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search activity by name or ID..."
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-primary-500/50 transition-all text-slate-200 placeholder:text-slate-600 font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center bg-slate-900/20 rounded-[2rem] border border-slate-800/50">
                    <Loader2 className="animate-spin text-primary-500 mb-4" size={40} />
                    <p className="text-slate-500 text-sm font-medium tracking-wide">Syncing organization logs...</p>
                </div>
            ) : error ? (
                <div className="py-24 flex flex-col items-center justify-center bg-rose-500/5 rounded-[2rem] border border-rose-500/20 text-rose-400">
                    <AlertCircle size={40} className="mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">{error}</p>
                </div>
            ) : (
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-[2rem] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800/50">
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Timestamp</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Member</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Activity</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Method/Location</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Verification</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredLogs.map((log) => (
                                    <tr key={log._id} className="group hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-slate-800/50 group-hover:bg-primary-600/10 transition-colors border border-slate-700/50">
                                                    <Clock size={16} className="text-slate-400 group-hover:text-primary-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white tracking-tight">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{new Date(log.timestamp).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-700 group-hover:border-primary-500/30 transition-all">
                                                    {(log.full_name || log.email || 'U').charAt(0)}
                                                </div>
                                                <p className="text-sm font-bold text-slate-200 group-hover:text-primary-400 transition-colors">{log.full_name || log.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${log.type === 'check-in' ? 'bg-primary-600/10 text-primary-400 border border-primary-500/10' : 'bg-orange-500/10 text-orange-400 border border-orange-500/10'
                                                }`}>
                                                {log.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                                    <ShieldCheck size={12} className="text-slate-600" />
                                                    Face ID Verified
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-bold uppercase tracking-tight">
                                                    <MapPin size={10} />
                                                    {log.address || 'Office Core Zone'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${log.status === 'success'
                                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
                                                : 'bg-amber-500/5 border-amber-500/20 text-amber-500'
                                                }`}>
                                                <ShieldCheck size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{log.status}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer */}
                    <div className="px-8 py-6 border-t border-slate-800/50 flex items-center justify-between bg-slate-900/10">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            Live Monitoring System <span className="text-primary-500">Active</span>
                        </p>
                        <div className="flex items-center gap-3">
                            <button onClick={fetchLogs} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                                <Loader2 size={12} className={loading ? 'animate-spin' : ''} />
                                Refetch All Records
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceLogs;
