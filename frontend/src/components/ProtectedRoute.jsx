import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-base-200">
            <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
    );

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <div className="flex justify-center items-center h-screen bg-base-200">
                <div role="alert" className="alert alert-error max-w-md shadow-lg glass-panel">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Access Denied: You do not have permission to view this page.</span>
                </div>
            </div>
        );
    }

    if (user.status && user.status !== 'active') {
        return (
            <div className="flex justify-center items-center h-screen bg-base-200">
                <div role="alert" className="alert alert-warning max-w-md shadow-lg glass-panel">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <div>
                        <h3 className="font-bold">Account Verification Pending</h3>
                        <div className="text-xs">Your account status is currently <strong>{user.status}</strong>. Please contact the administrator.</div>
                    </div>
                </div>
            </div>
        );
    }

    return <Outlet />;
};

export default ProtectedRoute;

