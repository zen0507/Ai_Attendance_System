import { Menu, LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="navbar bg-base-100/80 backdrop-blur-md border-b border-base-200/50 sticky top-0 z-20 px-4 transition-all duration-300">
            <div className="flex-none lg:hidden">
                <label htmlFor="my-drawer-2" className="btn btn-square btn-ghost">
                    <Menu size={24} />
                </label>
            </div>
            <div className="flex-1">
                <span className="text-lg font-semibold ml-2 lg:ml-0">
                    Welcome, {user?.name}
                </span>
            </div>
            <div className="flex-none gap-2">
                <ThemeToggle />
                <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-10">
                            <span className="text-xl">{user?.name?.charAt(0).toUpperCase()}</span>
                        </div>
                    </div>
                    <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                        <li><button onClick={handleLogout} className="text-error"><LogOut size={16} /> Logout</button></li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
