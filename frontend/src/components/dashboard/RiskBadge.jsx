import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, AlertTriangle } from 'lucide-react';

const RISK_CONFIG = {
    Low: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: 'border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-700 dark:text-emerald-300',
        bar: 'bg-emerald-500',
        icon: <ShieldCheck size={28} />,
        label: 'Low Risk',
        message: 'Great job! Your attendance and performance are both in the safe zone. Keep it up!'
    },
    High: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800',
        text: 'text-amber-700 dark:text-amber-300',
        bar: 'bg-amber-500',
        icon: <ShieldAlert size={28} />,
        label: 'High Risk',
        message: 'Warning: One or more risk factors detected. Improve consistency to reduce your academic risk.'
    },
    Critical: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-700 dark:text-red-300',
        bar: 'bg-red-500',
        icon: <ShieldX size={28} />,
        label: 'Critical Risk',
        message: 'Critical: Both attendance and marks are below threshold. Immediate action required to avoid academic consequences.'
    },
    Moderate: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800',
        text: 'text-orange-700 dark:text-orange-300',
        bar: 'bg-orange-400',
        icon: <AlertTriangle size={28} />,
        label: 'Moderate Risk',
        message: 'You are slightly below the safe zone. Improve attendance and study habits to stay on track.'
    }
};

const RiskBadge = ({ riskLevel, probability, attendancePercentage, showMessage = true }) => {
    // Normalise incoming level — backend returns 'Low', 'High', 'Critical'
    const level = riskLevel || 'Low';
    const cfg = RISK_CONFIG[level] || RISK_CONFIG['Low'];

    // Risk % to display: use probability from backend (0–100)
    const riskPct = probability != null ? Math.round(probability) : null;

    return (
        <div className={`p-5 rounded-2xl border ${cfg.bg} ${cfg.border} transition-all duration-300`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">AI Risk Analysis</span>
                <span className={`${cfg.text} font-black text-2xl`}>
                    {riskPct != null ? `${riskPct}%` : '—'}
                </span>
            </div>

            {/* Level + Icon */}
            <div className={`flex items-center gap-3 mb-3 ${cfg.text}`}>
                {cfg.icon}
                <span className="text-xl font-black">{cfg.label}</span>
            </div>

            {/* Risk bar */}
            {riskPct != null && (
                <div className="mb-3">
                    <div className="w-full bg-base-200/60 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-700 ${cfg.bar}`}
                            style={{ width: `${Math.min(riskPct, 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Attendance indicator */}
            {attendancePercentage != null && (
                <div className="flex items-center gap-2 text-xs opacity-70 mb-3">
                    <span>Attendance:</span>
                    <span className={`font-bold ${attendancePercentage >= 75 ? 'text-success' : 'text-error'}`}>
                        {attendancePercentage.toFixed(1)}%
                    </span>
                    {attendancePercentage < 75 && (
                        <span className="badge badge-error badge-xs">Below 75%</span>
                    )}
                </div>
            )}

            {/* Message */}
            {showMessage && (
                <p className={`text-sm opacity-80 ${cfg.text}`}>{cfg.message}</p>
            )}
        </div>
    );
};

export default RiskBadge;
