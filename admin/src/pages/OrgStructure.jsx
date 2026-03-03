import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    Shield,
    Users,
    Headset,
    Building2,
    User,
    Network,
    Loader2,
    Search,
    ChevronDown,
    ChevronRight,
    MapPin,
    Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ROLE_ICONS = {
    owner: { icon: Shield, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    hr: { icon: Building2, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    support: { icon: Headset, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    manager: { icon: Network, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' }
};

const OrgStructure = () => {
    const [loading, setLoading] = useState(true);
    const [admins, setAdmins] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [expandedManagers, setExpandedManagers] = useState({});

    useEffect(() => {
        fetchOrgData();
    }, []);

    const fetchOrgData = async () => {
        try {
            const [adminsRes, empRes] = await Promise.all([
                api.get('/admin/sub-admins'),
                api.get('/admin/employees')
            ]);
            setAdmins(adminsRes.data);
            setEmployees(empRes.data);
        } catch (err) {
            console.error("Failed to fetch org data", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleManager = (managerEmail) => {
        setExpandedManagers(prev => ({
            ...prev,
            [managerEmail]: !prev[managerEmail]
        }));
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p>Mapping organization structure...</p>
            </div>
        );
    }

    const owners = admins.filter(a => a.role === 'owner');
    const hrSupport = admins.filter(a => ['hr', 'support'].includes(a.role));
    const managers = admins.filter(a => a.role === 'manager');
    const unassignedEmployees = employees.filter(e => !e.manager_id);

    return (
        <div className="space-y-10 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-white">Organization Map</h1>
                <p className="text-slate-400 text-sm">Visual hierarchy and reporting structure</p>
            </div>

            {/* Level 1: Owner */}
            <section className="flex flex-col items-center">
                <div className="px-4 py-2 bg-slate-800/30 border border-slate-700/50 rounded-lg text-[10px] text-slate-500 uppercase tracking-widest font-black mb-4">
                    Organizational Head
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                    {owners.map(owner => (
                        <div key={owner.email} className="bg-slate-900 border-2 border-amber-500/30 p-6 rounded-[2rem] w-72 shadow-2xl shadow-amber-900/10 relative group">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-[10px] font-black px-3 py-1 rounded-full text-slate-950 uppercase tracking-widest">
                                Master Owner
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/30 mb-4 group-hover:scale-110 transition-transform">
                                    <Shield className="text-amber-500" size={32} />
                                </div>
                                <h3 className="text-white font-bold text-lg">{owner.full_name}</h3>
                                <p className="text-slate-500 text-xs">{owner.email}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Connector Line */}
            <div className="h-8 w-1 bg-gradient-to-b from-amber-500/30 to-purple-500/30 mx-auto" />

            {/* Level 2: HR & Support */}
            <section className="flex flex-col items-center">
                <div className="px-4 py-2 bg-slate-800/30 border border-slate-700/50 rounded-lg text-[10px] text-slate-500 uppercase tracking-widest font-black mb-4">
                    Administration & Operations
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                    {hrSupport.map(admin => {
                        const config = ROLE_ICONS[admin.role];
                        const Icon = config.icon;
                        return (
                            <div key={admin.email} className={`bg-slate-900 border border-slate-800 p-5 rounded-3xl w-64 group hover:border-slate-700 transition-all`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 ${config.bg} rounded-xl flex items-center justify-center border ${config.border}`}>
                                        <Icon className={config.color} size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-semibold text-sm">{admin.full_name}</h4>
                                        <div className={`text-[10px] uppercase font-black ${config.color} tracking-wider`}>
                                            {admin.role === 'hr' ? 'HR Manager' : 'Support Desk'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Connector Line */}
            <div className="h-8 w-1 bg-gradient-to-b from-purple-500/30 to-indigo-500/30 mx-auto" />

            {/* Level 3: Managers and their Teams */}
            <section className="flex flex-col items-center">
                <div className="px-4 py-2 bg-slate-800/30 border border-slate-700/50 rounded-lg text-[10px] text-slate-500 uppercase tracking-widest font-black mb-6">
                    Regional & Team Management
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                    {managers.map(manager => {
                        const team = employees.filter(e => e.manager_id === manager.email);
                        const isExpanded = expandedManagers[manager.email];

                        return (
                            <div key={manager.email} className="flex flex-col items-center">
                                {/* Manager Card */}
                                <div
                                    onClick={() => toggleManager(manager.email)}
                                    className={`bg-slate-900/50 border ${isExpanded ? 'border-primary-500/50' : 'border-slate-800'} p-6 rounded-3xl w-full cursor-pointer hover:bg-slate-800/50 transition-all group relative`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                                            <Network className="text-indigo-400" size={24} />
                                        </div>
                                        <div className="bg-slate-950 px-3 py-1 rounded-full border border-slate-800 text-[10px] font-bold text-slate-400">
                                            {team.length} Members
                                        </div>
                                    </div>
                                    <h4 className="text-white font-bold">{manager.full_name}</h4>
                                    <p className="text-slate-500 text-xs mb-4">{manager.email}</p>

                                    <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-bold border-t border-white/5 pt-4">
                                        <span>Team Manager</span>
                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </div>
                                </div>

                                {/* Team Members (Dropdown-style in Tree) */}
                                <AnimatePresence>
                                    {isExpanded && team.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="w-full mt-2 space-y-2 pl-4 border-l-2 border-primary-500/20"
                                        >
                                            {team.map(member => (
                                                <div key={member.email} className="flex items-center gap-3 p-3 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
                                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                                        {member.employee_type === 'field' ? <MapPin className="text-primary-500" size={14} /> : <Monitor className="text-blue-500" size={14} />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-white truncate">{member.full_name}</p>
                                                        <p className="text-[10px] text-slate-500 truncate">{member.employee_type.toUpperCase()} / {member.email}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}

                    {/* Unassigned Employees Bucket */}
                    {unassignedEmployees.length > 0 && (
                        <div className="flex flex-col items-center">
                            <div className="bg-slate-900/50 border border-red-500/20 p-6 rounded-3xl w-full border-dashed">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                                        <Users className="text-red-400" size={24} />
                                    </div>
                                    <div className="bg-slate-950 px-3 py-1 rounded-full border border-slate-800 text-[10px] font-bold text-red-400">
                                        {unassignedEmployees.length} Pending
                                    </div>
                                </div>
                                <h4 className="text-white font-bold">Unmapped Staff</h4>
                                <p className="text-slate-500 text-xs mb-4">Not assigned to any manager</p>
                                <div className="text-[10px] text-red-500/50 uppercase tracking-widest font-bold border-t border-white/5 pt-4 italic">
                                    Requires Assignment
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default OrgStructure;
