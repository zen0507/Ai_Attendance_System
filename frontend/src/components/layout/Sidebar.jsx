import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, BookOpen, Brain,
    BarChart2, Settings, X, LogOut, CheckSquare,
    FileText, Sun, Moon, ChevronRight, Shield, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const role = user?.role;
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getLinks = () => {
        switch (role) {
            case 'admin':
                return [
                    { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
                    { path: '/change-password', icon: <Lock size={20} />, label: 'Security' },
                    { path: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
                ];
            case 'teacher':
                return [
                    { path: '/teacher/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
                    { path: '/teacher/attendance', icon: <CheckSquare size={20} />, label: 'Attendance' },
                    { path: '/teacher/marks', icon: <FileText size={20} />, label: 'Internal Marks' },
                    { path: '/change-password', icon: <Lock size={20} />, label: 'Security' },
                    { path: '/teacher/settings', icon: <Settings size={20} />, label: 'Settings' },
                ];
            case 'student':
                return [
                    { path: '/student/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
                    { path: '/student/attendance', icon: <CheckSquare size={20} />, label: 'My Attendance' },
                    { path: '/student/marks', icon: <BarChart2 size={20} />, label: 'Performance' },
                    { path: '/change-password', icon: <Lock size={20} />, label: 'Security' },
                ];
            case 'hod':
                return [
                    { path: '/hod/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
                    { path: '/teacher/attendance', icon: <CheckSquare size={20} />, label: 'My Classes' }, // Reuse teacher route
                    { path: '/hod/department', icon: <Users size={20} />, label: 'Department' }, // Future placeholder
                    { path: '/hod/reports', icon: <BarChart2 size={20} />, label: 'Reports' },   // Future placeholder
                    { path: '/change-password', icon: <Lock size={20} />, label: 'Security' },
                ];
            case 'parent':
                return [
                    { path: '/parent/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
                    { path: '/parent/attendance', icon: <CheckSquare size={20} />, label: 'Attendance' },
                    { path: '/parent/performance', icon: <BarChart2 size={20} />, label: 'Performance' },
                    { path: '/change-password', icon: <Lock size={20} />, label: 'Security' },
                ];
            default:
                return [];
        }
    };

    const links = getLinks();

    // Sidebar Content Component
    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-base-100 border-r border-base-200 text-base-content font-poppins">
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-base-200/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/10">
                        <Brain size={24} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl tracking-tight leading-none">AcadIQ</h1>
                        <span className="text-[10px] uppercase tracking-wider text-base-content/40 font-semibold">Intelligence</span>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="md:hidden btn btn-ghost btn-sm btn-square">
                    <X size={20} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                <div className="text-xs font-bold text-base-content/40 uppercase tracking-wider px-4 mb-3">Menu</div>
                {links.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive
                                ? 'bg-gradient-to-r from-primary to-secondary text-white font-medium shadow-lg shadow-primary/25 translate-x-1'
                                : 'text-base-content/60 hover:bg-base-200 hover:text-base-content hover:translate-x-1'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className="flex items-center gap-3.5">
                                    {link.icon}
                                    <span className="text-sm">{link.label}</span>
                                </div>
                                <ChevronRight size={16} className={`opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 ${isActive ? 'text-white' : ''}`} />
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-base-200/50 space-y-2 bg-base-50/50">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-base-200/50 hover:bg-base-200 transition-colors text-sm font-medium group"
                >
                    <div className="flex items-center gap-3">
                        {theme === 'dark' ? <Moon size={18} className="group-hover:text-primary transition-colors" /> : <Sun size={18} className="group-hover:text-orange-500 transition-colors" />}
                        <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                    </div>
                    <div className={`toggle toggle-sm ${theme === 'dark' ? 'toggle-primary bg-primary border-primary' : 'grayscale'}`} checked={theme === 'dark'}></div>
                </button>

                {/* User Profile / Logout */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-base-100 border border-base-200 shadow-sm mt-4 hover:shadow-md transition-shadow duration-300">
                    <div className="avatar placeholder">
                        <div className="bg-gradient-to-br from-primary to-secondary text-white rounded-xl w-10">
                            <span className="text-sm font-bold">{user?.name?.charAt(0) || 'U'}</span>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-base-content/50 truncate capitalize flex items-center gap-1">
                            {user?.role === 'admin' && <Shield size={10} className="text-primary" />}
                            {user?.role || 'Guest'}
                        </p>
                    </div>
                    <button onClick={handleLogout} className="btn btn-ghost btn-sm btn-square text-error/70 hover:text-error hover:bg-error/10 transition-colors" title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>

                {/* Version */}
                <div className="text-center mt-2">
                    <p className="text-[10px] text-base-content/20 font-medium tracking-widest uppercase">v1.0 • AcadIQ System</p>
                </div>
            </div>
        </div>
    );

    // Render logic
    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)}></div>
                    <aside className="absolute left-0 top-0 bottom-0 w-72 bg-base-100 shadow-2xl flex flex-col slide-in-left animate-in fade-in slide-in-from-left duration-300">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 bg-base-100/50 backdrop-blur-xl border-r border-base-200 z-30">
                <SidebarContent />
            </aside>
        </>
    );
};

export default Sidebar;
