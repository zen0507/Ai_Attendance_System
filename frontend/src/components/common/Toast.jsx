import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ id, message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, 5000);

        return () => clearTimeout(timer);
    }, [id, onClose]);

    const icons = {
        success: <CheckCircle className="w-6 h-6 text-success" />,
        error: <AlertCircle className="w-6 h-6 text-error" />,
        info: <Info className="w-6 h-6 text-info" />,
        warning: <AlertTriangle className="w-6 h-6 text-warning" />,
    };

    const styles = {
        success: 'alert-success',
        error: 'alert-error',
        info: 'alert-info',
        warning: 'alert-warning',
    };

    return (
        <div className={`alert ${styles[type]} shadow-lg mb-2 flex items-start w-full max-w-sm fade-in`}>
            <div>{icons[type]}</div>
            <div className="flex-1">
                <span>{message}</span>
            </div>
            <button onClick={() => onClose(id)} className="btn btn-ghost btn-xs btn-square">
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
