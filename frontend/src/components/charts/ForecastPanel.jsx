import React from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart2 } from 'lucide-react';

const ForecastPanel = ({ data }) => {
    if (!data || !data.currentPassRate) {
        return (
            <div className="flex flex-col items-center justify-center py-12 opacity-40">
                <BarChart2 size={40} className="mb-3" />
                <p className="text-sm">Insufficient data to generate forecast.</p>
                <p className="text-xs mt-1">Marks must be entered for at least one subject.</p>
            </div>
        );
    }

    const currentPassRate = parseFloat(data.currentPassRate) || 0;
    const predictedPassRate = parseFloat(data.predictedPassRate) || 0;
    const atRiskCount = parseInt(data.atRiskCount) || 0;
    const consistencyScore = parseInt(data.consistencyScore) || 0;
    const totalStudents = parseInt(data.totalStudents) || 0;

    // Growth = predicted - current (can be negative)
    const growth = parseFloat((predictedPassRate - currentPassRate).toFixed(1));
    const growthIsPositive = growth > 0;
    const growthIsNegative = growth < 0;

    // Stability level from consistency score
    const stabilityLevel = consistencyScore >= 70 ? 'High' : consistencyScore >= 40 ? 'Moderate' : 'Low';
    const stabilityColor = stabilityLevel === 'High' ? 'text-success' : stabilityLevel === 'Moderate' ? 'text-warning' : 'text-error';
    const stabilityBg = stabilityLevel === 'High' ? 'bg-success/10' : stabilityLevel === 'Moderate' ? 'bg-warning/10' : 'bg-error/10';

    return (
        <div className="space-y-6">
            {/* Pass Rate Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-base-200/50 p-4 rounded-xl">
                    <div className="text-xs uppercase opacity-50 mb-1">Current Pass Rate</div>
                    <div className="text-3xl font-bold">{currentPassRate.toFixed(1)}%</div>
                    <div className="text-xs opacity-50 mt-1">Based on current marks</div>
                </div>
                <div className="bg-base-200/50 p-4 rounded-xl">
                    <div className="text-xs uppercase opacity-50 mb-1">Predicted Pass Rate</div>
                    <div className="text-3xl font-bold text-primary">{predictedPassRate.toFixed(1)}%</div>
                    <div className="text-xs opacity-50 mt-1">With attendance factor</div>
                </div>
            </div>

            {/* Growth & At-Risk Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-base-200/50 p-3 rounded-xl text-center">
                    <div className="text-xs uppercase opacity-50 mb-1">Growth</div>
                    <div className={`text-xl font-bold flex items-center justify-center gap-1 ${growthIsPositive ? 'text-success' : growthIsNegative ? 'text-error' : 'text-warning'}`}>
                        {growthIsPositive ? <TrendingUp size={18} /> : growthIsNegative ? <TrendingDown size={18} /> : <Minus size={18} />}
                        {growth > 0 ? '+' : ''}{growth}%
                    </div>
                </div>
                <div className="bg-base-200/50 p-3 rounded-xl text-center">
                    <div className="text-xs uppercase opacity-50 mb-1">At Risk</div>
                    <div className="text-xl font-bold text-error">{atRiskCount}</div>
                    <div className="text-xs opacity-50">of {totalStudents}</div>
                </div>
                <div className={`p-3 rounded-xl text-center ${stabilityBg}`}>
                    <div className="text-xs uppercase opacity-50 mb-1">Stability</div>
                    <div className={`text-xl font-bold ${stabilityColor}`}>{consistencyScore}%</div>
                    <div className={`text-xs font-medium ${stabilityColor}`}>{stabilityLevel}</div>
                </div>
            </div>
        </div>
    );
};

export default ForecastPanel;
