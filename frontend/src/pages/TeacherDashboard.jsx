import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axiosInstance';
import { Users, TrendingUp, AlertTriangle, BookOpen } from 'lucide-react';
import SmartInsightCard from '../components/SmartInsightCard';
import ForecastPanel from '../components/charts/ForecastPanel';

const TeacherDashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await API.get('/teacher/dashboard-stats');
                setStats(data.data);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center min-h-[400px]">
            <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
    );

    if (!stats) return (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <AlertTriangle size={48} className="mb-4" />
            <p className="text-lg">Unable to load dashboard data.</p>
        </div>
    );

    // --- Safe access ---
    const avgAttendance = parseFloat(stats.avgAttendance) || 0;
    const avgMarks = parseFloat(stats.avgMarks) || 0;
    const highRiskCount = stats.highRiskCount || 0;
    const totalStudents = stats.totalStudents || 0;
    const weakest = stats.weakestComponent;
    const forecast = stats.analytics?.forecast || null;
    const consistencyScore = stats.analytics?.consistencyScore || 0;
    const settingsData = stats.settings || {};

    // Build forecast data for ForecastPanel
    const forecastData = forecast ? {
        ...forecast,
        consistencyScore: Math.round(consistencyScore)
    } : null;

    // --- Insight logic: avoid contradictions ---
    const hasHighRisk = highRiskCount > 0;
    const attendanceGood = avgAttendance >= 85;
    const attendanceLow = avgAttendance > 0 && avgAttendance < 60;
    const marksLow = avgMarks > 0 && settingsData.passMarks && avgMarks < settingsData.passMarks;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-base-content">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
                    <p className="text-base-content/60">Here is your academic overview.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="stat bg-base-100 shadow-xl rounded-2xl border border-base-200">
                    <div className="stat-figure text-primary"><Users size={24} /></div>
                    <div className="stat-title">Total Students</div>
                    <div className="stat-value text-primary">{totalStudents}</div>
                    <div className="stat-desc">Across {stats.totalSubjects || 0} subjects</div>
                </div>

                <div className="stat bg-base-100 shadow-xl rounded-2xl border border-base-200">
                    <div className="stat-figure text-success"><TrendingUp size={24} /></div>
                    <div className="stat-title">Avg Attendance</div>
                    <div className="stat-value text-success">{avgAttendance.toFixed(1)}%</div>
                    <div className="stat-desc">
                        {avgAttendance === 0 ? 'No sessions recorded' :
                            avgAttendance >= (settingsData.minAttendance || 75) ? 'Above threshold' : 'Below threshold'}
                    </div>
                </div>

                <div className="stat bg-base-100 shadow-xl rounded-2xl border border-base-200">
                    <div className="stat-figure text-secondary"><BookOpen size={24} /></div>
                    <div className="stat-title">Avg Internal Marks</div>
                    <div className="stat-value text-secondary">{avgMarks.toFixed(1)}</div>
                    <div className="stat-desc">
                        {avgMarks === 0 ? 'No marks entered' :
                            `Pass: ${settingsData.passMarks || 20} | Max: 100`}
                    </div>
                </div>

                <div className="stat bg-base-100 shadow-xl rounded-2xl border border-base-200">
                    <div className="stat-figure text-error"><AlertTriangle size={24} /></div>
                    <div className="stat-title">High Risk</div>
                    <div className="stat-value text-error">{highRiskCount}</div>
                    <div className="stat-desc">
                        {highRiskCount === 0 ? 'All students on track' :
                            `${((highRiskCount / Math.max(totalStudents, 1)) * 100).toFixed(0)}% of class at risk`}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Forecast */}
                <div className="lg:col-span-2">
                    <div className="card bg-base-100 shadow-xl border border-base-200 h-full">
                        <div className="card-body">
                            <h2 className="card-title mb-4">Performance Forecast</h2>
                            <ForecastPanel data={forecastData} />
                        </div>
                    </div>
                </div>

                {/* Risk Watchlist */}
                <div className="lg:col-span-1">
                    <div className="card bg-base-100 shadow-xl border border-base-200 h-full">
                        <div className="card-body">
                            <h2 className="card-title flex justify-between items-center mb-4">
                                Risk Watchlist
                                {highRiskCount > 0 && <span className="badge badge-error gap-1">{highRiskCount} total</span>}
                            </h2>
                            <div className="space-y-3 max-h-[400px] overflow-auto pr-2 custom-scrollbar">
                                {stats.highRiskStudents?.length > 0 ? (
                                    stats.highRiskStudents.map((s) => (
                                        <div key={s._id} className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg hover:bg-base-200 transition-colors">
                                            <div className="min-w-0 flex-1">
                                                <div className="font-bold truncate">{s.name}</div>
                                                <div className="text-xs opacity-60 truncate">{s.reason}</div>
                                            </div>
                                            <div className="flex flex-col items-end ml-2">
                                                <span className={`badge badge-sm ${s.risk === 'Critical' ? 'badge-error' : 'badge-warning'}`}>{s.risk}</span>
                                                <span className="text-xs opacity-50 mt-1">{s.attendance !== 'N/A' ? `${s.attendance}%` : 'N/A'}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 opacity-50">
                                        <Users size={32} className="mx-auto mb-2" />
                                        <p>No at-risk students detected.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Insights — with contradiction prevention */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weakest Component */}
                {weakest && weakest.name && weakest.name !== 'None' && (
                    <SmartInsightCard
                        type="warning"
                        title="Weakest Component"
                        description={`${weakest.name} has the lowest average (${weakest.pct?.toFixed?.(1) || weakest.pct}% of max). Consider focused practice.`}
                    />
                )}

                {/* High Attendance — ONLY if no high-risk students */}
                {attendanceGood && !hasHighRisk && (
                    <SmartInsightCard
                        type="success"
                        title="Strong Attendance"
                        description="Class attendance is above 85%. Great engagement."
                    />
                )}

                {/* Low Attendance — shown when actually low */}
                {attendanceLow && (
                    <SmartInsightCard
                        type="critical"
                        title="Low Attendance Alert"
                        description={`Class average is ${avgAttendance.toFixed(1)}% (threshold: ${settingsData.minAttendance || 75}%). Reach out to absent students.`}
                    />
                )}

                {/* High Risk Warning — shown ONLY when contradiction-free */}
                {hasHighRisk && !attendanceGood && (
                    <SmartInsightCard
                        type="critical"
                        title="Students at Risk"
                        description={`${highRiskCount} student${highRiskCount > 1 ? 's' : ''} below attendance or marks thresholds. Review the Risk Watchlist.`}
                    />
                )}

                {/* Marks below pass — only when data exists */}
                {marksLow && (
                    <SmartInsightCard
                        type="warning"
                        title="Low Class Average"
                        description={`Average internal marks (${avgMarks.toFixed(1)}) are below the pass threshold (${settingsData.passMarks}). Consider remedial sessions.`}
                    />
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;
