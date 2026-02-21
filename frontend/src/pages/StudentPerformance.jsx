import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getClassAverage } from '../api/studentApi';
import { BarChart2, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement,
    Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MAX_RAW = 100; // 30 + 30 + 40

const StudentPerformance = () => {
    const { user } = useContext(AuthContext);
    const [marksData, setMarksData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.profileId) return;
            try {
                const data = await getClassAverage(user.profileId);
                setMarksData(data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const overallRawPct = marksData.length > 0
        ? (marksData.reduce((s, m) => s + (m.test1 + m.test2 + m.assignment), 0) /
            (marksData.length * MAX_RAW) * 100).toFixed(1)
        : null;

    const passCount = marksData.filter(m => m.passed).length;

    // Chart data
    const chartData = {
        labels: marksData.map(m => m.subject),
        datasets: [
            {
                label: 'Your Score',
                data: marksData.map(m => m.studentTotal),
                backgroundColor: 'rgba(56, 189, 248, 0.85)',
                borderRadius: 6,
            },
            {
                label: 'Class Average',
                data: marksData.map(m => m.classAvg),
                backgroundColor: 'rgba(156, 163, 175, 0.4)',
                borderRadius: 6,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { color: '#9ca3af', font: { size: 12 } } },
            tooltip: {
                callbacks: {
                    label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: 'rgba(75,85,99,0.15)' },
                ticks: { color: '#9ca3af' },
                title: { display: true, text: 'Score %', color: '#9ca3af' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#9ca3af' }
            }
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg text-primary" />
        </div>
    );

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold flex items-center gap-3">
                <TrendingUp className="text-primary" size={32} />
                My Performance
            </h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body text-center py-6">
                        <p className="text-xs font-bold uppercase opacity-50 mb-1">Overall Percentage</p>
                        <p className={`text-4xl font-black ${overallRawPct >= 40 ? 'text-success' : 'text-error'}`}>
                            {overallRawPct !== null ? `${overallRawPct}%` : '—'}
                        </p>
                        <p className="text-xs opacity-40 mt-1">Raw: (T1+T2+Assign) / 100 × 100</p>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body text-center py-6">
                        <p className="text-xs font-bold uppercase opacity-50 mb-1">Subjects Passed</p>
                        <p className="text-4xl font-black text-primary">{passCount} / {marksData.length}</p>
                        <p className="text-xs opacity-40 mt-1">Based on global pass threshold</p>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body text-center py-6">
                        <p className="text-xs font-bold uppercase opacity-50 mb-1">Subjects Tracked</p>
                        <p className="text-4xl font-black">{marksData.length}</p>
                        <p className="text-xs opacity-40 mt-1">With marks entered by teacher</p>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body">
                    <h2 className="font-bold text-sm uppercase opacity-60 tracking-wide mb-4 flex items-center gap-2">
                        <BarChart2 size={18} /> Performance vs Class Average
                    </h2>
                    {marksData.length === 0 ? (
                        <div className="text-center py-16 opacity-40">
                            <BarChart2 size={40} className="mx-auto mb-3" />
                            <p>No marks data available yet.</p>
                            <p className="text-xs mt-1">Your teacher hasn't entered marks for your subjects.</p>
                        </div>
                    ) : (
                        <div className="h-72">
                            <Bar data={chartData} options={chartOptions} />
                        </div>
                    )}
                </div>
            </div>

            {/* Marks Table */}
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body p-0">
                    <div className="p-5 border-b border-base-200">
                        <h2 className="font-bold text-sm uppercase opacity-60 tracking-wide">Academic Records</h2>
                    </div>
                    {marksData.length === 0 ? (
                        <div className="text-center py-16 opacity-40">
                            <BarChart2 size={40} className="mx-auto mb-3" />
                            <p>No marks entered yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead className="bg-base-200">
                                    <tr>
                                        <th>Subject</th>
                                        <th className="text-center">Test 1 <span className="opacity-40 text-xs">/30</span></th>
                                        <th className="text-center">Test 2 <span className="opacity-40 text-xs">/30</span></th>
                                        <th className="text-center">Assignment <span className="opacity-40 text-xs">/40</span></th>
                                        <th className="text-center">Total %</th>
                                        <th className="text-center">Class Avg</th>
                                        <th className="text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {marksData.map((m, i) => (
                                        <tr key={i}>
                                            <td className="font-medium">{m.subject}</td>
                                            <td className="text-center">{m.test1}</td>
                                            <td className="text-center">{m.test2}</td>
                                            <td className="text-center">{m.assignment}</td>
                                            <td className={`text-center font-bold ${m.rawPct >= 40 ? 'text-success' : 'text-error'}`}>
                                                {m.rawPct}%
                                                <div className="text-xs opacity-40 font-normal">
                                                    ({m.test1 + m.test2 + m.assignment}/100)
                                                </div>
                                            </td>
                                            <td className="text-center text-base-content/60">{m.classAvg}</td>
                                            <td className="text-center">
                                                {m.passed
                                                    ? <span className="flex items-center justify-center gap-1 text-success text-sm font-medium"><CheckCircle size={14} /> Pass</span>
                                                    : <span className="flex items-center justify-center gap-1 text-error text-sm font-medium"><XCircle size={14} /> Fail</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentPerformance;
