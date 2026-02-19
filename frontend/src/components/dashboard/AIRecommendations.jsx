import React from 'react';
import { Lightbulb, Target, TrendingUp, BookOpen, CheckCircle } from 'lucide-react';

/**
 * Calculate exact classes needed to reach 75% attendance.
 * Formula: need (0.75 * (total + x) - attended) classes out of x future classes
 * Solving: 0.75*(total+x) <= attended+x → x >= (0.75*total - attended)/0.25
 */
const calcClassesNeeded = (attended, total) => {
    if (total === 0) return 0;
    const needed = Math.ceil((0.75 * total - attended) / 0.25);
    return Math.max(0, needed);
};

const AIRecommendations = ({ attendance, marks, riskAnalysis }) => {
    const recommendations = [];

    // --- Attendance Recommendation ---
    const attPct = riskAnalysis?.attendancePercentage ?? (attendance?.percentage ?? null);
    const totalSessions = attendance?.total ?? 0;
    const attendedSessions = attendance?.attended ?? 0;

    if (attPct !== null) {
        if (attPct < 75) {
            const needed = calcClassesNeeded(attendedSessions, totalSessions);
            recommendations.push({
                icon: <Target size={20} className="text-error mt-0.5 shrink-0" />,
                title: 'Improve Attendance',
                desc: `Your attendance is ${attPct.toFixed(1)}%, which is below the 75% minimum.`,
                detail: needed > 0
                    ? `You need to attend the next ${needed} consecutive class${needed !== 1 ? 'es' : ''} without any absence to reach the 75% threshold.`
                    : 'You are very close — attend all upcoming classes to stay safe.',
                color: 'border-error/20 bg-error/5'
            });
        } else {
            recommendations.push({
                icon: <CheckCircle size={20} className="text-success mt-0.5 shrink-0" />,
                title: 'Good Attendance',
                desc: `Your attendance is ${attPct.toFixed(1)}% — safely above the 75% minimum.`,
                detail: 'Keep attending regularly to maintain your eligibility for exams and avoid last-minute stress.',
                color: 'border-success/20 bg-success/5'
            });
        }
    }

    // --- Marks Recommendation ---
    const marksArr = Array.isArray(marks) ? marks : [];
    const lowSubjects = marksArr.filter(m => {
        // rawPct from new endpoint, or fall back to total
        const pct = m.rawPct ?? m.total ?? 0;
        return pct < 50;
    });

    if (lowSubjects.length > 0) {
        const names = lowSubjects.map(s => s.subject || s.subjectId?.name || 'Unknown').join(', ');
        recommendations.push({
            icon: <TrendingUp size={20} className="text-warning mt-0.5 shrink-0" />,
            title: 'Focus Areas',
            desc: `You are scoring below 50% in: ${names}.`,
            detail: 'Prioritise these subjects for revision. Consider forming study groups, reviewing past papers, or seeking help from your teacher.',
            color: 'border-warning/20 bg-warning/5'
        });
    } else if (marksArr.length > 0) {
        recommendations.push({
            icon: <BookOpen size={20} className="text-primary mt-0.5 shrink-0" />,
            title: 'Strong Performance',
            desc: 'You are performing well across all subjects.',
            detail: 'Challenge yourself further by attempting advanced problems and helping peers — teaching others is one of the best ways to solidify your own understanding.',
            color: 'border-primary/20 bg-primary/5'
        });
    }

    // --- Risk Reasons from backend ---
    if (riskAnalysis?.riskReasons?.length > 0) {
        riskAnalysis.riskReasons.forEach(reason => {
            if (!recommendations.some(r => r.title === 'Risk Factor')) {
                recommendations.push({
                    icon: <Lightbulb size={20} className="text-orange-500 mt-0.5 shrink-0" />,
                    title: 'Risk Factor Detected',
                    desc: reason,
                    detail: 'Address this issue promptly to avoid academic consequences at the end of semester.',
                    color: 'border-orange-200/30 bg-orange-50/10'
                });
            }
        });
    }

    return (
        <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body">
                <h2 className="card-title text-sm uppercase text-base-content/50 mb-4 flex items-center gap-2">
                    <Lightbulb size={18} /> AI Recommendations
                </h2>
                {recommendations.length === 0 ? (
                    <div className="text-center py-8 opacity-40">
                        <Lightbulb size={32} className="mx-auto mb-2" />
                        <p className="text-sm">No data available yet for recommendations.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recommendations.map((rec, i) => (
                            <div key={i} className={`flex gap-3 p-4 rounded-xl border ${rec.color}`}>
                                {rec.icon}
                                <div>
                                    <h3 className="font-bold text-sm mb-0.5">{rec.title}</h3>
                                    <p className="text-sm text-base-content/80">{rec.desc}</p>
                                    <p className="text-xs text-base-content/55 mt-1">{rec.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIRecommendations;
