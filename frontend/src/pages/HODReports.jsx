import React, { useState, useEffect } from 'react';
import { BarChart as BarGraphic, AlertCircle, Download, Printer, Filter, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const HODReports = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeFilter, setTimeFilter] = useState('Academic Year');

    useEffect(() => {
        fetchReportsData(timeFilter);
    }, [timeFilter]);

    const fetchReportsData = async (filter) => {
        setLoading(true);
        setError(null);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const token = userInfo ? userInfo.token : '';
            const res = await fetch(`/api/hod/reports?filter=${filter}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Failed to fetch reports data');
            setData(json.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const exportToCSV = () => {
        if (!data) return;

        // Let's create a combined CSV containing both Faculty and Course tables
        let csvContent = "data:text/csv;charset=utf-8,";

        csvContent += "=== Faculty Performance Report ===\n";
        csvContent += "Faculty Name,Avg Marks,Pass Rate (%),Attendance (%),Risk Impact Score\n";
        data.facultyPerformance.forEach(row => {
            csvContent += `${row.name},${row.avgMarks},${row.passRate},${row.attendance},${row.impactScore}\n`;
        });

        csvContent += "\n=== Course Performance Breakdown ===\n";
        csvContent += "Course Name,Semester,Assigned Faculty,Avg Marks,Pass Rate (%),Attendance (%)\n";
        data.coursePerformance.forEach(row => {
            csvContent += `${row.courseName},${row.semester},${row.facultyName},${row.avgMarks},${row.passRate},${row.attendance}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `HOD_Department_Report_${timeFilter.replace(' ', '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <span className="loading loading-bars loading-lg text-primary"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error shadow-lg">
                <AlertCircle />
                <span>{error}</span>
                <button className="btn btn-sm" onClick={() => fetchReportsData(timeFilter)}>Retry</button>
            </div>
        );
    }

    if (!data) return null;

    const { performanceTrends, attendanceTrends, riskDistribution, highRiskStudents, facultyPerformance, coursePerformance } = data;

    // Optional: Hide empty graphs if no data
    const hasPerfData = performanceTrends.length > 0;
    const hasAttenData = attendanceTrends.length > 0;

    return (
        <div className="space-y-6 fade-in pb-10">
            {/* Header & Controls (Hidden in Print) */}
            <div className="print-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-base-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold">Department Reports</h1>
                    <p className="text-base-content/60 mt-1">Review performance analytics and export department data.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="join border border-base-300 rounded-lg">
                        <select
                            className="select select-bordered select-sm join-item cursor-pointer focus:outline-none"
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                        >
                            <option value="Academic Year">Academic Year</option>
                            <option value="Semester">Current Semester</option>
                            <option value="Monthly">This Month</option>
                        </select>
                        <div className="btn btn-sm btn-ghost join-item pointer-events-none text-primary">
                            <Filter size={16} />
                        </div>
                    </div>

                    <button onClick={exportToCSV} className="btn btn-outline btn-sm gap-2">
                        <FileSpreadsheet size={16} /> CSV
                    </button>
                    <button onClick={handlePrint} className="btn btn-primary btn-sm gap-2">
                        <Printer size={16} /> Print Report
                    </button>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print-block mb-8 text-center border-b pb-4 border-black">
                <h1 className="text-3xl font-bold">AcadIQ Department Report</h1>
                <p className="opacity-70 mt-1">Generated Scope: {timeFilter}</p>
                <p className="opacity-70 text-sm">{new Date().toLocaleDateString()}</p>
            </div>

            {/* 1. Performance Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Dept Avg Marks (Line) */}
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body p-5">
                        <h2 className="card-title text-base mb-4"><Award size={18} className="text-primary" /> Avg Marks Trend</h2>
                        <div className="h-48">
                            {hasPerfData ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={performanceTrends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: 'oklch(var(--b1))', border: '1px solid oklch(var(--b2))', borderRadius: '8px' }}
                                        />
                                        <Line type="monotone" dataKey="avgMarks" name="Avg Marks" stroke="oklch(var(--p))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-base-content/50">No Data Available</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dept Pass Rate (Bar) */}
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body p-5">
                        <h2 className="card-title text-base mb-4"><ShieldAlert size={18} className="text-secondary" /> Pass Rate Trend (%)</h2>
                        <div className="h-48">
                            {hasPerfData ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performanceTrends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={30}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} domain={[0, 100]} />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: 'oklch(var(--b1))', border: '1px solid oklch(var(--b2))', borderRadius: '8px' }}
                                            cursor={{ fill: 'oklch(var(--b2))', opacity: 0.4 }}
                                        />
                                        <Bar dataKey="passRate" name="Pass %" fill="oklch(var(--s))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-base-content/50">No Data Available</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Attendance Trend (Area) */}
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body p-5">
                        <h2 className="card-title text-base mb-4"><BarGraphic size={18} className="text-accent" /> Attendance Scope (%)</h2>
                        <div className="h-48">
                            {hasAttenData ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={attendanceTrends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorAtten" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="oklch(var(--a))" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="oklch(var(--a))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} domain={[0, 100]} />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: 'oklch(var(--b1))', border: '1px solid oklch(var(--b2))', borderRadius: '8px' }}
                                        />
                                        <Area type="monotone" dataKey="attendance" name="Atten %" stroke="oklch(var(--a))" fillOpacity={1} fill="url(#colorAtten)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-base-content/50">No Data Available</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Risk Report Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">

                {/* Donut Chart: Risk Distribution */}
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body p-6 items-center text-center">
                        <h2 className="font-bold text-lg w-full text-left relative z-10">Risk Distribution</h2>

                        <div className="w-full h-56 relative -mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={riskDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {riskDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: 'oklch(var(--b1))', border: '1px solid oklch(var(--b2))', borderRadius: '8px' }}
                                        itemStyle={{ color: 'oklch(var(--bc))' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Inner Donut Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
                                <span className="text-3xl font-bold">{riskDistribution.reduce((a, b) => a + b.value, 0)}</span>
                                <span className="text-xs text-base-content/60">Total</span>
                            </div>
                        </div>

                        {/* Custom Legend */}
                        <div className="flex justify-center gap-4 w-full mt-2">
                            {riskDistribution.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs font-medium">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                                    {item.name} ({item.value})
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table: High-Risk Students */}
                <div className="lg:col-span-2 card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body p-6">
                        <h2 className="card-title text-lg mb-2">Top High-Risk Students (Action Required)</h2>
                        <div className="overflow-x-auto">
                            <table className="table table-sm w-full">
                                <thead>
                                    <tr className="border-b border-base-200 text-base-content/60">
                                        <th>Student Name</th>
                                        <th>Attendance</th>
                                        <th>Avg Marks</th>
                                        <th>Risk Severity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {highRiskStudents.map((student, idx) => (
                                        <tr key={idx} className="hover:bg-error/5 transition-colors">
                                            <td className="font-semibold">{student.name}</td>
                                            <td className={`${parseInt(student.attendance) < 75 ? 'text-error font-medium' : ''}`}>{student.attendance}</td>
                                            <td className={`${parseInt(student.avgMarks) < 40 ? 'text-error font-medium' : ''}`}>{student.avgMarks}</td>
                                            <td>
                                                <span className={`badge badge-sm ${student.riskLevel === 'High' ? 'badge-error' : 'badge-warning'}`}>
                                                    {student.riskLevel}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {highRiskStudents.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="text-center py-6 text-base-content/50">No medium/high risk students found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Faculty Performance Report */}
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body p-6">
                    <h2 className="card-title text-lg mb-4">Faculty Performance Report</h2>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                            <thead>
                                <tr className="border-b-2 border-base-200 text-base-content/70">
                                    <th>Faculty Name</th>
                                    <th>Avg Marks</th>
                                    <th>Pass Rate</th>
                                    <th>Class Attendance</th>
                                    <th>Algorithmic Risk Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {facultyPerformance.map((fac, idx) => (
                                    <tr key={idx}>
                                        <td className="font-semibold">{fac.name}</td>
                                        <td className="font-medium">{fac.avgMarks}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span>{fac.passRate}%</span>
                                                <progress className={`progress w-16 ${(fac.passRate < 50 && fac.passRate > 0) ? 'progress-error' : 'progress-primary'}`} value={fac.passRate} max="100"></progress>
                                            </div>
                                        </td>
                                        <td>{fac.attendance}%</td>
                                        <td>
                                            <div className={`badge ${typeof fac.impactScore === 'number' ? (fac.impactScore < 50 ? 'badge-error badge-outline' : 'badge-success badge-outline') : 'badge-ghost'}`}>
                                                {fac.impactScore} {typeof fac.impactScore === 'number' ? 'pts' : ''}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {facultyPerformance.length === 0 && (
                                    <tr><td colSpan="5" className="text-center py-4">No data</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 4. Course Performance Breakdown */}
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body p-6">
                    <h2 className="card-title text-lg mb-4">Course Performance Breakdown</h2>
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr className="border-b-2 border-base-200 text-base-content/70">
                                    <th>Course Designation</th>
                                    <th>Primary Faculty</th>
                                    <th>Avg Marks</th>
                                    <th>Pass Rate</th>
                                    <th>Attendance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coursePerformance.map((crs, idx) => (
                                    <tr key={idx} className="hover:bg-base-200/50">
                                        <td>
                                            <div className="font-bold">{crs.courseName}</div>
                                            <div className="text-xs text-base-content/50">{crs.semester}</div>
                                        </td>
                                        <td>{crs.facultyName}</td>
                                        <td>{crs.avgMarks}</td>
                                        <td className={`${crs.passRate < 50 ? 'text-error font-medium' : ''}`}>{crs.passRate}%</td>
                                        <td className={`${crs.attendance < 75 && crs.attendance > 0 ? 'text-warning font-medium' : ''}`}>{crs.attendance}%</td>
                                    </tr>
                                ))}
                                {coursePerformance.length === 0 && (
                                    <tr><td colSpan="5" className="text-center py-4">No data</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Global Print Styles explicitly hiding sidebars inside standard app layout */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .fixed, .drawer-side, .navbar {
                        display: none !important;
                    }
                    #root > div > div.drawer-content > main,
                    #root > div > div.drawer-content > main * {
                        visibility: visible;
                    }
                    #root > div > div.drawer-content > main {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    .print-hidden {
                        display: none !important;
                    }
                    .card {
                        box-shadow: none !important;
                        border: 1px solid #ccc !important;
                        break-inside: avoid;
                        margin-bottom: 20px;
                    }
                }
            `}</style>

        </div>
    );
};

export default HODReports;
