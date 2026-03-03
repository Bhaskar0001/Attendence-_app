import React, { useState, useEffect } from 'react';
import client from '../utils/api';
import {
    ClipboardCheck, Check, X, Calendar, MapPin,
    ChevronUp, ChevronDown, MessageSquare, Edit3, Save, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PlanApproval = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState(null);
    const [editStops, setEditStops] = useState([]);
    const [managerComments, setManagerComments] = useState('');
    const [editingStopIdx, setEditingStopIdx] = useState(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await client.get('/admin/field/visit-plans?status=submitted');
            setPlans(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (planId, action) => {
        try {
            await client.post(`/admin/field/visit-plans/${planId}/${action}`);
            fetchPlans();
        } catch (e) {
            alert('Action failed');
        }
    };

    const startEditing = (plan) => {
        setEditingPlan(plan);
        setEditStops([...plan.stops]);
        setManagerComments(plan.manager_comments || '');
        setEditingStopIdx(null);
    };

    const moveStop = (index, direction) => {
        const newStops = [...editStops];
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < newStops.length) {
            [newStops[index], newStops[newIndex]] = [newStops[newIndex], newStops[index]];
            // Update sequence_order
            const updated = newStops.map((s, i) => ({ ...s, sequence_order: i + 1, manager_reordered: true }));
            setEditStops(updated);
        }
    };

    const updateStopDetail = (index, field, value) => {
        const newStops = [...editStops];
        newStops[index] = { ...newStops[index], [field]: value };
        setEditStops(newStops);
    };

    const saveChanges = async () => {
        try {
            await client.put(`/admin/field/visit-plans/${editingPlan._id}`, {
                stops: editStops,
                manager_comments: managerComments
            });
            setEditingPlan(null);
            fetchPlans();
        } catch (e) {
            alert('Failed to save changes');
        }
    };

    const approveWithChanges = async () => {
        try {
            // 1. Save changes
            await client.put(`/admin/field/visit-plans/${editingPlan._id}`, {
                stops: editStops,
                manager_comments: managerComments
            });
            // 2. Approve
            await client.post(`/admin/field/visit-plans/${editingPlan._id}/approve`);
            setEditingPlan(null);
            fetchPlans();
        } catch (e) {
            alert('Failed to approve with changes');
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Loading plans...</div>;

    return (
        <div className="flex flex-col h-full gap-6 p-6">
            <header>
                <h1 className="text-2xl font-bold text-white">Visit Plan Approval</h1>
                <p className="text-slate-400">Review, reorder, and authorize daily beat plans for field agents</p>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {plans.length > 0 ? plans.map(plan => (
                    <motion.div
                        layout
                        key={plan._id}
                        className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between gap-6"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                                    <Calendar size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-bold">{plan.full_name}</h3>
                                    <p className="text-xs text-slate-500">Target Date: {plan.date}</p>
                                </div>
                                <div className="px-3 py-1 bg-slate-800 rounded-full text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                                    {plan.stops.length} Stops
                                </div>
                            </div>

                            <div className="space-y-3">
                                {plan.stops.map((stop, idx) => (
                                    <div key={idx} className="flex gap-4 items-start group">
                                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-200 font-semibold">{stop.place_name}</p>
                                            <p className="text-[11px] text-slate-500">{stop.address}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex md:flex-col justify-end gap-3 min-w-[180px]">
                            <button
                                onClick={() => handleAction(plan._id, 'approve')}
                                className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 text-white px-4 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <Check size={18} /> Approve
                            </button>
                            <button
                                onClick={() => startEditing(plan)}
                                className="flex-1 h-11 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <Edit3 size={18} /> Edit & Reorder
                            </button>
                            <button
                                onClick={() => handleAction(plan._id, 'reject')}
                                className="flex-1 h-11 bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-500 text-slate-500 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                            >
                                <X size={18} /> Reject
                            </button>
                        </div>
                    </motion.div>
                )) : (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center">
                        <ClipboardCheck size={48} className="text-slate-800 mx-auto mb-4" />
                        <h3 className="text-slate-400 font-bold">No plans pending approval</h3>
                        <p className="text-slate-600 text-sm mt-1">All agent visit plans have been processed.</p>
                    </div>
                )}
            </div>

            {/* EDIT MODAL */}
            <AnimatePresence>
                {editingPlan && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Modify Plan: {editingPlan.full_name}</h2>
                                    <p className="text-sm text-slate-400">Reorder stops or add manager instructions</p>
                                </div>
                                <button onClick={() => setEditingPlan(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Route sequence</h4>
                                    {editStops.map((stop, idx) => (
                                        <div key={idx} className={`bg-slate-800/50 border ${editingStopIdx === idx ? 'border-primary-500/50 bg-primary-500/5' : 'border-slate-700/50'} p-4 rounded-2xl flex flex-col gap-4`}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    {editingStopIdx === idx ? (
                                                        <div className="space-y-2">
                                                            <input
                                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                                                value={stop.place_name}
                                                                onChange={(e) => updateStopDetail(idx, 'place_name', e.target.value)}
                                                                placeholder="Place Name"
                                                            />
                                                            <input
                                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                                                                value={stop.address}
                                                                onChange={(e) => updateStopDetail(idx, 'address', e.target.value)}
                                                                placeholder="Address"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm font-semibold text-white">{stop.place_name}</p>
                                                            <p className="text-[11px] text-slate-500 truncate max-w-[300px]">{stop.address}</p>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setEditingStopIdx(editingStopIdx === idx ? null : idx)}
                                                        className={`p-2 rounded-lg transition-colors ${editingStopIdx === idx ? 'bg-primary-500 text-white' : 'hover:bg-slate-700 text-slate-400'}`}
                                                    >
                                                        {editingStopIdx === idx ? <Check size={16} /> : <Edit3 size={16} />}
                                                    </button>
                                                    <div className="flex flex-col gap-1">
                                                        <button
                                                            onClick={() => moveStop(idx, -1)}
                                                            disabled={idx === 0}
                                                            className="p-1 hover:bg-slate-700 rounded-md text-slate-400 disabled:opacity-20"
                                                        >
                                                            <ChevronUp size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => moveStop(idx, 1)}
                                                            disabled={idx === editStops.length - 1}
                                                            className="p-1 hover:bg-slate-700 rounded-md text-slate-400 disabled:opacity-20"
                                                        >
                                                            <ChevronDown size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3 pt-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare size={14} /> Manager Instructions / Comments
                                    </h4>
                                    <textarea
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 h-24"
                                        placeholder="Add guidelines, target clients, or feedback for the agent..."
                                        value={managerComments}
                                        onChange={(e) => setManagerComments(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex gap-3">
                                <button
                                    onClick={saveChanges}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2"
                                >
                                    <Save size={18} /> Save Draft
                                </button>
                                <button
                                    onClick={approveWithChanges}
                                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2"
                                >
                                    <Check size={18} /> Approve & Sync
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PlanApproval;
