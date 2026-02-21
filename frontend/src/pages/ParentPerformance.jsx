import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axiosInstance';
import {
    BarChart2, Award, TrendingUp, TrendingDown,
    ArrowLeft, BookOpen, Star, Target,
    FileText, Zap, ChevronRight
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';

const MAX_RAW = 100; // 30 + 30 + 40

const ParentPerformance = () => {
    const [marks, setMarks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMarks = async () => {
            try {
                const { data } = await API.get('/parent/child-performance');
                setMarks(data.data || []);
            } catch (error) {
                console.error("Error fetching child marks:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMarks();
    }, []);

    // Process data for charts
    // Process data for charts and statistics
    const marksData = marks.map(m => {
        const total = (m.test1 || 0) + (m.test2 || 0) + (m.assignment || 0);
        return {
            ...m,
            name: m.subjectId?.name?.substring(0, 10) || 'Unknown',
            total: total,
            subject: m.subjectId?.name || 'Unknown',
            passed: total >= 40 // Assuming 40% is passing
        };
    });

    const chartData = marksData.map(m => ({
        name: m.name,
        total: m.total,
        subject: m.subject
    }));

    const averageScore = chartData.length > 0
        ? (chartData.reduce((acc, curr) => acc + curr.total, 0) / chartData.length).toFixed(1)
        : 0;

    const overallRawPct = marksData.length > 0
        ? (marksData.reduce((s, m) => s + m.total, 0) /
            (marksData.length * MAX_RAW) * 100).toFixed(1)
        : null;

    const passCount = marksData.filter(m => m.passed).length;

    const maxScore = chartData.length > 0 ? Math.max(...chartData.map(d => d.total)) : 0;
    const minScore = chartData.length > 0 ? Math.min(...chartData.map(d => d.total)) : 0;

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col justify-center items-center space-y-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-sm font-medium animate-pulse">Calculating performance metrics...</p>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/parent/dashboard" className="btn btn-ghost btn-circle">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Performance Analytics</h1>
                        <p className="text-sm opacity-60">Internal assessment and academic intelligence</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase text-primary opacity-60">GPA Equivalent</span>
                        <span className="text-2xl font-black text-primary">{(averageScore / 10).toFixed(1)}</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body p-6 flex-row items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-40">Average Performance</p>
                            <h3 className="text-2xl font-black">{averageScore}%</h3>
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body p-6 flex-row items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
                            <Star size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-40">Highest Score</p>
                            <h3 className="text-2xl font-black text-secondary">{maxScore}%</h3>
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body p-6 flex-row items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                            <Target size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-40">Lowest Score</p>
                            <h3 className="text-2xl font-black text-accent">{minScore}%</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card bg-base-100 shadow-xl border border-base-200 p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest opacity-40 mb-8 flex gap-2 items-center">
                        <BarChart2 size={16} /> Mark Distribution
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.total >= 40 ? '#00e5bc' : '#ff5a5f'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-xl border border-base-200 p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest opacity-40 mb-8 flex gap-2 items-center">
                        <Zap size={16} /> Performance Curve
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#570df8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#570df8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} />
                                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                                <Area type="monotone" dataKey="total" stroke="#570df8" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
                <div className="p-6 border-b border-base-200 bg-base-200/30">
                    <h2 className="card-title text-sm font-black uppercase tracking-widest opacity-60 flex gap-2">
                        <FileText size={18} /> Detailed Internal Scores
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr className="bg-base-200/50">
                                <th>Subject</th>
                                <th className="text-center">Test 1 (30)</th>
                                <th className="text-center">Test 2 (30)</th>
                                <th className="text-center">Assignment (40)</th>
                                <th className="text-center">Total (100)</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {marks.map((m, i) => {
                                const total = (m.test1 || 0) + (m.test2 || 0) + (m.assignment || 0);
                                return (
                                    <tr key={i} className="hover">
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-base-200 flex items-center justify-center font-black text-xs">
                                                    {m.subjectId?.name?.charAt(0)}
                                                </div>
                                                <span className="font-bold text-sm">{m.subjectId?.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="text-center font-medium opacity-60">{m.test1 || 0}</td>
                                        <td className="text-center font-medium opacity-60">{m.test2 || 0}</td>
                                        <td className="text-center font-medium opacity-60">{m.assignment || 0}</td>
                                        <td className="text-center">
                                            <div className={`badge badge-lg font-black border-none py-4 px-6 ${total >= 40 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                                                {total}%
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <button className="btn btn-ghost btn-sm btn-square text-primary">
                                                <ChevronRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ParentPerformance;
