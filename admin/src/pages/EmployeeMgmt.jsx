import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Filter,
    Plus,
    Download,
    MoreHorizontal,
    Mail,
    IdCard,
    MapPin,
    Edit2,
    Trash2,
    ExternalLink,
    Loader2,
    AlertCircle,
    Shield,
    MoreVertical,
    CheckSquare,
    Square,
    UserCircle2,
    Network,
    ArrowRight
} from 'lucide-react';
import api from '../utils/api';
import { getFriendlyErrorMessage } from '../utils/errorMapper';
import { motion, AnimatePresence } from 'framer-motion';

const EmployeeMgmt = () => {
    const [employees, setEmployees] = useState([]);
    const [managers, setManagers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState('All Teams');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkAssigning, setIsBulkAssigning] = useState(false);
    const [selectedManager, setSelectedManager] = useState('');
    const [importResult, setImportResult] = useState(null);

    const [newEmployee, setNewEmployee] = useState({
        full_name: '',
        email: '',
        employee_id: '',
        password: '',
        designation: 'Staff',
        department: 'General',
        employee_type: 'desk'
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [empRes, adminRes] = await Promise.all([
                api.get('/admin/employees'),
                api.get('/admin/sub-admins')
            ]);
            setEmployees(empRes.data);
            setManagers(adminRes.data.filter(a => a.role === 'manager' || a.role === 'owner'));
        } catch (err) {
            setError(getFriendlyErrorMessage(err, 'Failed to fetch initial data.'));
            setTimeout(() => setError(''), 5000);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/admin/employees');
            setEmployees(res.data);
            setSelectedIds([]);
        } catch (err) {
            console.error(err);
        }
    };

    const handleBulkAssign = async () => {
        if (!selectedManager) {
            alert("Please select a manager first.");
            return;
        }
        try {
            setIsBulkAssigning(true);
            await api.post('/admin/employees/bulk-assign-manager', {
                employee_emails: selectedIds,
                manager_email: selectedManager
            });
            alert('Employees assigned successfully.');
            setSelectedIds([]);
            setSelectedManager('');
            fetchEmployees();
        } catch (err) {
            alert(getFriendlyErrorMessage(err, 'Assignment failed.'));
        } finally {
            setIsBulkAssigning(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredEmployees.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredEmployees.map(e => e.email));
        }
    };

    const toggleSelect = (email) => {
        setSelectedIds(prev =>
            prev.includes(email) ? prev.filter(id => id !== email) : [...prev, email]
        );
    };

    const resetPassword = async (email) => {
        const newPw = prompt("Enter new temporary password:");
        if (!newPw) return;
        try {
            setLoading(true);
            await api.post(`/admin/employees/${email}/reset-password`, { password: newPw });
            alert('Password reset successful.');
        } catch (err) {
            alert('Reset failed: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const clearBinding = async (email) => {
        if (!window.confirm(`Clear hardware binding for ${email}? This will allow the user to log in from a new device.`)) return;
        try {
            setLoading(true);
            await api.post(`/admin/employees/${email}/clear-binding`);
            alert('Device binding cleared.');
            fetchEmployees();
        } catch (err) {
            alert('Operation failed: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const deleteEmployee = async (email) => {
        if (!window.confirm(`Are you sure you want to delete ${email}? This will also delete all their attendance records.`)) return;

        try {
            await api.delete(`/admin/employees/${email}`);
            setEmployees(employees.filter(emp => emp.email !== email));
        } catch (err) {
            alert('Failed to delete employee.');
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            const res = await api.post('/admin/import-employees', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setImportResult(res.data);
            fetchEmployees();
        } catch (err) {
            alert('Import failed: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    const downloadTemplate = async () => {
        try {
            const res = await api.get('/admin/employees/import-template', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'employee_import_template.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Download failed: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleManualAdd = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await api.post('/admin/employees', newEmployee);
            alert('Employee registered successfully.');
            setShowAddModal(false);
            fetchEmployees();
        } catch (err) {
            const errorMsg = err.response?.data?.detail;
            const detailedError = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
            alert('Registration failed: ' + (detailedError || err.message));
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = searchTerm === '' ||
            emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDepartment = selectedDepartment === 'All Teams' ||
            (emp.department && emp.department.toLowerCase() === selectedDepartment.toLowerCase());

        return matchesSearch && matchesDepartment;
    });

    return (
        <div className="space-y-8 relative">
            {/* Bulk Action Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-2xl border border-primary-500/30 px-6 py-4 rounded-[2.5rem] shadow-2xl flex items-center gap-6 min-w-[500px]"
                    >
                        <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
                            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center font-bold text-white">
                                {selectedIds.length}
                            </div>
                            <div className="text-sm font-bold text-white">Selected</div>
                        </div>

                        <div className="flex items-center gap-4 flex-1">
                            <Network className="text-slate-400" size={20} />
                            <select
                                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-primary-500"
                                value={selectedManager}
                                onChange={(e) => setSelectedManager(e.target.value)}
                            >
                                <option value="">Select Manager to Assign...</option>
                                {managers.map(m => (
                                    <option key={m.email} value={m.email}>{m.full_name} ({m.role})</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleBulkAssign}
                            disabled={isBulkAssigning || !selectedManager}
                            className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-primary-900/40"
                        >
                            {isBulkAssigning ? <Loader2 className="animate-spin" size={20} /> : <><CheckSquare size={18} /> Assign Manager</>}
                        </button>

                        <button
                            onClick={() => setSelectedIds([])}
                            className="p-3 text-slate-500 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Registration Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-white mb-6">Register New Member</h2>
                        <form onSubmit={handleManualAdd} className="space-y-4">
                            <input
                                placeholder="Full Name"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                required
                                value={newEmployee.full_name}
                                onChange={e => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                            />
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                required
                                value={newEmployee.email}
                                onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    placeholder="Employee ID"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                    required
                                    value={newEmployee.employee_id}
                                    onChange={e => setNewEmployee({ ...newEmployee, employee_id: e.target.value })}
                                />
                                <input
                                    type="password"
                                    placeholder="Set Password"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                    required
                                    value={newEmployee.password || ''}
                                    onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    placeholder="Designation"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                    value={newEmployee.designation}
                                    onChange={e => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                                />
                                <input
                                    placeholder="Department"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                    value={newEmployee.department}
                                    onChange={e => setNewEmployee({ ...newEmployee, department: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {['desk', 'field', 'office'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setNewEmployee({ ...newEmployee, employee_type: type })}
                                        className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all uppercase tracking-widest ${newEmployee.employee_type === type
                                            ? 'bg-primary-500/10 border-primary-500 text-primary-500'
                                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-400 font-bold text-sm">Cancel</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm">Register</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Employee Directory</h1>
                    <p className="text-slate-400">Manage organizational members and team assignments</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        id="excel-import"
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleImport}
                    />
                    <button
                        onClick={downloadTemplate}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 border border-slate-700"
                    >
                        <Download size={16} /> Template
                    </button>
                    <button
                        onClick={() => document.getElementById('excel-import').click()}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 border border-slate-700"
                    >
                        <Download size={18} className="rotate-180" />
                        Import CSV/Excel
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-primary-900/40"
                    >
                        <Plus size={20} />
                        Register Member
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, email or ID..."
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-primary-500/50 transition-all text-slate-200 placeholder:text-slate-600 font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {
                loading ? (
                    <div className="py-24 flex flex-col items-center justify-center bg-slate-900/20 rounded-[2rem] border border-slate-800/50">
                        <Loader2 className="animate-spin text-primary-500 mb-4" size={40} />
                        <p className="text-slate-500 text-sm font-medium">Synchronizing employee database...</p>
                    </div>
                ) : error ? (
                    <div className="py-24 flex flex-col items-center justify-center bg-rose-500/5 rounded-[2rem] border border-rose-500/20 text-rose-400">
                        <AlertCircle size={40} className="mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest">{error}</p>
                    </div>
                ) : (
                    <>
                        {/* Bulk Actions Bar */}
                        <AnimatePresence>
                            {selectedIds.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 50 }}
                                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-6 backdrop-blur-xl"
                                >
                                    <div className="flex items-center gap-3 pr-6 border-r border-slate-800">
                                        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-900/40">
                                            {selectedIds.length}
                                        </div>
                                        <span className="text-white font-bold text-sm">Selected</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowBulkAssign(true)}
                                            className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl text-slate-300 text-sm font-bold transition-all"
                                        >
                                            <UserPlus size={16} /> Assign Manager
                                        </button>

                                        <div className="flex items-center gap-1.5 px-3 border-l border-slate-800">
                                            {['desk', 'field', 'office'].map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => handleBulkTypeChange(type)}
                                                    className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white transition-all"
                                                >
                                                    Set {type}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Delete ${selectedIds.length} employees? This cannot be undone.`)) {
                                                    // TODO: Implement bulk delete if backend supports it, or loop through deletes
                                                    alert("Bulk delete coming soon. Currently using individual revoke.");
                                                }
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 hover:bg-rose-500/10 rounded-xl text-rose-400 text-sm font-bold transition-all border-l border-slate-800 ml-2"
                                        >
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => setSelectedIds([])}
                                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-all ml-4"
                                    >
                                        <X size={20} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800/50">
                                            <th className="px-6 py-5 w-10">
                                                <button onClick={toggleSelectAll} className="text-slate-500 hover:text-primary-500 transition-colors">
                                                    {selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0 ? <CheckSquare size={20} className="text-primary-500" /> : <Square size={20} />}
                                                </button>
                                            </th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Member Profile</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Type</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Designation & Team</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Reporting Manager</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {filteredEmployees.map((emp) => {
                                            const isSelected = selectedIds.includes(emp.email);
                                            const reportingManager = managers.find(m => m.email === emp.manager_id);

                                            return (
                                                <tr key={emp._id} className={`group transition-colors ${isSelected ? 'bg-primary-600/5' : 'hover:bg-slate-800/30'}`}>
                                                    <td className="px-6 py-4">
                                                        <button onClick={() => toggleSelect(emp.email)} className={`${isSelected ? 'text-primary-500' : 'text-slate-700'}`}>
                                                            {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700/50 overflow-hidden group-hover:border-primary-500/30 transition-all">
                                                                {emp.profile_image ? (
                                                                    <img src={`data:image/jpeg;base64,${emp.profile_image}`} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-sm font-bold text-slate-500 group-hover:text-primary-400 transition-colors uppercase">{emp.full_name?.charAt(0)}</span>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-white group-hover:text-primary-400 transition-all truncate">{emp.full_name}</p>
                                                                <p className="text-[10px] text-slate-500 font-medium truncate">{emp.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-widest ${emp.employee_type === 'field' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                            emp.employee_type === 'office' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                            }`}>
                                                            {emp.employee_type || 'desk'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-300 tracking-tight">{emp.department || 'General'}</p>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{emp.designation}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {reportingManager ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30">
                                                                    <UserCircle2 size={12} className="text-indigo-400" />
                                                                </div>
                                                                <span className="text-xs font-semibold text-white">{reportingManager.full_name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded uppercase font-black tracking-widest italic">
                                                                Not Assigned
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => resetPassword(emp.email)}
                                                                title="Security Reset"
                                                                className="p-2 hover:bg-amber-400/10 rounded-xl text-slate-500 hover:text-amber-400 transition-all"
                                                            >
                                                                <Shield size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => clearBinding(emp.email)}
                                                                title="Binding Release"
                                                                className="p-2 hover:bg-primary-400/10 rounded-xl text-slate-500 hover:text-primary-400 transition-all"
                                                            >
                                                                <MoreVertical size={16} />
                                                            </button>
                                                            <button onClick={() => deleteEmployee(emp.email)} className="p-2 hover:bg-rose-500/10 rounded-xl text-slate-500 hover:text-rose-500 transition-all">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )
            }

            {/* Import Results Modal */}
            <ImportResultModal result={importResult} onClose={() => setImportResult(null)} />
        </div>
    );
}

const ImportResultModal = ({ result, onClose }) => {
    if (!result) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-6">Import Results</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-black text-emerald-400">{result.created}</p>
                        <p className="text-xs text-emerald-300/70 font-bold uppercase tracking-wider mt-1">Created</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-black text-blue-400">{result.updated}</p>
                        <p className="text-xs text-blue-300/70 font-bold uppercase tracking-wider mt-1">Updated</p>
                    </div>
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-black text-rose-400">{result.errors?.length || 0}</p>
                        <p className="text-xs text-rose-300/70 font-bold uppercase tracking-wider mt-1">Errors</p>
                    </div>
                </div>
                {result.errors?.length > 0 && (
                    <div className="bg-slate-950 rounded-2xl p-4 mb-6 max-h-40 overflow-y-auto">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Error Details</p>
                        {result.errors.map((e, i) => (
                            <p key={i} className="text-xs text-rose-400 mb-1">Row {e.row}: {e.error}</p>
                        ))}
                    </div>
                )}
                <button onClick={onClose} className="w-full py-3 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-500 transition-all">
                    Done
                </button>
            </div>
        </div>
    );
};

export default EmployeeMgmt;
