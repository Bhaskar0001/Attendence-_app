import React, { useState, useEffect } from 'react';
import {
    Users,
    UserCheck,
    UserX,
    Clock,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    MoreVertical,
    Loader2,
    ShieldAlert,
    Bell
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const StatCard = ({ title, value, subValue, icon: Icon, trend, type = 'blue' }) => {
    const colors = {
        blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    };

    return (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-6 rounded-3xl group hover:border-slate-700 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl border ${colors[type]}`}>
                    <Icon size={24} />
                </div>
                <button className="text-slate-600 hover:text-slate-400">
                    <MoreVertical size={20} />
                </button>
            </div>
            <div>
                <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
                <div className="flex items-end gap-3">
                    <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
                    <span className={`text-xs font-bold mb-1.5 flex items-center ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(trend)}%
                    </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                    <TrendingUp size={10} />
                    {subValue}
                </p>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleExportPDF = async () => {
        try {
            const res = await api.get('/admin/export-logs-pdf', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('PDF Export failed:', err);
            alert('Failed to generate PDF report');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, logsRes] = await Promise.all([
                    api.get('/admin/stats'),
                    api.get('/admin/logs?limit=5')
                ]);
                setStats(statsRes.data);
                setActivities(logsRes.data);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-primary-500" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">System Overview</h1>
                    <p className="text-slate-400">Welcome back, Admin. Real-time metrics are synced.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-950/20">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-500 text-[10px] font-black tracking-widest uppercase">Live Link Active</span>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/alerts')}
                        className="bg-rose-600/10 border border-rose-500/20 text-rose-500 px-6 py-2.5 rounded-2xl font-bold text-sm transition-all hover:bg-rose-600/20 flex items-center gap-2"
                    >
                        <ShieldAlert size={18} /> View Alerts
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-primary-900/40"
                    >
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Employees"
                    value={stats?.total_employees || 0}
                    subValue="Organization capacity"
                    icon={Users}
                    trend={12}
                    type="blue"
                />
                <StatCard
                    title="Clocked-In Today"
                    value={stats?.clocked_in_today || 0}
                    subValue="Total check-ins"
                    icon={UserCheck}
                    trend={5}
                    type="emerald"
                />
                <StatCard
                    title="Security Anomalies"
                    value={stats?.alerts_today || 0}
                    subValue={`${stats?.critical_alerts || 0} critical issues`}
                    icon={ShieldAlert}
                    trend={stats?.alerts_today > 0 ? -10 : 0}
                    type="rose"
                />
                <StatCard
                    title="Pending Guards"
                    value={stats?.pending_alerts || 0}
                    subValue="Actions required"
                    icon={Bell}
                    trend={0}
                    type="amber"
                />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Attendance Chart (Fake data for chart for now until we have more logs) */}
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem]">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-white tracking-tight">Attendance Analytics</h2>
                        <select className="bg-slate-950 border border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-lg px-3 py-1.5 outline-none focus:border-primary-500">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                                { name: 'Mon', count: 40 }, { name: 'Tue', count: 52 }, { name: 'Wed', count: 48 },
                                { name: 'Thu', count: 61 }, { name: 'Fri', count: 55 }, { name: 'Sat', count: 12 }, { name: 'Sun', count: 8 },
                            ]}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f8fafc' }} />
                                <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Live Activity Feed */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem]">
                    <h2 className="text-xl font-bold text-white mb-6 tracking-tight">Recent Activity</h2>
                    <div className="space-y-6">
                        {activities.length > 0 ? activities.map((activity, i) => (
                            <div key={i} className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-primary-600/20 group-hover:text-primary-400 transition-colors border border-slate-700/50">
                                    {(activity.full_name || activity.email).charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-200 truncate">{activity.full_name || activity.email}</p>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">
                                        {activity.type === 'check-in' ? 'Clocked In' : 'Clocked Out'} • {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <span className="text-[10px] font-black tracking-widest px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 shadow-sm shadow-emerald-950/20">
                                    {activity.status?.toUpperCase() || 'OK'}
                                </span>
                            </div>
                        )) : (
                            <p className="text-slate-600 text-sm text-center py-12">No activity recorded today.</p>
                        )}
                    </div>
                    <button className="w-full mt-8 py-3 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-slate-800/50 transition-all active:scale-95">
                        Full Audit Log
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
