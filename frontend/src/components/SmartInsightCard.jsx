import React from 'react';
import { AlertCircle, CheckCircle, Info, TrendingUp, TrendingDown } from 'lucide-react';

const SmartInsightCard = ({ insight, title, description, type = 'info' }) => {
    // Determine props
    const content = description || insight || "No details available.";
    const header = title || "Insight";

    let icon = <Info size={20} />;
    let colorClass = 'border-info/20 bg-info/5 text-info';
    let iconClass = 'text-info';

    // Logic: explicit type OR regex detection in insight string
    const isCritical = type === 'critical' || type === 'error' || (insight && insight.includes('⚠️'));
    const isSuccess = type === 'success' || (insight && (insight.includes('✅') || insight.includes('🏆')));
    const isWarning = type === 'warning' || (insight && insight.includes('📉'));
    const isTrending = type === 'trending' || (insight && (insight.includes('📈') || insight.includes('🚀')));

    if (isCritical) {
        icon = <AlertCircle size={20} />;
        colorClass = 'border-error/20 bg-error/5 text-error';
        iconClass = 'text-error';
    } else if (isSuccess) {
        icon = <CheckCircle size={20} />;
        colorClass = 'border-success/20 bg-success/5 text-success';
        iconClass = 'text-success';
    } else if (isWarning) {
        icon = <TrendingDown size={20} />;
        colorClass = 'border-warning/20 bg-warning/5 text-warning';
        iconClass = 'text-warning';
    } else if (isTrending) {
        icon = <TrendingUp size={20} />;
        colorClass = 'border-success/20 bg-success/5 text-success';
        iconClass = 'text-success';
    }

    return (
        <div className={`flex gap-4 p-4 rounded-xl border ${colorClass} items-start animate-in slide-in-from-bottom-2 duration-500 shadow-sm`}>
            <div className={`mt-1 ${iconClass} flex-shrink-0`}>
                {icon}
            </div>
            <div>
                {title && <h4 className={`font-bold text-sm mb-1 ${iconClass} opacity-90`}>{header}</h4>}
                <div className="text-sm font-medium opacity-80 leading-relaxed text-base-content">
                    {content}
                </div>
            </div>
        </div>
    );
};

export default SmartInsightCard;
