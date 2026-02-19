import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { User, Lock, Save, Mail, Phone, Settings, Bell, BookOpen, AlertCircle } from 'lucide-react';
import API from '../api/axiosInstance';

const TeacherSettings = () => {
    const { user, updateUser } = useContext(AuthContext);
    const { success: toastSuccess, error: toastError } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    // State
    const [profile, setProfile] = useState({
        name: '', email: '', phone: '', currentPassword: '', newPassword: '', confirmPassword: ''
    });

    const [settings, setSettings] = useState({
        minAttendance: 75,
        passMarks: 20,
        emailAlerts: true,
        smsAlerts: false,
        weightage: { test1: 0.3, test2: 0.3, assignment: 0.4 }
    });

    // Initial Fetch — uses API instance (centralized auth)
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await API.get('/users/profile');
                const u = data.data;
                setProfile(prev => ({ ...prev, name: u.name, email: u.email }));
                if (u.settings) {
                    setSettings(prev => ({
                        ...prev,
                        ...u.settings,
                        weightage: u.settings.weightage || prev.weightage
                    }));
                }
            } catch (error) {
                console.error("Failed to load profile", error);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();

        // Validate weightage sums to 1.0 (100%)
        const wSum = Number(settings.weightage.test1) + Number(settings.weightage.test2) + Number(settings.weightage.assignment);
        if (Math.abs(wSum - 1.0) > 0.01) {
            toastError(`Weightage must sum to 100%. Current: ${(wSum * 100).toFixed(0)}%`);
            return;
        }

        // Validate ranges
        const minAtt = Number(settings.minAttendance);
        const passMk = Number(settings.passMarks);
        if (isNaN(minAtt) || minAtt < 1 || minAtt > 100) {
            toastError("Min. Attendance must be between 1 and 100.");
            return;
        }
        if (isNaN(passMk) || passMk < 1 || passMk > 50) {
            toastError("Pass Marks must be between 1 and 50.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: profile.name,
                settings: settings
            };

            if (profile.newPassword) {
                if (profile.newPassword !== profile.confirmPassword) {
                    toastError("Passwords do not match");
                    setLoading(false);
                    return;
                }
                payload.password = profile.newPassword;
            }

            await API.put('/users/profile', payload);

            toastSuccess("Settings saved successfully");
            setProfile(prev => ({ ...prev, newPassword: '', confirmPassword: '', currentPassword: '' }));
        } catch (error) {
            console.error(error);
            toastError(error.response?.data?.message || "Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    const handleWeightageChange = (field, value) => {
        const parsed = parseFloat(value);
        setSettings(prev => ({
            ...prev,
            weightage: { ...prev.weightage, [field]: isNaN(parsed) ? 0 : parsed }
        }));
    };

    const weightageSum = (Number(settings.weightage.test1) || 0) + (Number(settings.weightage.test2) || 0) + (Number(settings.weightage.assignment) || 0);
    const weightageValid = Math.abs(weightageSum - 1.0) <= 0.01;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 text-base-content">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Settings className="text-primary" size={32} />
                System Preferences
            </h1>

            {/* Tabs */}
            <div className="tabs tabs-boxed bg-base-100 p-1 rounded-xl border border-base-200 shadow-sm w-fit mb-6">
                <a className={`tab px-6 ${activeTab === 'profile' ? 'tab-active bg-primary text-primary-content' : ''}`} onClick={() => setActiveTab('profile')}>Profile & Security</a>
                <a className={`tab px-6 ${activeTab === 'academic' ? 'tab-active bg-primary text-primary-content' : ''}`} onClick={() => setActiveTab('academic')}>Academic Config</a>
                <a className={`tab px-6 ${activeTab === 'notifications' ? 'tab-active bg-primary text-primary-content' : ''}`} onClick={() => setActiveTab('notifications')}>Notifications</a>
            </div>

            <form onSubmit={handleSave}>
                <div className="grid grid-cols-1 gap-8">

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="card bg-base-100 shadow-xl border border-base-200">
                            <div className="card-body">
                                <h2 className="card-title flex items-center gap-2 mb-4">
                                    <User size={20} className="text-secondary" /> Personal Details
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">Full Name</span></label>
                                        <input type="text" className="input input-bordered" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">Email</span></label>
                                        <input type="email" className="input input-bordered" value={profile.email} disabled />
                                        <label className="label"><span className="label-text-alt text-warning">Contact admin to change email</span></label>
                                    </div>
                                </div>

                                <div className="divider">Security</div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">New Password</span></label>
                                        <input type="password" className="input input-bordered" value={profile.newPassword} onChange={e => setProfile({ ...profile, newPassword: e.target.value })} placeholder="Leave blank to keep current" />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">Confirm Password</span></label>
                                        <input type="password" className="input input-bordered" value={profile.confirmPassword} onChange={e => setProfile({ ...profile, confirmPassword: e.target.value })} disabled={!profile.newPassword} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ACADEMIC TAB */}
                    {activeTab === 'academic' && (
                        <div className="card bg-base-100 shadow-xl border border-base-200">
                            <div className="card-body">
                                <h2 className="card-title flex items-center gap-2 mb-4">
                                    <BookOpen size={20} className="text-accent" /> Academic Thresholds
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-bold">Min. Attendance (%)</span></label>
                                        <input type="number" min="1" max="100" className="input input-bordered" value={settings.minAttendance} onChange={e => setSettings({ ...settings, minAttendance: parseFloat(e.target.value) || 0 })} />
                                        <label className="label"><span className="label-text-alt opacity-60">Students below this will be flagged as Critical/Risk.</span></label>
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-bold">Pass Marks (Total)</span></label>
                                        <input type="number" min="1" max="50" className="input input-bordered" value={settings.passMarks} onChange={e => setSettings({ ...settings, passMarks: parseFloat(e.target.value) || 0 })} />
                                        <label className="label"><span className="label-text-alt opacity-60">Minimum internal marks required to pass (max 50).</span></label>
                                    </div>
                                </div>

                                <div className="divider">Internal Marks Weightage</div>
                                <div className="alert bg-base-200/50 text-xs shadow-sm mb-4">
                                    <AlertCircle size={16} className="text-info" />
                                    <span>Define how the total internal mark is calculated. Weights should sum to 1.0 (100%).</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">Test 1 Weight</span></label>
                                        <input type="number" step="0.05" min="0" max="1" className="input input-bordered" value={settings.weightage.test1} onChange={e => handleWeightageChange('test1', e.target.value)} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">Test 2 Weight</span></label>
                                        <input type="number" step="0.05" min="0" max="1" className="input input-bordered" value={settings.weightage.test2} onChange={e => handleWeightageChange('test2', e.target.value)} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">Assignment Weight</span></label>
                                        <input type="number" step="0.05" min="0" max="1" className="input input-bordered" value={settings.weightage.assignment} onChange={e => handleWeightageChange('assignment', e.target.value)} />
                                    </div>
                                </div>

                                <div className={`mt-2 text-right text-sm font-bold ${weightageValid ? 'text-success' : 'text-error'}`}>
                                    Total: {(weightageSum * 100).toFixed(0)}%
                                    {!weightageValid && (
                                        <span className="ml-2 text-error text-xs font-normal">⚠ Must equal 100%</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === 'notifications' && (
                        <div className="card bg-base-100 shadow-xl border border-base-200">
                            <div className="card-body">
                                <h2 className="card-title flex items-center gap-2 mb-4">
                                    <Bell size={20} className="text-warning" /> Alert Preferences
                                </h2>
                                <div className="form-control">
                                    <label className="label cursor-pointer justify-start gap-4">
                                        <input type="checkbox" className="toggle toggle-primary" checked={settings.emailAlerts} onChange={e => setSettings({ ...settings, emailAlerts: e.target.checked })} />
                                        <span className="label-text font-bold">Email Alerts</span>
                                    </label>
                                    <p className="text-xs opacity-60 ml-14">Receive daily summaries and critical risk alerts via email.</p>
                                </div>
                                <div className="form-control mt-4">
                                    <label className="label cursor-pointer justify-start gap-4">
                                        <input type="checkbox" className="toggle toggle-secondary" checked={settings.smsAlerts} onChange={e => setSettings({ ...settings, smsAlerts: e.target.checked })} />
                                        <span className="label-text font-bold">SMS/WhatsApp Alerts</span>
                                    </label>
                                    <p className="text-xs opacity-60 ml-14">Get urgent notifications for extremely low attendance or behavioral flags.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button type="submit" className="btn btn-primary btn-wide gap-2 shadow-lg" disabled={loading}>
                            {loading ? <span className="loading loading-spinner"></span> : <Save size={18} />}
                            Save All Changes
                        </button>
                    </div>

                </div>
            </form>
        </div>
    );
};

export default TeacherSettings;
