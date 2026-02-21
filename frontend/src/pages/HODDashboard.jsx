import React, { useEffect, useState } from 'react';
import API from '../api/axiosInstance';
import SmartInsightCard from '../components/SmartInsightCard';
import { Users, GraduationCap, TrendingUp, AlertTriangle, BarChart2, Brain, Activity } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const HODDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await API.get('/hod/stats');
                setStats(data.data);
            } catch (error) {
                console.error("Error fetching HOD stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-10 flex justify-center h-screen items-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

    return (
        <div className="space-y-6 fade-in pb-10">
            {/* Header */}
            <div className="flex justify-between items-start bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Department Dashboard</h1>
                    <p className="text-base-content/60 mt-1">
                        Overview for <span className="font-semibold text-primary">{stats?.department}</span>
                    </p>
                    {stats?.hasData && stats?.aiInsights?.[1] && (
                        <p className="mt-3 text-sm font-medium text-warning flex items-center gap-2">
                            <Activity size={16} /> {stats.aiInsights[1]}
                        </p>
                    )}
                </div>
                <div className="badge badge-primary badge-lg gap-2 shadow-sm py-4 px-4 font-semibold">
                    <Users size={16} /> Head of Department
                </div>
            </div>

            {/* AI Insights Card */}
            {stats?.hasData && stats?.aiInsights && stats.aiInsights.length > 0 && (
                <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-xl border border-primary/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-primary/10 transition-colors duration-700"></div>
                    <div className="card-body p-6 relative z-10">
                        <h2 className="card-title text-lg font-bold flex items-center gap-2 mb-4">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Brain size={20} className="text-primary animate-pulse" />
                            </div>
                            AI Strategic Insights
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {stats.aiInsights.map((insight, idx) => (
                                <div key={idx} className="flex gap-4 items-start bg-base-100/50 p-4 rounded-xl border border-base-200 shadow-sm backdrop-blur-sm">
                                    <div className="mt-1 p-2 bg-base-200 rounded-full text-base-content/70">
                                        <Activity size={16} />
                                    </div>
                                    <p className="text-sm text-base-content/80 leading-relaxed font-medium">{insight}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SmartInsightCard
                    title="Total Students"
                    value={stats?.totalStudents || 0}
                    icon={GraduationCap}
                    trend="Active"
                    trendUp={true}
                    description="In your department"
                    color="primary"
                />
                <SmartInsightCard
                    title="Total Faculty"
                    value={stats?.totalTeachers || 0}
                    icon={Users}
                    trend="Active"
                    trendUp={true}
                    description="Department staff"
                    color="secondary"
                />
                <SmartInsightCard
                    title="Avg Attendance"
                    value={`${stats?.avgAttendance || 0}%`}
                    icon={TrendingUp}
                    trend={stats?.avgAttendance > 75 ? "Good" : "Low"}
                    trendUp={stats?.avgAttendance > 75}
                    description="Department wide"
                    color={stats?.avgAttendance > 75 ? "success" : "warning"}
                />
                <SmartInsightCard
                    title="High Risk Students"
                    value={stats?.highRiskCount || 0}
                    icon={AlertTriangle}
                    trend="Needs Attention"
                    trendUp={false}
                    description="Critical status"
                    color="error"
                />
            </div>

            {/* Main Content Grid */}
            {!stats?.hasData ? (
                <div className="card bg-base-100 shadow-xl border border-base-200 p-20 text-center flex flex-col items-center justify-center mt-8 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
                    <div className="max-w-md py-10 flex flex-col items-center relative z-10">
                        <div className="p-6 bg-base-200 rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-500">
                            <BarChart2 size={64} className="text-primary/40" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 tracking-tight">Analytics Intelligence Pending</h2>
                        <p className="text-base-content/60 leading-relaxed text-center text-balance">
                            No academic records were found for this department. Once faculty members upload internal marks or record attendance sessions, this dashboard will come alive with predictive insights and performance trends.
                        </p>
                        <div className="mt-8 flex gap-3">
                            <div className="badge badge-outline gap-2 py-3 px-4 text-xs font-semibold opacity-50">
                                <Activity size={12} /> Real-time tracking
                            </div>
                            <div className="badge badge-outline gap-2 py-3 px-4 text-xs font-semibold opacity-50">
                                <Brain size={12} /> AI Insights
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Analytics & Trends */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Performance Trends Widget */}
                        <div className="card bg-base-100 shadow-xl border border-base-200">
                            <div className="card-body p-6">
                                <h2 className="card-title text-base font-bold mb-6 flex items-center justify-between">
                                    <span>Academic Performance Trends</span>
                                    <span className="text-xs font-normal text-base-content/50">Semester by Semester</span>
                                </h2>
                                <div className="h-72 w-full">
                                    {stats?.performanceGraph && stats.performanceGraph.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={stats.performanceGraph} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                                <XAxis dataKey="name" fontSize={12} stroke="currentColor" opacity={0.5} tickLine={false} axisLine={false} />
                                                <YAxis yAxisId="left" fontSize={12} stroke="currentColor" opacity={0.5} tickLine={false} axisLine={false} />
                                                <YAxis yAxisId="right" orientation="right" fontSize={12} stroke="currentColor" opacity={0.5} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'var(--fallback-b1,oklch(var(--b1)))', borderRadius: '0.75rem', border: '1px solid var(--fallback-b2,oklch(var(--b2)))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Line yAxisId="left" type="monotone" dataKey="pass" name="Pass Rate %" stroke="var(--fallback-su,oklch(var(--su)))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                                <Line yAxisId="right" type="monotone" dataKey="avgMarks" name="Avg Marks" stroke="var(--fallback-p,oklch(var(--p)))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-50">
                                            <BarChart2 size={48} className="mb-2" />
                                            <p>No performance data available.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Attendance Trend Widget */}
                        <div className="card bg-base-100 shadow-xl border border-base-200">
                            <div className="card-body p-6">
                                <h2 className="card-title text-base font-bold mb-6 flex items-center justify-between">
                                    <span>Attendance Progression</span>
                                    <span className="text-xs font-normal text-base-content/50">Monthly Tracking</span>
                                </h2>
                                <div className="h-64 w-full">
                                    {stats?.attendanceTrend && stats.attendanceTrend.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={stats.attendanceTrend} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                                                <defs>
                                                    <linearGradient id="colorAtten" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="var(--fallback-in,oklch(var(--in)))" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="var(--fallback-in,oklch(var(--in)))" stopOpacity={0.0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                                <XAxis dataKey="name" fontSize={12} stroke="currentColor" opacity={0.5} tickLine={false} axisLine={false} />
                                                <YAxis fontSize={12} stroke="currentColor" opacity={0.5} tickLine={false} axisLine={false} domain={[0, 100]} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'var(--fallback-b1,oklch(var(--b1)))', borderRadius: '0.75rem', border: '1px solid var(--fallback-b2,oklch(var(--b2)))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Area type="monotone" dataKey="attendance" name="Attendance %" stroke="var(--fallback-in,oklch(var(--in)))" fillOpacity={1} fill="url(#colorAtten)" strokeWidth={3} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-50">
                                            <TrendingUp size={48} className="mb-2" />
                                            <p>No attendance data available.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Faculty Performance Summary */}
                        <div className="card bg-base-100 shadow-xl border border-base-200">
                            <div className="card-body p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="card-title text-base font-bold">Faculty Performance Summary</h2>
                                    <div className="badge badge-ghost badge-sm font-medium">Department Wide</div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="table w-full">
                                        <thead>
                                            <tr className="text-base-content/60 border-b border-base-200 text-xs font-bold uppercase tracking-wider">
                                                <th>Faculty Name</th>
                                                <th className="text-center">Courses</th>
                                                <th>Avg Marks</th>
                                                <th>Avg Atten.</th>
                                                <th>Pass Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats?.facultyPerformance?.map((fac) => (
                                                <tr key={fac._id} className="hover:bg-base-200/50 transition-colors border-b border-base-200/50 last:border-0">
                                                    <td>
                                                        <div className="font-bold text-sm">{fac.name}</div>
                                                        <div className="text-[10px] opacity-40 uppercase tracking-tighter">Academic Staff</div>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge badge-ghost badge-sm tabular-nums">{fac.courseCount}</span>
                                                    </td>
                                                    <td className="font-medium tabular-nums text-sm">{fac.avgMarks}</td>
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-12 h-1.5 bg-base-200 rounded-full overflow-hidden hidden sm:block">
                                                                <div
                                                                    className={`h-full rounded-full ${fac.avgAttendance < 75 ? 'bg-error' : 'bg-success'}`}
                                                                    style={{ width: `${fac.avgAttendance}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className={`text-xs font-bold tabular-nums ${fac.avgAttendance < 75 ? 'text-error' : 'text-success'}`}>
                                                                {fac.avgAttendance}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`text-sm font-bold tabular-nums ${fac.passRate < 50 ? 'text-error' : 'text-base-content'}`}>
                                                            {fac.passRate}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!stats?.facultyPerformance || stats.facultyPerformance.length === 0) && (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-10 text-base-content/50 italic text-sm">No faculty performance data recorded.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Risk & Distribution */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Risk Distribution Chart/Summary */}
                        <div className="card bg-base-100 shadow-xl border border-base-200">
                            <div className="card-body p-6">
                                <h2 className="card-title text-base font-bold mb-4 flex items-center gap-2">
                                    <AlertTriangle size={18} className="text-warning" />
                                    Risk Distribution
                                </h2>
                                <div className="flex flex-col gap-4">
                                    <div className="p-4 bg-success/10 rounded-xl border border-success/20 flex justify-between items-center">
                                        <span className="font-medium text-success">Low Risk (Healthy)</span>
                                        <span className="text-xl font-bold text-success">{stats?.riskSummary?.low || 0}</span>
                                    </div>
                                    <div className="p-4 bg-warning/10 rounded-xl border border-warning/20 flex justify-between items-center">
                                        <span className="font-medium text-warning">Medium Risk</span>
                                        <span className="text-xl font-bold text-warning">{stats?.riskSummary?.medium || 0}</span>
                                    </div>
                                    <div className="p-4 bg-error/10 rounded-xl border border-error/20 flex justify-between items-center">
                                        <span className="font-medium text-error">High Risk (Critical)</span>
                                        <span className="text-xl font-bold text-error">{stats?.riskSummary?.high || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top At-Risk Students Panel */}
                        <div className="card bg-base-100 shadow-xl border border-base-200">
                            <div className="card-body p-6">
                                <h2 className="card-title text-base font-bold mb-2 flex items-center justify-between">
                                    Priority Watchlist
                                    <span className="badge badge-error badge-sm">Top 5</span>
                                </h2>
                                <p className="text-xs text-base-content/50 mb-4">Students requiring immediate academic intervention.</p>

                                <div className="space-y-3">
                                    {stats?.topAtRiskStudents?.map((student) => (
                                        <div key={student._id} className={`p-4 rounded-xl border ${student.riskLevel === 'High' ? 'bg-error/5 border-error/20' : 'bg-warning/5 border-warning/20'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-semibold text-sm">{student.name}</span>
                                                <span className={`badge badge-xs ${student.riskLevel === 'High' ? 'badge-error' : 'badge-warning'}`}>
                                                    {student.riskLevel}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs text-base-content/70">
                                                <span>Atten: <span className={student.attendance < 75 ? 'text-error font-bold' : ''}>{student.attendance}%</span></span>
                                                <span>Marks: <span className={student.avgMarks < 40 ? 'text-error font-bold' : ''}>{student.avgMarks}</span></span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!stats?.topAtRiskStudents || stats.topAtRiskStudents.length === 0) && (
                                        <div className="text-center py-10 opacity-50 flex flex-col items-center">
                                            <AlertTriangle size={32} className="mb-2" />
                                            <p className="text-sm">No students currently at risk.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HODDashboard;
