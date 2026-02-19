import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ title, message, icon: Icon = Inbox }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-base-100 rounded-lg border-2 border-dashed border-base-300 h-64 w-full fade-in">
            <div className="bg-base-200 p-4 rounded-full mb-4">
                <Icon className="w-8 h-8 text-base-content/50" />
            </div>
            <h3 className="text-lg font-semibold text-base-content">{title}</h3>
            <p className="text-base-content/60 max-w-xs mt-1">{message}</p>
        </div>
    );
};

export default EmptyState;
