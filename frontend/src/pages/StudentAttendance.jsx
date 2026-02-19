import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getStudentAttendance, getRiskAnalysis } from '../api/studentApi';
import { CheckSquare, AlertTriangle, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// Compute attendance trend from session dates
const computeTrend = (records) => {
    if (!records || records.length < 4) return { trend: 'Stable', stability: 50 };

    // Sort by date
    const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
    const n = sorted.length;
    const half = Math.floor(n / 2);

    const firstHalf = sorted.slice(0, half);
    const secondHalf = sorted.slice(half);

    const pct = (arr) => {
        const present = arr.filter(r => r.status === 'Present').length;
        return arr.length > 0 ? (present / arr.length) * 100 : 0;
    };

    const p1 = pct(firstHalf);
    const p2 = pct(secondHalf);
    const diff = p2 - p1;

    // Stability: how consistent attendance is (low variance = high stability)
    const allPcts = sorted.map(r => r.status === 'Present' ? 100 : 0);
    const mean = allPcts.reduce((a, b) => a + b, 0) / allPcts.length;
    const variance = allPcts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / allPcts.length;
    const stability = Math.max(0, Math.min(100, Math.round(100 - Math.sqrt(variance))));

    let trend = 'Stable';
    if (diff > 8) trend = 'Improving';
    else if (diff < -8) trend = 'Declining';

    return { trend, stability, firstHalfPct: p1.toFixed(1), secondHalfPct: p2.toFixed(1) };
};

const StudentAttendance = () => {
    const { user } = useContext(AuthContext);
    const [attendance, setAttendance] = useState([]);
    const [riskAnalysis, setRiskAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.profileId) return;
            try {
                const [att, risk] = await Promise.all([
                    getStudentAttendance(user.profileId),
                    getRiskAnalysis(user.profileId)
                ]);
                setAttendance(att || []);
                setRiskAnalysis(risk);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // Group by subject
    const subjectMap = {};
    attendance.forEach(r => {
        const key = r.subjectName || r.subject || 'Unknown';
        if (!subjectMap[key]) subjectMap[key] = { total: 0, present: 0, records: [] };
        subjectMap[key].total++;
        if (r.status === 'Present') subjectMap[key].present++;
        subjectMap[key].records.push(r);
    });

    const overallPct = riskAnalysis?.attendancePercentage ?? 0;
    const totalHours = attendance.length;
    const presentHours = attendance.filter(r => r.status === 'Present').length;
    const { trend, stability } = computeTrend(attendance);

    // Classes needed to reach 75%
    const classesNeeded = overallPct < 75
        ? Math.max(0, Math.ceil((0.75 * totalHours - presentHours) / 0.25))
        : 0;

    const trendIcon = trend === 'Improving'
        ? <TrendingUp size={18} className="text-success" />
        : trend === 'Declining'
            ? <TrendingDown size={18} className="text-error" />
            : <Minus size={18} className="text-warning" />;

    const trendColor = trend === 'Improving' ? 'text-success' : trend === 'Declining' ? 'text-error' : 'text-warning';

    const doughnutData = {
        labels: ['Present', 'Absent'],
        datasets: [{
            data: [presentHours, totalHours - presentHours],
            backgroundColor: [
                overallPct >= 75 ? '#22c55e' : '#f97316',
                'rgba(156,163,175,0.2)'
            ],
            borderWidth: 0,
        }]
    };

    const doughnutOptions = {
        cutout: '75%',
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        maintainAspectRatio: false
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg text-primary" />
        </div>
    );

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold flex items-center gap-3">
                <CheckSquare className="text-primary" size={32} />
                My Attendance
            </h1>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Overall Doughnut */}
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body items-center text-center py-6">
                        <p className="text-xs font-bold uppercase opacity-50 mb-2">Overall Attendance</p>
                        <div className="relative w-36 h-36">
                            <Doughnut data={doughnutData} options={doughnutOptions} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-3xl font-black ${overallPct >= 75 ? 'text-success' : 'text-error'}`}>
                                    {overallPct.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        {overallPct < 75 && (
                            <div className="flex items-center gap-2 mt-2 text-error text-sm font-medium">
                                <AlertTriangle size={16} />
                                Below 75% threshold
                            </div>
                        )}
                        <p className="text-xs opacity-50 mt-1">{presentHours} / {totalHours} sessions</p>
                    </div>
                </div>

                {/* Trend Card */}
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body py-6">
                        <p className="text-xs font-bold uppercase opacity-50 mb-4">Attendance Trend</p>
                        <div className="flex items-center gap-3 mb-4">
                            {trendIcon}
                            <span className={`text-2xl font-black ${trendColor}`}>{trend}</span>
                        </div>
                        <p className="text-xs opacity-60 mb-4">
                            {trend === 'Improving' && 'Your attendance has improved recently. Keep it up!'}
                            {trend === 'Declining' && 'Your attendance has dropped recently. Take action now.'}
                            {trend === 'Stable' && 'Your attendance has been consistent.'}
                        </p>
                        {/* Stability Meter */}
                        <div>
                            <div className="flex justify-between text-xs opacity-60 mb-1">
                                <span className="flex items-center gap-1"><Activity size={12} /> Stability Score</span>
                                <span className="font-bold">{stability}/100</span>
                            </div>
                            <div className="w-full bg-base-200 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full transition-all duration-700 ${stability >= 70 ? 'bg-success' : stability >= 40 ? 'bg-warning' : 'bg-error'}`}
                                    style={{ width: `${stability}%` }}
                                />
                            </div>
                            <p className="text-xs opacity-40 mt-1">
                                {stability >= 70 ? 'Highly consistent' : stability >= 40 ? 'Moderately consistent' : 'Irregular attendance'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Card */}
                <div className={`card shadow-xl border ${overallPct >= 75 ? 'bg-success/10 border-success/30' : 'bg-error/10 border-error/30'}`}>
                    <div className="card-body py-6">
                        <p className="text-xs font-bold uppercase opacity-50 mb-3">
                            {overallPct >= 75 ? '✅ Status: Safe' : '⚠️ Action Required'}
                        </p>
                        {overallPct >= 75 ? (
                            <>
                                <p className="text-success font-bold text-lg">You're on track!</p>
                                <p className="text-sm opacity-70 mt-2">
                                    Your attendance is above the 75% minimum. Maintain this to stay eligible for exams.
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-error font-bold text-lg">
                                    Attend {classesNeeded} more class{classesNeeded !== 1 ? 'es' : ''}
                                </p>
                                <p className="text-sm opacity-70 mt-2">
                                    You need to attend the next <strong>{classesNeeded}</strong> consecutive classes without any absence to reach the 75% minimum attendance requirement.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Subject-wise Breakdown */}
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body p-0">
                    <div className="p-5 border-b border-base-200">
                        <h2 className="font-bold text-base uppercase opacity-60 tracking-wide">Subject-wise Breakdown</h2>
                    </div>
                    {Object.keys(subjectMap).length === 0 ? (
                        <div className="text-center py-16 opacity-40">
                            <CheckSquare size={40} className="mx-auto mb-3" />
                            <p>No attendance records found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead className="bg-base-200">
                                    <tr>
                                        <th>Subject</th>
                                        <th className="text-center">Attended</th>
                                        <th className="text-center">Total</th>
                                        <th className="text-center">Percentage</th>
                                        <th className="text-center">Status</th>
                                        <th>Progress</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(subjectMap).map(([subject, data]) => {
                                        const pct = data.total > 0 ? (data.present / data.total) * 100 : 0;
                                        const safe = pct >= 75;
                                        return (
                                            <tr key={subject}>
                                                <td className="font-medium">{subject}</td>
                                                <td className="text-center">{data.present}</td>
                                                <td className="text-center">{data.total}</td>
                                                <td className={`text-center font-bold ${safe ? 'text-success' : 'text-error'}`}>
                                                    {pct.toFixed(1)}%
                                                </td>
                                                <td className="text-center">
                                                    <span className={`badge ${safe ? 'badge-success' : 'badge-error'} badge-sm`}>
                                                        {safe ? 'Safe' : 'Low'}
                                                    </span>
                                                </td>
                                                <td className="w-32">
                                                    <div className="w-full bg-base-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${safe ? 'bg-success' : 'bg-error'}`}
                                                            style={{ width: `${Math.min(pct, 100)}%` }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentAttendance;
