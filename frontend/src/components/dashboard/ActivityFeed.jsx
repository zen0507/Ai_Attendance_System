import React, { useEffect, useState } from 'react';
import { getActivityLogs } from '../../api/adminApi';
import { User, FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const ActivityFeed = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
        // Optional: Poll every 60 seconds
        const interval = setInterval(fetchLogs, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchLogs = async () => {
        try {
            const data = await getActivityLogs();
            setLogs(data);
        } catch (error) {
            // Check for rate limiting (429)
            if (error.response?.status === 429 || error.status === 429) {
                console.warn("Activity Feed: Rate limit exceeded. Skipping update.");
            } else {
                console.error("Failed to fetch activity logs", error);
            }
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (action) => {
        if (action.includes('LOGIN')) return <User size={16} className="text-blue-500" />;
        if (action.includes('CREATE')) return <CheckCircle size={16} className="text-green-500" />;
        if (action.includes('FAIL')) return <AlertTriangle size={16} className="text-red-500" />;
        return <FileText size={16} className="text-gray-500" />;
    };

    if (loading) return <div className="skeleton h-64 w-full"></div>;

    return (
        <div className="card bg-base-100 shadow-xl h-full">
            <div className="card-body">
                <h2 className="card-title text-sm uppercase text-base-content/50 mb-4 flex justify-between items-center">
                    <span>Recent System Activity</span>
                    <Clock size={16} />
                </h2>
                <div className="overflow-y-auto max-h-[400px] space-y-4 pr-2 custom-scrollbar">
                    {logs.length === 0 ? (
                        <div className="text-center text-base-content/40 py-8">No activity recorded yet.</div>
                    ) : (
                        logs.map((log) => (
                            <div key={log._id} className="flex gap-3 items-start text-sm border-b border-base-200/50 pb-3 last:border-0 hover:bg-base-200/30 p-2 rounded transition-colors">
                                <div className="mt-1 bg-base-200 p-1.5 rounded-full">
                                    {getIcon(log.action)}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium flex justify-between">
                                        <span>{log.action.replace(/_/g, ' ')}</span>
                                        <span className="text-xs text-base-content/40">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-base-content/70 text-xs mt-0.5">{log.details}</p>
                                    <div className="text-xs text-base-content/40 mt-1 flex gap-2">
                                        <span>User: {log.user?.name || 'Unknown'}</span>
                                        <span>•</span>
                                        <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityFeed;
