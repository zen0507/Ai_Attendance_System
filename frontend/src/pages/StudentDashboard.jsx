import React, { useState, useEffect, useContext } from 'react';
import { getStudentAttendance, getStudentMarks, getRiskAnalysis, getClassAverage } from '../api/studentApi';
import { AuthContext } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

import RiskBadge from '../components/dashboard/RiskBadge.jsx';
import ComparativeChart from '../components/dashboard/ComparativeChart.jsx';
import AIRecommendations from '../components/dashboard/AIRecommendations.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import {
    ClipboardList, GraduationCap, FileText,
    AlertTriangle, CheckCircle, ArrowRight
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const MAX_RAW = 100; // 30 + 30 + 40

const StudentDashboard = () => {
    const { user } = useContext(AuthContext);
    const [attRecords, setAttRecords] = useState([]);
    const [marks, setMarks] = useState([]);
    const [classAvgData, setClassAvgData] = useState([]);
    const [riskAnalysis, setRiskAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.profileId) { setLoading(false); return; }
            try {
                const [attRes, marksRes, riskRes, classAvgRes] = await Promise.allSettled([
                    getStudentAttendance(user.profileId),
                    getStudentMarks(user.profileId),
                    getRiskAnalysis(user.profileId),
                    getClassAverage(user.profileId)
                ]);

                if (attRes.status === 'fulfilled' && Array.isArray(attRes.value))
                    setAttRecords(attRes.value);

                if (marksRes.status === 'fulfilled' && Array.isArray(marksRes.value))
                    setMarks(marksRes.value);

                if (riskRes.status === 'fulfilled')
                    setRiskAnalysis(riskRes.value);

                if (classAvgRes.status === 'fulfilled' && Array.isArray(classAvgRes.value))
                    setClassAvgData(classAvgRes.value);

            } catch (error) {
                console.error('Dashboard Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user]);

    // --- Attendance stats ---
    // Prefer backend-calculated percentage (session-hour weighted) from riskAnalysis
    const attPct = riskAnalysis?.attendancePercentage ?? 0;
    const totalSessions = attRecords.length;
    const presentSessions = attRecords.filter(r => r.status === 'Present').length;
    const attSafe = attPct >= 75;

    const doughnutData = {
        labels: ['Present', 'Absent'],
        datasets: [{
            data: [presentSessions, totalSessions - presentSessions],
            backgroundColor: [
                attSafe ? '#22c55e' : '#f97316',
                'rgba(156,163,175,0.2)'
            ],
            borderWidth: 0,
        }]
    };

    // --- Marks: Use backend-calculated total (100% scale) ---
    const enrichedMarks = marks.map(m => {
        const total = m.total || ((Number(m.test1) || 0) + (Number(m.test2) || 0) + (Number(m.assignment) || 0));
        const rawPct = parseFloat(total.toFixed(1));
        return {
            ...m,
            subject: m.subjectId?.name || 'Unknown Subject',
            rawPct,
            passed: rawPct >= 40 // Standardized pass threshold (internal)
        };
    });

    // Overall marks %
    const overallMarksPct = enrichedMarks.length > 0
        ? (enrichedMarks.reduce((s, m) => s + m.rawPct, 0) / enrichedMarks.length).toFixed(1)
        : null;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Student Dashboard</h1>
                <p className="text-base-content/60 mt-1">
                    Welcome back, <span className="font-semibold text-base-content">{user?.name}</span>. Here's your academic snapshot.
                </p>
            </div>

            {/* Top Row: Risk + Attendance + Marks Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                {/* Risk Badge */}
                <RiskBadge
                    riskLevel={riskAnalysis?.riskLevel || 'Low'}
                    probability={riskAnalysis?.probability}
                    attendancePercentage={riskAnalysis?.attendancePercentage}
                    showMessage={true}
                />

                {/* Attendance Overview */}
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body items-center text-center py-5">
                        <p className="text-xs font-bold uppercase opacity-50 mb-2">Attendance Overview</p>
                        {totalSessions > 0 ? (
                            <>
                                <div className="relative w-32 h-32">
                                    <Doughnut
                                        data={doughnutData}
                                        options={{
                                            cutout: '72%',
                                            plugins: { legend: { display: false }, tooltip: { enabled: false } },
                                            maintainAspectRatio: false
                                        }}
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={`text-2xl font-black ${attSafe ? 'text-success' : 'text-error'}`}>
                                            {attPct.toFixed(1)}%
                                        </span>
                                        <span className="text-xs opacity-50">Present</span>
                                    </div>
                                </div>
                                <p className="text-xs opacity-50 mt-1">{presentSessions}/{totalSessions} sessions</p>
                                {!attSafe && (
                                    <div className="flex items-center gap-1 text-error text-xs font-medium mt-1">
                                        <AlertTriangle size={13} /> Below 75% — action needed
                                    </div>
                                )}
                                {attSafe && (
                                    <div className="flex items-center gap-1 text-success text-xs font-medium mt-1">
                                        <CheckCircle size={13} /> Safe zone
                                    </div>
                                )}
                                <Link to="/student/attendance" className="btn btn-xs btn-ghost mt-2 gap-1 opacity-60">
                                    View Details <ArrowRight size={12} />
                                </Link>
                            </>
                        ) : (
                            <div className="w-full h-36 flex items-center justify-center">
                                <EmptyState title="No Attendance" message="Records not found" icon={ClipboardList} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Marks Summary */}
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body items-center text-center py-5">
                        <p className="text-xs font-bold uppercase opacity-50 mb-2">Academic Performance</p>
                        {enrichedMarks.length > 0 ? (
                            <>
                                <div className={`text-5xl font-black mt-2 ${overallMarksPct >= 50 ? 'text-success' : 'text-error'}`}>
                                    {overallMarksPct}%
                                </div>
                                <p className="text-xs opacity-40 mt-1">Avg across {enrichedMarks.length} subject{enrichedMarks.length !== 1 ? 's' : ''}</p>
                                <p className="text-xs opacity-40">(T1+T2+Assign) = 100% Scale</p>
                                <div className="flex gap-2 mt-3">
                                    <span className="badge badge-success badge-sm">
                                        {enrichedMarks.filter(m => m.passed).length} Passed
                                    </span>
                                    <span className="badge badge-error badge-sm">
                                        {enrichedMarks.filter(m => !m.passed).length} Failed
                                    </span>
                                </div>
                                <Link to="/student/marks" className="btn btn-xs btn-ghost mt-2 gap-1 opacity-60">
                                    View Details <ArrowRight size={12} />
                                </Link>
                            </>
                        ) : (
                            <div className="w-full h-36 flex items-center justify-center">
                                <EmptyState title="No Marks" message="Not entered yet" icon={GraduationCap} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Performance vs Class Chart */}
            <ComparativeChart marks={classAvgData} />

            {/* Academic Records Table */}
            <div className="card bg-base-100 shadow-xl border border-base-200 max-h-[480px] overflow-auto">
                <div className="card-body p-0">
                    <div className="p-5 border-b border-base-200 flex items-center justify-between">
                        <h2 className="card-title text-base">Academic Records</h2>
                        <Link to="/student/marks" className="btn btn-xs btn-ghost gap-1 opacity-60">
                            Full View <ArrowRight size={12} />
                        </Link>
                    </div>
                    {enrichedMarks.length > 0 ? (
                        <>
                            {/* Desktop */}
                            <table className="table table-zebra w-full hidden md:table">
                                <thead className="bg-base-200">
                                    <tr>
                                        <th>Subject</th>
                                        <th className="text-center">Test 1 <span className="opacity-40 text-xs">/30</span></th>
                                        <th className="text-center">Test 2 <span className="opacity-40 text-xs">/30</span></th>
                                        <th className="text-center">Assignment <span className="opacity-40 text-xs">/40</span></th>
                                        <th className="text-center">Total Score</th>
                                        <th className="text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {enrichedMarks.map((mark, i) => (
                                        <tr key={i}>
                                            <td className="font-medium">{mark.subject}</td>
                                            <td className="text-center">{mark.test1}</td>
                                            <td className="text-center">{mark.test2}</td>
                                            <td className="text-center">{mark.assignment}</td>
                                            <td className="text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`font-bold ${mark.rawPct >= 50 ? 'text-success' : 'text-error'}`}>
                                                        {mark.rawPct}%
                                                    </span>
                                                    <progress
                                                        className={`progress w-16 ${mark.rawPct >= 75 ? 'progress-success' : mark.rawPct >= 50 ? 'progress-warning' : 'progress-error'}`}
                                                        value={mark.rawPct}
                                                        max="100"
                                                    />
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                {mark.passed
                                                    ? <span className="badge badge-success">Pass</span>
                                                    : <span className="badge badge-error">Fail</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Mobile */}
                            <div className="md:hidden">
                                {enrichedMarks.map((mark, i) => (
                                    <div key={i} className="p-4 border-b border-base-200">
                                        <h3 className="font-bold mb-2">{mark.subject}</h3>
                                        <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                                            <div><span className="opacity-50 text-xs">T1</span><br />{mark.test1}/30</div>
                                            <div><span className="opacity-50 text-xs">T2</span><br />{mark.test2}/30</div>
                                            <div><span className="opacity-50 text-xs">Assign</span><br />{mark.assignment}/40</div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={`font-bold ${mark.rawPct >= 50 ? 'text-success' : 'text-error'}`}>
                                                {mark.rawPct}%
                                            </span>
                                            {mark.passed
                                                ? <span className="badge badge-success badge-sm">Pass</span>
                                                : <span className="badge badge-error badge-sm">Fail</span>
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="p-8">
                            <EmptyState title="No Records" message="Marks haven't been uploaded yet." icon={FileText} />
                        </div>
                    )}
                </div>
            </div>

            {/* AI Recommendations */}
            <AIRecommendations
                attendance={{ total: totalSessions, attended: presentSessions, percentage: attPct }}
                marks={enrichedMarks}
                riskAnalysis={riskAnalysis}
            />
        </div>
    );
};

export default StudentDashboard;
