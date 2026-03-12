import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    FileText,
    Settings,
    LogOut,
    Shield,
    ChevronRight,
    Navigation,
    Target,
    ClipboardCheck,
    Receipt,
    AlertTriangle,
    PlaneTakeoff,
    Network,
    ShieldX,
    Zap,
    Trophy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const Sidebar = () => {
    const { logout, admin, organization } = useAuth();
    const navigate = useNavigate();

    const isOwner = admin?.role === 'owner' || admin?.role === 'superadmin' || admin?.role === 'admin';
    const allowed = admin?.allowed_features || [];

    const ALL_MENU_ITEMS = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', featureId: 'dashboard' },
        { icon: Users, label: 'Employee Mgmt', path: '/dashboard/employees', featureId: 'employees' },
        { icon: Shield, label: 'Team Management', path: '/dashboard/admins', adminOnly: true },
        { icon: Network, label: 'Org Structure', path: '/dashboard/org', adminOnly: true },
        { icon: CalendarCheck, label: 'Attendance Logs', path: '/dashboard/logs', featureId: 'attendance' },
        { icon: Navigation, label: 'Field War Room', path: '/dashboard/war-room', featureId: 'war_room' },
        { icon: Target, label: 'Territory Manager', path: '/dashboard/territories', featureId: 'territory' },
        { icon: ClipboardCheck, label: 'Visit Approvals', path: '/dashboard/approvals', featureId: 'attendance' }, // Binding to attendance for now
        { icon: AlertTriangle, label: 'Alerts Center', path: '/dashboard/alerts', featureId: 'dashboard' },
        { icon: ShieldX, label: 'Fraud Dashboard', path: '/dashboard/fraud', featureId: 'reports' },
        { icon: PlaneTakeoff, label: 'Leave Management', path: '/dashboard/leave', featureId: 'leaves' },
        { icon: Receipt, label: 'Expense Approvals', path: '/dashboard/expenses', featureId: 'expenses' },
        { icon: Zap, label: 'Nudge Center', path: '/dashboard/nudge', featureId: 'nudge' },
        { icon: Trophy, label: 'Team Leaderboard', path: '/dashboard/leaderboard', featureId: 'leaderboard' },
        { icon: FileText, label: 'Reports', path: '/dashboard/reports', featureId: 'reports' },
        { icon: Settings, label: 'Settings', path: '/dashboard/settings', adminOnly: true },
    ];

    const menuItems = ALL_MENU_ITEMS.filter(item => {
        if (isOwner) return true;
        if (item.adminOnly) return false;
        return allowed.includes(item.featureId);
    });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="w-72 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 h-screen sticky top-0 flex flex-col pt-8 pb-4">
            <div className="px-6 mb-10 flex items-center gap-3">
                {organization?.logo_url && organization.logo_url.startsWith('http') ? (
                    <img src={organization.logo_url} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-white/5 p-1 border border-slate-700" />
                ) : (
                    <div className="w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center border border-primary-500/30"
                        style={{
                            backgroundColor: organization?.primary_color ? `${organization.primary_color}33` : undefined,
                            borderColor: organization?.primary_color ? `${organization.primary_color}50` : undefined
                        }}
                    >
                        <Shield className="text-primary-500" size={20} style={{ color: organization?.primary_color }} />
                    </div>
                )}
                <div>
                    <h2 className="text-lg font-bold text-white tracking-tight leading-none truncate max-w-[160px]" title={organization?.name}>
                        {organization?.name || 'OfficeFlow'}
                    </h2>
                    <span className="text-[10px] text-primary-500 font-bold uppercase tracking-widest" style={{ color: organization?.primary_color }}>
                        {organization ? 'Enterprise' : 'Admin Portal'}
                    </span>
                </div>
            </div>

            <nav className="flex-1 px-3 space-y-1">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden",
                                isActive
                                    ? "bg-primary-600/10 text-primary-400 border border-primary-500/20"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    size={20}
                                    className={cn(
                                        "transition-transform group-hover:scale-110",
                                        isActive ? "text-primary-500" : ""
                                    )}
                                />
                                <span className="font-medium text-sm flex-1">{item.label}</span>
                                <ChevronRight
                                    size={16}
                                    className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0"
                                />

                                {/* Active Indicator Bar (NOT a link) */}
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        "absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary-500 rounded-r-full transition-transform duration-300",
                                        isActive ? "scale-y-100" : "scale-y-0"
                                    )}
                                />
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="px-3 pt-4 border-t border-slate-800/50">
                <div className="bg-slate-950/50 rounded-2xl p-4 mb-4 border border-slate-800/50">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                            {admin?.full_name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{admin?.full_name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{admin?.email || 'admin@officeflow.ai'}</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all group"
                >
                    <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium text-sm">Sign Out System</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
