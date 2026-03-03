import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Building2, User, Mail, Lock, ArrowRight, Loader2, CheckCircle, ImagePlus } from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterOrg = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        org_name: '',
        admin_full_name: '',
        admin_email: '',
        admin_password: '',
        primary_color: '#3b82f6' // Default Blue
    });
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoBase64, setLogoBase64] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const generateSlug = (name) => {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Please upload a valid image (JPEG, PNG, GIF, or WebP).');
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB
            setError('Logo must be under 2MB.');
            return;
        }
        setError('');
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            setLogoPreview(dataUrl);
            setLogoBase64(dataUrl);
        };
        reader.onerror = () => setError('Failed to read file.');
        reader.readAsDataURL(file);
    };

    const clearLogo = () => {
        setLogoPreview(null);
        setLogoBase64(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const payload = {
                ...formData,
                org_slug: generateSlug(formData.org_name),
                logo_url: logoBase64 || 'https://via.placeholder.com/150'
            };

            await api.post('/admin/register-organization', payload);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg"
            >
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-4 border border-purple-500/30">
                            <Building2 className="text-purple-500" size={32} />
                        </div>
                        <h1 className="text-3xl font-bold bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent text-center">
                            Register Organization
                        </h1>
                        <p className="text-slate-400 mt-2 text-center">Start your journey with OfficeFlow Enterprise</p>
                    </div>

                    {success ? (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center py-8"
                        >
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="text-green-500" size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Registration Successful!</h3>
                            <p className="text-slate-400">Account created for {formData.org_name}.<br />Redirecting to login...</p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                <input
                                    name="org_name"
                                    type="text"
                                    placeholder="Organization Name"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-purple-500/50 transition-all text-slate-200 placeholder:text-slate-600"
                                    value={formData.org_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                <input
                                    name="admin_full_name"
                                    type="text"
                                    placeholder="Admin Full Name"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-purple-500/50 transition-all text-slate-200 placeholder:text-slate-600"
                                    value={formData.admin_full_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                <input
                                    name="admin_email"
                                    type="email"
                                    placeholder="Admin Email"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-purple-500/50 transition-all text-slate-200 placeholder:text-slate-600"
                                    value={formData.admin_email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                <input
                                    name="admin_password"
                                    type="password"
                                    placeholder="Password"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-purple-500/50 transition-all text-slate-200 placeholder:text-slate-600"
                                    value={formData.admin_password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="pt-2">
                                <label className="text-slate-400 text-sm mb-2 block ml-1">Organization Logo (optional)</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />
                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 transition-all text-sm"
                                    >
                                        <ImagePlus size={18} />
                                        {logoPreview ? 'Change Logo' : 'Upload Logo'}
                                    </button>
                                    {logoPreview && (
                                        <div className="relative">
                                            <img src={logoPreview} alt="Logo preview" className="w-14 h-14 rounded-xl object-contain border border-slate-700" />
                                            <button type="button" onClick={clearLogo} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/80 text-white text-xs flex items-center justify-center hover:bg-red-500">×</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="text-slate-400 text-sm mb-2 block ml-1">Primary Brand Color</label>
                                <div className="flex gap-3">
                                    {['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981'].map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, primary_color: color })}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${formData.primary_color === color ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={formData.primary_color}
                                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                        className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-purple-900/20"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                                {!isSubmitting && <ArrowRight size={20} />}
                            </button>

                            <div className="text-center mt-6">
                                <Link to="/login" className="text-slate-400 hover:text-white text-sm transition-colors">
                                    Already have an account? Login
                                </Link>
                            </div>
                        </form>
                    )}
                    <p className="text-center text-slate-500 text-xs mt-6 pt-4 border-t border-slate-800/50">
                        Powered by OfficeFlow
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterOrg;
