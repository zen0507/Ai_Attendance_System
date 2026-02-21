import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, AlertCircle, Eye, EyeOff, Key } from 'lucide-react';
import API from '../api/axiosInstance';

const ChangePassword = () => {
    const { logout } = useContext(AuthContext);
    const { success: toastSuccess, error: toastError } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);

    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const validateComplexity = (pwd) => {
        const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/;
        return regex.test(pwd);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
            toastError("All fields are required.");
            return;
        }

        if (form.newPassword !== form.confirmPassword) {
            toastError("New passwords do not match.");
            return;
        }

        if (!validateComplexity(form.newPassword)) {
            toastError("Password must be at least 8 characters long and contain at least one letter and one number.");
            return;
        }

        setLoading(true);
        try {
            await API.put('/users/change-password', {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword
            });

            toastSuccess("Password changed successfully. Please log in again.");
            setTimeout(() => {
                logout();
                navigate('/login');
            }, 2000);
        } catch (error) {
            toastError(error.response?.data?.message || "Failed to change password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <ShieldCheck size={32} className="text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
                <p className="text-base-content/60 max-w-md">Update your password to keep your account secure.</p>
            </div>

            <div className="card bg-base-100 shadow-2xl border border-base-200">
                <form onSubmit={handleSubmit} className="card-body gap-6">
                    <h2 className="card-title text-sm uppercase tracking-widest opacity-50 flex items-center gap-2">
                        <Key size={18} /> Update Password
                    </h2>

                    <div className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold">Current Password</span>
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-base-content/30">
                                    <Lock size={18} />
                                </span>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    className="input input-bordered w-full pl-10 focus:input-primary transition-all"
                                    placeholder="Enter current password"
                                    value={form.currentPassword}
                                    onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="divider opacity-50 text-[10px] uppercase font-bold tracking-tighter">New Credentials</div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold">New Password</span>
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-base-content/30">
                                    <Lock size={18} />
                                </span>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    className="input input-bordered w-full pl-10 focus:input-primary transition-all"
                                    placeholder="Minimum 8 characters, letter + number"
                                    value={form.newPassword}
                                    onChange={e => setForm({ ...form, newPassword: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/40 hover:text-primary transition-colors"
                                    onClick={() => setShowPasswords(!showPasswords)}
                                >
                                    {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold">Confirm New Password</span>
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-base-content/30">
                                    <Lock size={18} />
                                </span>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    className="input input-bordered w-full pl-10 focus:input-primary transition-all"
                                    placeholder="Repeat new password"
                                    value={form.confirmPassword}
                                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Complexity Checklist */}
                    <div className="bg-base-200/50 rounded-xl p-4 text-xs space-y-2 border border-base-200">
                        <p className="font-bold opacity-60 flex items-center gap-1 uppercase tracking-tight text-[10px]">
                            <AlertCircle size={12} /> Password Requirements
                        </p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                            <li className={`flex items-center gap-2 ${form.newPassword.length >= 8 ? 'text-success' : 'opacity-40'}`}>
                                <div className={`w-1 h-1 rounded-full ${form.newPassword.length >= 8 ? 'bg-success' : 'bg-base-content'}`} />
                                Minimum 8 characters
                            </li>
                            <li className={`flex items-center gap-2 ${/[A-Za-z]/.test(form.newPassword) ? 'text-success' : 'opacity-40'}`}>
                                <div className={`w-1 h-1 rounded-full ${/[A-Za-z]/.test(form.newPassword) ? 'bg-success' : 'bg-base-content'}`} />
                                At least one letter
                            </li>
                            <li className={`flex items-center gap-2 ${/\d/.test(form.newPassword) ? 'text-success' : 'opacity-40'}`}>
                                <div className={`w-1 h-1 rounded-full ${/\d/.test(form.newPassword) ? 'bg-success' : 'bg-base-content'}`} />
                                At least one number
                            </li>
                            <li className={`flex items-center gap-2 ${form.newPassword === form.confirmPassword && form.newPassword !== '' ? 'text-success' : 'opacity-40'}`}>
                                <div className={`w-1 h-1 rounded-full ${form.newPassword === form.confirmPassword && form.newPassword !== '' ? 'bg-success' : 'bg-base-content'}`} />
                                Passwords match
                            </li>
                        </ul>
                    </div>

                    <div className="card-actions justify-end mt-4">
                        <button type="submit" className="btn btn-primary btn-block md:w-auto md:px-12 gap-2 shadow-lg shadow-primary/20" disabled={loading}>
                            {loading ? <span className="loading loading-spinner loading-sm" /> : <ShieldCheck size={18} />}
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
