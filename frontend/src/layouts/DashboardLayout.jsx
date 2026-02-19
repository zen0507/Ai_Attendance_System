import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/Navbar';

const DashboardLayout = () => {
    return (
        <div className="drawer lg:drawer-open h-screen overflow-hidden">
            <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content flex flex-col bg-base-200 text-base-content h-full overflow-hidden">
                <Navbar />
                <main className="flex-1 p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
            <div className="drawer-side z-20 h-full">
                <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label>
                <Sidebar />
            </div>
        </div>
    );
};

export default DashboardLayout;
