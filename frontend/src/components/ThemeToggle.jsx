import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <label className="swap swap-rotate btn btn-ghost btn-circle">
            <input type="checkbox" onChange={toggleTheme} checked={theme === 'dark'} />

            {/* sun icon */}
            <Sun className="swap-on fill-current w-6 h-6 text-yellow-500" />

            {/* moon icon */}
            <Moon className="swap-off fill-current w-6 h-6 text-blue-500" />
        </label>
    );
};

export default ThemeToggle;
