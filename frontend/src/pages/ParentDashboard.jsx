import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axiosInstance';
import SmartInsightCard from '../components/SmartInsightCard';
import {
    User, CheckCircle, AlertOctagon, BookOpen,
    Calendar, TrendingUp, TrendingDown, MessageSquare,
    ExternalLink, Mail, Award, AlertTriangle, FileText, Zap
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, trendUp, description, color }) => {
    const colorMap = {
        primary: 'text-primary bg-primary/10 border-primary/20',
        secondary: 'text-secondary bg-secondary/10 border-secondary/20',
        success: 'text-success bg-success/10 border-success/20',
        warning: 'text-warning bg-warning/10 border-warning/20',
        error: 'text-error bg-error/10 border-error/20',
        accent: 'text-accent bg-accent/10 border-accent/20',
    };

    const colorClasses = colorMap[color] || colorMap.primary;

    return (
        <div className="card bg-base-100 shadow-xl border border-base-200 group hover:shadow-2xl transition-all duration-300">
            <div className="card-body p-5">
                <div className="flex justify-between items-start mb-2">
                    <div className={`p-2.5 rounded-xl ${colorClasses} border`}>
                        <Icon size={20} />
                    </div>
                    {trend && (
                        <div className={`badge badge-sm border-none font-bold py-3 ${trendUp ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                            {trendUp ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
                            {trend}
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{title}</h3>
                    <div className="text-2xl font-black tracking-tight">{value}</div>
                    <p className="text-[10px] font-medium opacity-50 mt-1">{description}</p>
                </div>
            </div>
        </div>
    );
};

const ParentDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await API.get('/parent/child-stats');
                setStats(data.data);
            } catch (error) {
                console.error("Error fetching Parent stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col justify-center items-center space-y-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-sm font-medium animate-pulse">Syncing student records...</p>
        </div>
    );

    if (!stats) return (
        <div className="min-h-[40vh] flex flex-col justify-center items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-base-200">
                <User size={48} className="opacity-20" />
            </div>
            <h2 className="text-xl font-bold">No student data linked.</h2>
            <p className="opacity-60 max-w-xs">Please contact the administrator to link your child's profile to your account.</p>
        </div>
    );

    const riskColor = stats.riskLabel === 'High' ? 'error' : stats.riskLabel === 'Medium' ? 'warning' : 'success';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-base-content">
                        Hello, <span className="text-primary font-bold">{stats.parentName || 'Parent'}</span>
                    </h1>
                    <p className="text-base-content/60 flex items-center gap-2">
                        Tracking performance for <span className="font-bold text-base-content">{stats.studentName}</span>
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <div className="badge badge-lg bg-base-200 border-none font-bold py-4">{stats.studentDepartment}</div>
                    <div className="badge badge-lg badge-primary py-4">{stats.studentBatch}</div>
                    <div className="badge badge-lg badge-secondary outline py-4">Sem {stats.studentSemester}</div>
                </div>
            </div>

            {/* Smart Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Attendance"
                    value={stats.hasAttendanceData ? `${stats.attendancePercentage}%` : "No Data"}
                    icon={CheckCircle}
                    trend={stats.hasAttendanceData ? (stats.attendancePercentage >= 75 ? "Safe" : "Critical") : "N/A"}
                    trendUp={stats.hasAttendanceData && stats.attendancePercentage >= 75}
                    description="Total sessions present"
                    color={stats.hasAttendanceData ? (stats.attendancePercentage >= 75 ? "success" : "error") : "base-300"}
                />

                <StatCard
                    title="Risk Level"
                    value={stats.hasAttendanceData ? stats.riskLabel : "N/A"}
                    icon={AlertOctagon}
                    trend={stats.hasAttendanceData ? `Safety: ${stats.riskScore}` : "Insufficient Data"}
                    trendUp={stats.hasAttendanceData && stats.riskScore >= 75}
                    description="AI Sentiment Analysis"
                    color={stats.hasAttendanceData ? riskColor : "base-300"}
                />

                <StatCard
                    title="Engagement"
                    value={stats.hasAttendanceData ? stats.engagementStatus : "N/A"}
                    icon={Zap}
                    trend={stats.hasAttendanceData ? `Score: ${stats.engagementScore}` : "Awaiting Data"}
                    trendUp={stats.hasAttendanceData && stats.engagementScore >= 75}
                    description="Participation Index"
                    color={stats.hasAttendanceData ? (stats.engagementScore >= 75 ? "success" : stats.engagementScore >= 60 ? "warning" : "error") : "base-300"}
                />

                <StatCard
                    title="Academic Avg"
                    value={stats.hasMarksData ? `${stats.averagePerformance}%` : "N/A"}
                    icon={Award}
                    trend={stats.hasMarksData ? `Top: ${stats.highestPerforming}` : "No Marks"}
                    trendUp={stats.hasMarksData && stats.averagePerformance >= 50}
                    description="Internal Score Aggregate"
                    color={stats.hasMarksData ? (stats.averagePerformance >= 50 ? "success" : "warning") : "base-300"}
                />
            </div>

            {/* AI Insight Alert */}
            <div className={`alert text-sm shadow-lg border-l-4 ${riskColor === 'error' ? 'alert-error border-error bg-error/10' : riskColor === 'warning' ? 'alert-warning border-warning bg-warning/10' : 'alert-info border-info bg-info/10'}`}>
                <div className="flex items-start gap-3">
                    {riskColor === 'error' ? <AlertTriangle size={20} className="shrink-0" /> : <MessageSquare size={20} className="shrink-0" />}
                    <div>
                        <span className="font-bold block uppercase tracking-tight text-[10px] opacity-70 mb-1">AI Recommendation</span>
                        <p className="font-medium leading-relaxed">{stats.riskExplanation}</p>
                    </div>
                </div>
            </div>

            {/* Main Content Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Academic Breakdown & Teachers */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Recent Performance Card */}
                    <div className="card bg-base-100 shadow-xl border border-base-200">
                        <div className="card-body p-0">
                            <div className="p-6 border-b border-base-200 flex justify-between items-center">
                                <h2 className="card-title text-sm font-bold uppercase tracking-widest opacity-60 flex gap-2">
                                    <BookOpen size={18} /> Recent Academic Scores
                                </h2>
                                <Link to="/parent/performance" className="btn btn-ghost btn-xs gap-1 lowercase font-normal opacity-50 hover:opacity-100">
                                    <ExternalLink size={12} /> view full reports
                                </Link>
                            </div>

                            <div className="p-6">
                                {stats.recentMarks && stats.recentMarks.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="table table-zebra">
                                            <thead>
                                                <tr className="bg-base-200/50">
                                                    <th>Subject</th>
                                                    <th className="text-center">T1</th>
                                                    <th className="text-center">T2</th>
                                                    <th className="text-center">Assgn.</th>
                                                    <th className="text-center">Total %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.recentMarks.map((mark, i) => (
                                                    <tr key={i} className="hover">
                                                        <td className="font-bold">{mark.subjectId?.name || 'Unknown'}</td>
                                                        <td className="text-center opacity-60">{mark.test1 || '-'}</td>
                                                        <td className="text-center opacity-60">{mark.test2 || '-'}</td>
                                                        <td className="text-center opacity-60">{mark.assignment || '-'}</td>
                                                        <td className="text-center">
                                                            <div className={`radial-progress ${mark.total >= 40 ? 'text-success' : 'text-error'} bg-base-200 border-none w-8 h-8 text-[8px] font-bold`} style={{ "--value": mark.total, "--size": "2rem", "--thickness": "3px" }} role="progressbar">
                                                                {mark.total}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 opacity-40">
                                        <FileText size={40} className="mx-auto mb-2" />
                                        <p className="text-sm">No recent marks available.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Subject Teachers Grid */}
                    <div className="card bg-base-100 shadow-xl border border-base-200">
                        <div className="card-body p-0">
                            <div className="p-6 border-b border-base-200">
                                <h2 className="card-title text-sm font-bold uppercase tracking-widest opacity-60 flex gap-2">
                                    <User size={18} /> Faculty Contacts
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {stats.subjects?.map((subj, idx) => (
                                        <div key={idx} className="p-4 bg-base-200/40 rounded-2xl flex flex-col justify-between group hover:bg-base-200 transition-all border border-transparent hover:border-primary/20">
                                            <div className="mb-4">
                                                <div className="badge badge-sm badge-outline badge-primary font-bold mb-2 lowercase">{subj.name}</div>
                                                <p className="font-bold text-sm block">{subj.teacher}</p>
                                            </div>
                                            {subj.teacherEmail && (
                                                <a
                                                    href={`mailto:${subj.teacherEmail}`}
                                                    className="btn btn-primary btn-sm btn-block gap-2 rounded-xl group-hover:shadow-lg transition-all"
                                                >
                                                    <Mail size={14} /> Contact
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Exams & Remarks */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Upcoming Exams Feed */}
                    <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
                        <div className="p-6 bg-accent text-accent-content">
                            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={18} /> Examination Feed
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {stats.upcomingExams && stats.upcomingExams.length > 0 ? (
                                stats.upcomingExams.map((exam, idx) => (
                                    <div key={idx} className="flex gap-4 p-3 rounded-xl hover:bg-base-200 transition-colors border border-base-200/50">
                                        <div className="flex flex-col items-center justify-center bg-base-200 rounded-lg p-2 min-w-[50px]">
                                            <span className="text-[10px] font-bold opacity-50 uppercase">{new Date(exam.date).toLocaleString('en-US', { month: 'short' })}</span>
                                            <span className="text-xl font-black">{new Date(exam.date).getDate()}</span>
                                        </div>
                                        <div className="flex flex-col justify-center min-w-0">
                                            <span className="font-bold text-sm truncate">{exam.subject}</span>
                                            <span className="text-xs opacity-60">{exam.type} • Tomorrow</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 opacity-40 italic text-sm">No upcoming exams.</div>
                            )}
                        </div>
                    </div>

                    {/* Teacher Remarks Feed */}
                    <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
                        <div className="p-6 bg-secondary text-secondary-content">
                            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare size={18} /> Teacher Mentions
                            </h3>
                        </div>
                        <div className="p-6 space-y-6">
                            {stats.teacherRemarks && stats.teacherRemarks.length > 0 ? (
                                stats.teacherRemarks.map((rem, idx) => (
                                    <div key={idx} className="relative pl-6 border-l-2 border-secondary/20 space-y-1">
                                        <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-secondary shadow-lg shadow-secondary/50" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-secondary uppercase tracking-tighter">{rem.subject}</span>
                                            <span className="text-[10px] opacity-40">{new Date(rem.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm italic font-medium opacity-80 leading-relaxed">"{rem.remark}"</p>
                                        <div className="flex items-center gap-1.5 opacity-40 group cursor-default">
                                            <div className="w-3 h-[1px] bg-current" />
                                            <span className="text-[10px] font-bold">{rem.teacher}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 opacity-40 italic text-sm">No remarks yet.</div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ParentDashboard;
