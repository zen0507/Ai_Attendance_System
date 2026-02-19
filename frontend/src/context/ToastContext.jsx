import React, { createContext, useState, useContext, useCallback } from 'react';
import Toast from '../components/common/Toast.jsx';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = (message) => addToast(message, 'success');
    const error = (message) => addToast(message, 'error');
    const info = (message) => addToast(message, 'info');
    const warning = (message) => addToast(message, 'warning');

    return (
        <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
            {children}
            <div className="toast toast-top toast-end z-50 p-4 space-y-2 pointer-events-none">
                <div className="pointer-events-auto">
                    {toasts.map((toast) => (
                        <Toast key={toast.id} {...toast} onClose={removeToast} />
                    ))}
                </div>
            </div>
        </ToastContext.Provider>
    );
};
