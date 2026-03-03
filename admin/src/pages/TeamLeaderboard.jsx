import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Trophy, Medal, MapPin, Target, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const MEDAL_COLORS = ['#eab308', '#94a3b8', '#cd7f32']; // Gold, Silver, Bronze

export default function TeamLeaderboard() {
    const { organization } = useAuth();
    const primaryColor = organization?.primary_color || '#6366f1';

    const [data, setData] = useState({ leaderboard: [], week_start: '', week_end: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/field/leaderboard');
            setData(res.data || { leaderboard: [], week_start: '', week_end: '' });
        } catch (e) {
            console.error('Failed to fetch leaderboard', e);
        } finally {
            setLoading(false);
        }
    };

    const leaderboard = data.leaderboard || [];
    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-yellow-500/10">
                            <Trophy size={20} className="text-yellow-500" />
                        </div>
                        Team Leaderboard
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Weekly performance · {data.week_start} → {data.week_end}
                    </p>
                </div>
                <button
                    onClick={fetchLeaderboard}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all"
                >
                    🔄 Refresh
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-slate-700 border-t-yellow-500 rounded-full animate-spin" />
                </div>
            ) : leaderboard.length === 0 ? (
                <div className="bg-slate-900/50 rounded-2xl p-16 border border-slate-800 text-center">
                    <Users size={40} className="text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg font-semibold">No data yet for this week</p>
                    <p className="text-slate-500 text-sm mt-1">Performance data will appear once field agents start logging visits</p>
                </div>
            ) : (
                <>
                    {/* Podium — Top 3 */}
                    {top3.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                            {/* Rearrange: 2nd, 1st, 3rd for podium effect */}
                            {[top3[1], top3[0], top3[2]].filter(Boolean).map((agent, i) => {
                                const actualRank = agent?.rank || (i === 0 ? 2 : i === 1 ? 1 : 3);
                                const medalColor = MEDAL_COLORS[actualRank - 1] || '#64748b';
                                const isFirst = actualRank === 1;

                                return (
                                    <motion.div
                                        key={agent.employee_id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className={`bg-slate-900/50 rounded-2xl border border-slate-800 p-6 text-center relative ${isFirst ? 'lg:-mt-4 ring-1 ring-yellow-500/20' : ''
                                            }`}
                                    >
                                        {/* Medal */}
                                        <div
                                            className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-lg font-black"
                                            style={{ backgroundColor: `${medalColor}20`, color: medalColor }}
                                        >
                                            #{actualRank}
                                        </div>
                                        <h3 className="text-white font-bold text-base truncate">{agent.name}</h3>
                                        <p className="text-slate-500 text-xs mb-4">{agent.designation}</p>

                                        <div className="grid grid-cols-2 gap-2 text-center">
                                            <div className="bg-slate-950/50 rounded-xl p-2">
                                                <p className="text-lg font-bold text-white">{agent.visits_completed}</p>
                                                <p className="text-[10px] text-slate-500 uppercase">Visits</p>
                                            </div>
                                            <div className="bg-slate-950/50 rounded-xl p-2">
                                                <p className="text-lg font-bold text-white">{agent.leads_captured}</p>
                                                <p className="text-[10px] text-slate-500 uppercase">Leads</p>
                                            </div>
                                            <div className="bg-slate-950/50 rounded-xl p-2">
                                                <p className="text-lg font-bold text-white">{agent.orders_captured}</p>
                                                <p className="text-[10px] text-slate-500 uppercase">Orders</p>
                                            </div>
                                            <div className="bg-slate-950/50 rounded-xl p-2">
                                                <p className="text-lg font-bold text-white">{agent.distance_km}</p>
                                                <p className="text-[10px] text-slate-500 uppercase">KM</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* Remaining Rankings Table */}
                    {rest.length > 0 && (
                        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                            <div className="grid grid-cols-7 gap-4 px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                                <span>Rank</span>
                                <span className="col-span-2">Agent</span>
                                <span className="text-center">Visits</span>
                                <span className="text-center">Leads</span>
                                <span className="text-center">Orders</span>
                                <span className="text-center">KM</span>
                            </div>
                            {rest.map((agent, i) => (
                                <motion.div
                                    key={agent.employee_id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 + i * 0.05 }}
                                    className={`grid grid-cols-7 gap-4 px-5 py-4 items-center border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${agent.is_me ? 'bg-indigo-500/5' : ''
                                        }`}
                                >
                                    <span className="text-slate-400 font-bold">#{agent.rank}</span>
                                    <div className="col-span-2 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${primaryColor}22`, color: primaryColor }}>
                                            {(agent.name || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {agent.name}
                                                {agent.is_me && <span className="ml-2 text-[10px] text-indigo-400 font-bold">(You)</span>}
                                            </p>
                                            <p className="text-[10px] text-slate-500">{agent.designation}</p>
                                        </div>
                                    </div>
                                    <span className="text-center text-white font-semibold">{agent.visits_completed}</span>
                                    <span className="text-center text-white font-semibold">{agent.leads_captured}</span>
                                    <span className="text-center text-white font-semibold">{agent.orders_captured}</span>
                                    <span className="text-center text-white font-semibold">{agent.distance_km}</span>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
