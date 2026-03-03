import React, { useState, useEffect } from 'react';
import {
    Receipt,
    CheckCircle,
    XCircle,
    MessageSquare,
    Clock,
    DollarSign,
    User,
    Filter,
    Map,
    Eye,
    AlertCircle,
    Bed,
    Navigation2,
    Calendar,
    ChevronRight,
    Search
} from 'lucide-react';

import client from '../utils/api';

const ExpenseApproval = () => {
    const [activeTab, setActiveTab] = useState('standard'); // 'standard' or 'km'
    const [claims, setClaims] = useState([]);
    const [kmClaims, setKmClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [queryText, setQueryText] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [viewingReceipt, setViewingReceipt] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = statusFilter ? `?status=${statusFilter}` : '';
            if (activeTab === 'standard') {
                const res = await client.get(`/admin/expenses${params}`);
                setClaims(res.data);
            } else {
                const res = await client.get(`/admin/field/reimbursements${params}`);
                setKmClaims(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch claims:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        setSelectedClaim(null);
    }, [statusFilter, activeTab]);

    const handleAction = async (claimId, action) => {
        setActionLoading(true);
        try {
            if (activeTab === 'standard') {
                const body = { action };
                if (action === 'query') body.query_text = queryText;
                await client.put(`/admin/expenses/${claimId}`, body);
            } else {
                await client.post(`/admin/field/reimbursements/${claimId}/${action}`);
            }
            setSelectedClaim(null);
            setQueryText('');
            fetchData();
        } catch (err) {
            console.error('Failed to update claim:', err);
        }
        setActionLoading(false);
    };

    const statusColors = {
        pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_15px_-5px_rgba(245,158,11,0.3)]',
        approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]',
        rejected: 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_15px_-5px_rgba(244,63,94,0.3)]',
        queried: 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_15px_-5px_rgba(59,130,246,0.3)]',
    };

    const totalAmount = activeTab === 'standard'
        ? claims.reduce((s, c) => s + (c.amount || 0), 0)
        : kmClaims.reduce((s, c) => s + (c.total_amount || 0), 0);

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
                        <div className="p-3 bg-primary-500/20 rounded-2xl border border-primary-500/30 shadow-lg shadow-primary-500/10">
                            <Receipt className="text-primary-400" size={28} />
                        </div>
                        Financial Controls
                    </h1>
                    <p className="text-slate-400 text-sm mt-2 font-medium">Verify field expenditures and mobility reimbursements</p>
                </div>

                <div className="flex items-center gap-3 bg-slate-900/40 p-1.5 rounded-2xl border border-slate-800/50 backdrop-blur-md">
                    <button
                        onClick={() => setActiveTab('standard')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'standard'
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                            : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Receipt size={18} /> Standard Expenses
                    </button>
                    <button
                        onClick={() => setActiveTab('km')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'km'
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                            : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Navigation2 size={18} /> Mobility (KM)
                    </button>
                    <div className="w-px h-8 bg-slate-800 mx-2" />
                    <div className="px-4 py-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Total Exposure</p>
                        <p className="text-lg font-black text-white">₹{totalAmount.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Sub-Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-800/50">
                <div className="flex gap-2">
                    {['pending', 'approved', 'rejected', 'queried', ''].map(status => (
                        <button
                            key={status || 'all'}
                            onClick={() => setStatusFilter(status)}
                            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${statusFilter === status
                                ? 'bg-slate-800 text-primary-400 border-primary-500/30'
                                : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/30'
                                }`}
                        >
                            {status || 'All Claims'}
                        </button>
                    ))}
                </div>
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search employee..."
                        className="bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-primary-500/50 transition-all w-64"
                    />
                </div>
            </div>

            {/* Claims Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-12 h-12 border-4 border-primary-500/10 border-t-primary-500 rounded-full animate-spin" />
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">Syncing with ledger...</p>
                </div>
            ) : (activeTab === 'standard' ? claims : kmClaims).length === 0 ? (
                <div className="bg-slate-900/20 border border-slate-800/50 border-dashed rounded-[2rem] p-24 text-center">
                    <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-800">
                        <Receipt size={32} className="text-slate-700" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-400">Quiet for now</h3>
                    <p className="text-slate-600 text-sm mt-2 max-w-xs mx-auto">No {statusFilter} claims match your criteria in {activeTab} section.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {(activeTab === 'standard' ? claims : kmClaims).map(claim => (
                        <div key={claim._id} className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-[1.5rem] p-6 hover:border-primary-500/30 transition-all group flex flex-col h-full relative overflow-hidden">
                            {/* Status Stripe */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusFilter === 'pending' ? 'bg-amber-500/50' : 'bg-slate-800'}`} />

                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-lg font-black text-slate-300 border border-slate-700/50 group-hover:bg-primary-500/10 group-hover:text-primary-400 transition-colors">
                                        {(claim.employee_name || claim.full_name || 'U').charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold tracking-tight text-lg">{claim.employee_name || claim.full_name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{claim.employee_id}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(claim.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusColors[claim.status] || statusColors.pending}`}>
                                    {claim.status}
                                </span>
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 space-y-4">
                                {activeTab === 'km' ? (
                                    <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800/50">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                <Navigation2 size={12} className="text-primary-500" /> Mobility Claim
                                            </span>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-500 font-bold">Total Amount</p>
                                                <p className="text-xl font-black text-primary-400">₹{claim.total_amount?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/30">
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Total Distance</p>
                                                <p className="text-sm font-bold text-white">{claim.total_km} KM</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Applied Rate</p>
                                                <p className="text-sm font-bold text-white">₹{claim.rate_per_km}/km</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-800/30">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Billing Date</p>
                                            <p className="text-sm text-slate-300 font-medium">{new Date(claim.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center bg-slate-950/40 rounded-2xl p-4 border border-slate-800/50">
                                            <div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{claim.expense_type}</span>
                                                <p className="text-slate-300 text-sm italic line-clamp-2">"{claim.description || 'No description provided'}"</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-500 font-bold">Claimed</p>
                                                <p className="text-xl font-black text-white">₹{claim.amount?.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {/* Accommodation Specific Details */}
                                        {claim.expense_type.toLowerCase() === 'accommodation' && (
                                            <div className="grid grid-cols-1 gap-3 p-4 bg-primary-500/5 rounded-2xl border border-primary-500/10">
                                                <div className="flex items-center gap-3">
                                                    <Bed size={16} className="text-primary-400" />
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 font-bold">Property & Nights</p>
                                                        <p className="text-xs text-slate-200">
                                                            {claim.accommodation_name || 'Guest House'} •
                                                            <span className="font-bold text-primary-400 ml-1">{claim.nights || 1} Nights</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Map size={16} className="text-primary-400" />
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 font-bold">Location</p>
                                                        <p className="text-xs text-slate-200">{claim.location_city || 'Assigned Territory'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Fuel/KM Specific Details */}
                                        {claim.expense_type.toLowerCase() === 'fuel' && (
                                            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Validation</span>
                                                    {claim.claimed_km && claim.auto_calculated_km && Math.abs(claim.claimed_km - claim.auto_calculated_km) > 5 && (
                                                        <div className="flex items-center gap-1 bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full border border-rose-500/10">
                                                            <AlertCircle size={10} />
                                                            <span className="text-[8px] font-black uppercase">Anomaly</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[10px] text-slate-500">Claimed KM</p>
                                                        <p className="text-sm font-bold text-white">{claim.claimed_km || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-500">Logged KM</p>
                                                        <p className="text-sm font-bold text-primary-400">{claim.auto_calculated_km || 0}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Receipt */}
                                        {claim.receipt_url && (
                                            <div className="relative group/img aspect-video rounded-2xl overflow-hidden border border-slate-800">
                                                <img
                                                    src={claim.receipt_url}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110 cursor-zoom-in"
                                                    alt="Receipt Proof"
                                                    onClick={() => setViewingReceipt(claim.receipt_url)}
                                                />
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 to-transparent p-4 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest shadow-lg">Tap to verify</span>
                                                        <Eye size={12} className="text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Footer Actions */}
                            {claim.status === 'pending' && (
                                <div className="mt-6 pt-6 border-t border-slate-800/50">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAction(claim._id, 'approve')}
                                            className="flex-1 bg-emerald-600/10 text-emerald-400 py-3 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-500/20 hover:bg-emerald-600/20 transition-all flex items-center justify-center gap-2 group/btn"
                                        >
                                            <CheckCircle size={14} className="group-hover/btn:scale-110 transition-transform" /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleAction(claim._id, 'reject')}
                                            className="flex-1 bg-rose-500/10 text-rose-400 py-3 rounded-xl text-xs font-black uppercase tracking-widest border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2 group/btn"
                                        >
                                            <XCircle size={14} className="group-hover/btn:rotate-90 transition-transform" /> Reject
                                        </button>
                                        {activeTab === 'standard' && (
                                            <button
                                                onClick={() => setSelectedClaim(claim._id === selectedClaim ? null : claim._id)}
                                                className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-all ${selectedClaim === claim._id
                                                    ? 'bg-primary-500 text-white border-primary-500'
                                                    : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'}`}
                                            >
                                                <MessageSquare size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {selectedClaim === claim._id && (
                                        <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={queryText}
                                                    onChange={e => setQueryText(e.target.value)}
                                                    placeholder="Reason for query..."
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-primary-500/50 transition-all pr-12"
                                                />
                                                <button
                                                    onClick={() => handleAction(claim._id, 'query')}
                                                    disabled={!queryText.trim()}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-all disabled:opacity-50"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Receipt Modal */}
            {viewingReceipt && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-10 backdrop-blur-sm cursor-zoom-out"
                    onClick={() => setViewingReceipt(null)}
                >
                    <div className="relative max-w-5xl w-full max-h-full flex flex-col gap-4">
                        <img
                            src={viewingReceipt}
                            className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-slate-800 shadow-primary-500/5 animate-in zoom-in-95 duration-300"
                            alt="Receipt Audit View"
                        />
                        <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Document Integrity Checked</p>
                            <button className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors">
                                <Clock size={16} /> Full View Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseApproval;
