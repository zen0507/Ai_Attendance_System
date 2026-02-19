import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { Menu, LogOut, User, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-100 dark:border-gray-700 z-30 h-16 flex items-center justify-between px-6 transition-all duration-300">
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-600 dark:text-gray-300 md:hidden transition-colors">
                    <Menu size={24} />
                </button>
                <div className="hidden md:flex flex-col">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
                        AI Attendance
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={() => {
                        document.documentElement.classList.toggle('dark');
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 transition-colors"
                    title="Toggle Theme"
                >
                    {/* Simple toggle logic, ideally use state but this works for direct manipulation */}
                    <span className="dark:hidden">🌙</span>
                    <span className="hidden dark:inline">☀️</span>
                </button>

                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-gray-100 dark:border-gray-700">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'Guest'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white shadow-md">
                        <User size={20} />
                    </div>
                    <button onClick={handleLogout} className="ml-2 p-2 text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
