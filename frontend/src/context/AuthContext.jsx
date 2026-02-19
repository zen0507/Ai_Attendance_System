import React, { createContext, useState, useEffect } from 'react';
import { loginUser } from '../api/authApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const data = await loginUser(email, password);
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            return data;
        } catch (error) {
            throw error.response?.data?.message || error.message || 'Login failed';
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('userInfo');
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => React.useContext(AuthContext);

