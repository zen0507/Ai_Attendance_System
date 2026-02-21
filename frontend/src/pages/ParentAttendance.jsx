import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axiosInstance';
import { CheckSquare, AlertTriangle, TrendingUp, TrendingDown, Minus, Activity, ArrowLeft, Calendar } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const computeTrend = (records) => {
    if (!records || records.length < 4) return { trend: 'Stable', stability: 50 };
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
    const allPcts = sorted.map(r => r.status === 'Present' ? 100 : 0);
    const mean = allPcts.reduce((a, b) => a + b, 0) / allPcts.length;
    const variance = allPcts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / allPcts.length;
    const stability = Math.max(0, Math.min(100, Math.round(100 - Math.sqrt(variance))));
    let trend = 'Stable';
    if (diff > 8) trend = 'Improving';
    else if (diff < -8) trend = 'Declining';
    return { trend, stability };
};

const ParentAttendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const { data } = await API.get('/parent/child-attendance');
                setAttendance(data.data || []);
            } catch (error) {
                console.error("Error fetching child attendance:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, []);

    const subjectMap = {};
    attendance.forEach(r => {
        const key = r.subjectId?.name || 'Unknown';
        if (!subjectMap[key]) subjectMap[key] = { total: 0, present: 0 };
        subjectMap[key].total++;
        if (r.status === 'Present') subjectMap[key].present++;
    });

    const totalHours = attendance.length;
    const presentHours = attendance.filter(r => r.status === 'Present').length;
    const overallPct = totalHours > 0 ? (presentHours / totalHours) * 100 : null;
    const { trend, stability } = computeTrend(attendance);

    const classesNeeded = overallPct < 75
        ? Math.max(0, Math.ceil((0.75 * totalHours - presentHours) / 0.25))
        : 0;

    const doughnutData = {
        labels: ['Present', 'Absent'],
        datasets: [{
            data: [presentHours, totalHours - presentHours],
            backgroundColor: [overallPct >= 75 ? '#22c55e' : '#f43f5e', 'rgba(156,163,175,0.1)'],
            borderWidth: 0,
        }]
    };

    const doughnutOptions = {
        cutout: '80%',
        plugins: { legend: { display: false } },
        maintainAspectRatio: false
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col justify-center items-center space-y-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-sm font-medium animate-pulse">Analyzing attendance records...</p>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/parent/dashboard" className="btn btn-ghost btn-circle">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Attendance Report</h1>
                        <p className="text-sm opacity-60">Complete session-wise breakdown for your child</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-base-200 px-4 py-2 rounded-2xl border border-base-300 shadow-sm">
                    <Calendar size={18} className="text-primary" />
                    <span className="text-sm font-bold opacity-70">Current Session: {new Date().getFullYear()}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Visual Analytics */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
                        <div className="card-body items-center text-center p-8 bg-gradient-to-b from-base-100 to-base-200/50">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6">Aggregate Presence</p>
                            <div className="relative w-48 h-48 mb-6">
                                <Doughnut data={doughnutData} options={doughnutOptions} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-4xl font-black ${overallPct === null ? 'text-base-content/20' : overallPct >= 75 ? 'text-success' : 'text-error'}`}>
                                        {overallPct !== null ? `${overallPct.toFixed(1)}%` : 'N/A'}
                                    </span>
                                    <span className="text-[10px] font-bold opacity-40 uppercase">{overallPct !== null ? 'Total Score' : 'No Data'}</span>
                                </div>
                            </div>
                            <div className={`badge ${overallPct === null ? 'badge-ghost opacity-40' : overallPct >= 75 ? 'badge-success' : 'badge-error'} badge-lg font-bold py-4 px-6`}>
                                {overallPct === null ? 'PENDING' : overallPct >= 75 ? 'ELIGIBLE' : 'ACTION REQUIRED'}
                            </div>
                        </div>
                    </div>

                    {overallPct !== null && (
                        <div className="card bg-base-100 shadow-xl border border-base-200 p-6 space-y-4">
                            <div className="flex justify-between items-center text-xs opacity-40 font-black uppercase tracking-widest">
                                <span>Engagement Trend</span>
                                {trend === 'Improving' ? <TrendingUp size={14} className="text-success" /> : <TrendingDown size={14} className="text-error" />}
                            </div>
                            <div className="flex items-end gap-2">
                                <span className={`text-3xl font-black ${trend === 'Improving' ? 'text-success' : trend === 'Declining' ? 'text-error' : 'text-warning'}`}>
                                    {trend}
                                </span>
                                <span className="text-xs opacity-40 mb-1 font-bold">Recently</span>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1 opacity-60">
                                    <span>Stability Score</span>
                                    <span>{stability}/100</span>
                                </div>
                                <div className="w-full bg-base-200 rounded-full h-3 border border-base-300">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${stability >= 70 ? 'bg-success' : stability >= 40 ? 'bg-warning' : 'bg-error'}`}
                                        style={{ width: `${stability}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Detailed Breakdown */}
                <div className="lg:col-span-8 space-y-8">
                    {overallPct === null ? (
                        <div className="card bg-base-100 shadow-xl border border-base-200 border-dashed">
                            <div className="card-body items-center text-center py-20 space-y-4">
                                <div className="p-4 rounded-full bg-base-200">
                                    <Activity size={48} className="opacity-20" />
                                </div>
                                <h2 className="text-xl font-bold">No attendance records available.</h2>
                                <p className="opacity-60 max-w-xs mx-auto">Attendance data for this semester hasn't been synchronized yet. Check back once sessions begin.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="card bg-base-100 shadow-xl border border-base-200">
                                <div className="card-body p-0">
                                    <div className="p-6 border-b border-base-200 flex justify-between items-center">
                                        <h2 className="card-title text-sm font-bold uppercase tracking-widest opacity-60 flex gap-2">
                                            <Activity size={18} /> Subject-wise Stats
                                        </h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="table">
                                            <thead>
                                                <tr className="bg-base-200/50">
                                                    <th>Subject Name</th>
                                                    <th className="text-center">Present</th>
                                                    <th className="text-center">Total</th>
                                                    <th className="text-center">Percentage</th>
                                                    <th className="text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(subjectMap).map(([subject, data]) => {
                                                    const pct = (data.present / data.total) * 100;
                                                    return (
                                                        <tr key={subject} className="hover">
                                                            <td className="font-bold text-sm">{subject}</td>
                                                            <td className="text-center font-medium opacity-60">{data.present}</td>
                                                            <td className="text-center font-medium opacity-60">{data.total}</td>
                                                            <td className="text-center">
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className={`text-xs font-black ${pct >= 75 ? 'text-success' : 'text-error'}`}>{pct.toFixed(0)}%</span>
                                                                    <div className="w-16 bg-base-200 h-1.5 rounded-full overflow-hidden">
                                                                        <div className={`h-full ${pct >= 75 ? 'bg-success' : 'bg-error'}`} style={{ width: `${pct}%` }} />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="text-center">
                                                                <div className={`badge badge-sm font-bold ${pct >= 75 ? 'badge-success' : 'badge-error opacity-70'}`}>
                                                                    {pct >= 75 ? 'SAFE' : 'RISK'}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="card bg-base-100 shadow-xl border border-base-200">
                                <div className="card-body p-0">
                                    <div className="p-6 border-b border-base-200">
                                        <h2 className="card-title text-sm font-bold uppercase tracking-widest opacity-60">Session History</h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                            {attendance.slice(0, 40).map((record, i) => (
                                                <div key={i} className={`p-3 rounded-xl text-center border transition-all hover:scale-110 cursor-help flex flex-col justify-center items-center h-16 ${record.status === 'Present' ? 'bg-success/5 border-success/20 text-success' : 'bg-error/5 border-error/20 text-error'}`} title={`${record.subjectId?.name || 'Unknown'} - ${new Date(record.date).toLocaleDateString()}`}>
                                                    <div className="text-[10px] font-bold uppercase opacity-70 truncate w-full px-1 mb-1">{record.subjectId?.name || 'Class'}</div>
                                                    <div className="text-sm font-black">{record.status === 'Present' ? 'P' : 'A'}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-center opacity-40 mt-6 uppercase tracking-widest font-bold">Showing last 40 sessions</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParentAttendance;
