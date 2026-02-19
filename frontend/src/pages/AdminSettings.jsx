import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUser, registerUser, getAllUsers, deleteUser } from '../api/adminApi';
import { User, Lock, Shield, Plus, Trash2, Save, X, Mail } from 'lucide-react';

const AdminSettings = () => {
    const { user: currentUser, setUser } = useAuth(); // Update context if profile changes
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Profile Form State
    const [profileData, setProfileData] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        password: '',
        confirmPassword: ''
    });

    // New Admin Form State
    const [newAdmin, setNewAdmin] = useState({
        name: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const users = await getAllUsers();
            const adminUsers = users.filter(u => u.role === 'admin');
            setAdmins(adminUsers);
        } catch (error) {
            console.error("Failed to fetch admins", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = (msg) => {
        setMessage({ text: msg, type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleError = (error, defaultMsg) => {
        setMessage({ text: error.response?.data?.message || error.message || defaultMsg, type: 'error' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (profileData.password && profileData.password !== profileData.confirmPassword) {
            handleError({ message: "Passwords do not match" });
            return;
        }

        try {
            const updatePayload = {
                name: profileData.name,
                email: profileData.email,
            };
            if (profileData.password) updatePayload.password = profileData.password;

            const updatedUser = await updateUser(currentUser._id, updatePayload);

            // Update local context
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const newUserInfo = { ...userInfo, ...updatedUser };
            localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
            // Note: In a real app, we might need to refresh the token if critical info changed, but for now we update the user object.

            handleSuccess("Profile updated successfully");
            setProfileData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        } catch (error) {
            handleError(error, "Failed to update profile");
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        try {
            await registerUser({ ...newAdmin, role: 'admin' });
            setNewAdmin({ name: '', email: '', password: '' });
            document.getElementById('new_admin_modal').close();
            handleSuccess("New Admin created successfully");
            fetchAdmins();
        } catch (error) {
            handleError(error, "Failed to create admin");
        }
    };

    const handleDeleteAdmin = async (id) => {
        if (id === currentUser._id) {
            handleError({ message: "You cannot delete your own account" });
            return;
        }
        if (!window.confirm("Are you sure you want to delete this admin?")) return;

        try {
            await deleteUser(id);
            handleSuccess("Admin deleted successfully");
            fetchAdmins();
        } catch (error) {
            handleError(error, "Failed to delete admin");
        }
    };

    return (
        <div className="space-y-8 fade-in max-w-5xl mx-auto pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-base-content/60">Manage your profile and system administrators.</p>
                </div>
            </div>

            {message.text && (
                <div role="alert" className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                    <span>{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Settings Card */}
                <div className="card bg-base-100 shadow-xl h-fit">
                    <div className="card-body">
                        <h2 className="card-title flex items-center gap-2 mb-4">
                            <User className="text-primary" />
                            My Profile
                        </h2>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="form-control">
                                <label className="label"><span className="label-text">Name</span></label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3.5 text-base-content/40" size={18} />
                                    <input
                                        type="text"
                                        className="input input-bordered w-full pl-10"
                                        value={profileData.name}
                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Email</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 text-base-content/40" size={18} />
                                    <input
                                        type="email"
                                        className="input input-bordered w-full pl-10"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="divider">Security</div>

                            <div className="form-control">
                                <label className="label"><span className="label-text">New Password (Optional)</span></label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3.5 text-base-content/40" size={18} />
                                    <input
                                        type="password"
                                        className="input input-bordered w-full pl-10"
                                        placeholder="Leave blank to keep current"
                                        value={profileData.password}
                                        onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Confirm New Password</span></label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3.5 text-base-content/40" size={18} />
                                    <input
                                        type="password"
                                        className="input input-bordered w-full pl-10"
                                        placeholder="Confirm new password"
                                        value={profileData.confirmPassword}
                                        onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="card-actions justify-end mt-4">
                                <button type="submit" className="btn btn-primary">
                                    <Save size={18} />
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Admin Management Card */}
                <div className="card bg-base-100 shadow-xl h-fit">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="card-title flex items-center gap-2">
                                <Shield className="text-secondary" />
                                Admin Management
                            </h2>
                            <button className="btn btn-sm btn-secondary" onClick={() => document.getElementById('new_admin_modal').showModal()}>
                                <Plus size={16} /> Add Admin
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name/Email</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="2" className="text-center"><span className="loading loading-spinner"></span></td></tr>
                                    ) : admins.length > 0 ? (
                                        admins.map(admin => (
                                            <tr key={admin._id} className={admin._id === currentUser._id ? "bg-base-200" : ""}>
                                                <td>
                                                    <div className="font-bold flex items-center gap-2">
                                                        {admin.name}
                                                        {admin._id === currentUser._id && <span className="badge badge-xs badge-primary">You</span>}
                                                        {admin.isMainAdmin && <span className="badge badge-xs badge-secondary">Main</span>}
                                                    </div>
                                                    <div className="text-sm opacity-50">{admin.email}</div>
                                                </td>
                                                <td className="text-right flex justify-end gap-2">
                                                    {currentUser.isMainAdmin && !admin.isMainAdmin && (
                                                        <button
                                                            className="btn btn-ghost btn-xs text-warning"
                                                            title="Promote to Main Admin"
                                                            onClick={async () => {
                                                                if (window.confirm(`Are you sure you want to promote ${admin.name} to Main Admin? This grants them full control.`)) {
                                                                    try {
                                                                        await updateUser(admin._id, { isMainAdmin: true });
                                                                        handleSuccess("Promoted to Main Admin successfully");
                                                                        fetchAdmins();
                                                                    } catch (error) {
                                                                        handleError(error, "Failed to promote admin");
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <Shield size={16} />
                                                        </button>
                                                    )}
                                                    {admin._id !== currentUser._id && !admin.isMainAdmin && (
                                                        <button
                                                            className="btn btn-ghost btn-xs text-error"
                                                            onClick={() => handleDeleteAdmin(admin._id)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="2" className="text-center">No other admins found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Admin Modal */}
            <dialog id="new_admin_modal" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">Add New Administrator</h3>
                    <p className="text-sm text-base-content/70 mb-4">This user will have full access to manage students, teachers, and subjects.</p>
                    <form id="new-admin-form" onSubmit={handleCreateAdmin} className="space-y-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text">Name</span></label>
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                value={newAdmin.name}
                                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Email</span></label>
                            <input
                                type="email"
                                className="input input-bordered w-full"
                                value={newAdmin.email}
                                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Password</span></label>
                            <input
                                type="password"
                                className="input input-bordered w-full"
                                value={newAdmin.password}
                                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                required
                            />
                        </div>
                    </form>
                    <div className="modal-action">
                        <form method="dialog"><button className="btn">Cancel</button></form>
                        <button type="submit" form="new-admin-form" className="btn btn-secondary">Create Admin</button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop"><button>close</button></form>
            </dialog>
        </div>
    );
};

export default AdminSettings;
