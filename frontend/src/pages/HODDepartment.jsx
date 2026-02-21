import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, BookOpen, GraduationCap, ArrowRight, UserCheck, ShieldAlert, Edit2, CheckCircle, Activity, ChevronDown, ChevronUp, Search } from 'lucide-react';

const HODDepartment = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Reassignment state
    const [reassigningCourse, setReassigningCourse] = useState(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [reassignLoad, setReassignLoad] = useState(false);
    const [showDetails, setShowDetails] = useState(null);
    const [expandedCourse, setExpandedCourse] = useState(null);

    // Filters
    const [filterRisk, setFilterRisk] = useState('All');
    const [filterSemester, setFilterSemester] = useState('All');

    useEffect(() => {
        fetchDepartmentData();
    }, []);

    const fetchDepartmentData = async () => {
        setLoading(true);
        setError(null);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const token = userInfo ? userInfo.token : '';
            const res = await fetch('/api/hod/department', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Failed to fetch department data');
            setData(json.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReassign = async () => {
        if (!selectedTeacherId) return;
        setReassignLoad(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const token = userInfo ? userInfo.token : '';
            const res = await fetch('/api/hod/reassign-course', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    subjectId: reassigningCourse._id,
                    teacherId: selectedTeacherId
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Failed to reassign');

            // Refresh data
            await fetchDepartmentData();
            setReassigningCourse(null);
            setSelectedTeacherId('');
        } catch (err) {
            alert(err.message);
        } finally {
            setReassignLoad(false);
        }
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
                <button className="btn btn-sm" onClick={fetchDepartmentData}>Retry</button>
            </div>
        );
    }

    if (!data) return null;

    const { summary, facultyList, courseAllocations, activeTeachers } = data;

    // Derived filtered lists
    const filteredFaculty = facultyList.filter(f => filterRisk === 'All' || f.riskIndicator === filterRisk);
    const filteredCourses = courseAllocations.filter(c => filterSemester === 'All' || c.semester === filterSemester);

    // Extract unique semesters for filter
    const uniqueSemesters = [...new Set(courseAllocations.map(c => c.semester))].sort();

    return (
        <div className="space-y-6 fade-in pb-10">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-base-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold">Department Management</h1>
                    <p className="text-base-content/60 mt-1">Operational overview and faculty coordination.</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <Users size={24} />
                </div>
            </div>

            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body p-6 flex-row items-center gap-4">
                        <div className="p-3 bg-primary/10 text-primary rounded-xl">
                            <UserCheck size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-base-content/60 font-medium">Total Faculty</div>
                            <div className="text-2xl font-bold">{summary.totalFaculty}</div>
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body p-6 flex-row items-center gap-4">
                        <div className="p-3 bg-accent/10 text-accent rounded-xl">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-base-content/60 font-medium">Active Courses</div>
                            <div className="text-2xl font-bold">{summary.totalCourses}</div>
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body p-6 flex-row items-center gap-4">
                        <div className="p-3 bg-secondary/10 text-secondary rounded-xl">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-base-content/60 font-medium">Enrolled Students</div>
                            <div className="text-2xl font-bold">{summary.totalStudents}</div>
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body p-6 flex-row items-center gap-4">
                        <div className="p-3 bg-success/10 text-success rounded-xl">
                            <Activity size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-base-content/60 font-medium">Avg Dept Attendance</div>
                            <div className="text-2xl font-bold">{summary.avgDeptAttendance}%</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Faculty Workload Summary */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="card bg-base-100 shadow-xl border border-base-200 h-full">
                        <div className="card-body p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10"></div>
                            <h2 className="card-title text-lg font-bold mb-4">Faculty Workload</h2>

                            <div className="space-y-4">
                                {facultyList.map(fac => {
                                    const overload = fac.coursesAssigned > 3;
                                    const progressVal = Math.min((fac.coursesAssigned / 5) * 100, 100);

                                    return (
                                        <div key={fac._id} className="pe-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-semibold text-sm">{fac.name}</span>
                                                <span className={`text-xs font-bold ${overload ? 'text-error' : 'text-base-content/60'}`}>
                                                    {fac.coursesAssigned} Courses
                                                </span>
                                            </div>
                                            <div className="w-full bg-base-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${overload ? 'bg-error' : 'bg-primary'}`}
                                                    style={{ width: `${progressVal}%` }}
                                                ></div>
                                            </div>
                                            {overload && (
                                                <div className="text-[10px] text-error mt-1 flex items-center gap-1">
                                                    <AlertCircle size={10} /> Overload Warning
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {facultyList.length === 0 && (
                                    <div className="text-sm text-base-content/50 text-center py-4">No faculty data.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Course Allocation Section */}
                <div className="xl:col-span-2">
                    <div className="card bg-base-100 shadow-xl border border-base-200 h-full">
                        <div className="card-body p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="card-title text-lg font-bold items-center gap-2">
                                    <BookOpen size={18} className="text-secondary" /> Course Allocations
                                </h2>
                                <select
                                    className="select select-bordered select-sm w-32"
                                    value={filterSemester}
                                    onChange={(e) => setFilterSemester(e.target.value)}
                                >
                                    <option value="All">All Semesters</option>
                                    {uniqueSemesters.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead>
                                        <tr className="text-base-content/60 border-b border-base-200">
                                            <th>Course Name</th>
                                            <th>Assigned Faculty</th>
                                            <th>Students</th>
                                            <th className="text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCourses.map(course => (
                                            <tr key={course._id} className="hover:bg-base-200/50 transition-colors border-b border-base-200/50">
                                                <td>
                                                    <div className="font-semibold">{course.name}</div>
                                                    <div className="text-xs text-base-content/60">{course.semester} • {course.batch}</div>
                                                </td>
                                                <td>
                                                    {course.teacher ? (
                                                        <span className="flex items-center gap-2 font-medium">
                                                            <CheckCircle size={14} className="text-success" />
                                                            {course.teacher.name}
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-error badge-sm gap-1">
                                                            <AlertCircle size={12} /> Unassigned
                                                        </span>
                                                    )}
                                                </td>
                                                <td>{course.studentCount}</td>
                                                <td className="text-right">
                                                    {reassigningCourse?._id === course._id ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <select
                                                                className="select select-bordered select-sm max-w-[150px]"
                                                                value={selectedTeacherId}
                                                                onChange={(e) => setSelectedTeacherId(e.target.value)}
                                                            >
                                                                <option value="" disabled>Select...</option>
                                                                {activeTeachers.map(t => (
                                                                    <option key={t._id} value={t._id}>{t.name}</option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                onClick={handleReassign}
                                                                disabled={!selectedTeacherId || reassignLoad}
                                                                className="btn btn-primary btn-sm"
                                                            >
                                                                {reassignLoad ? <span className="loading loading-spinner loading-xs"></span> : 'Save'}
                                                            </button>
                                                            <button
                                                                onClick={() => { setReassigningCourse(null); setSelectedTeacherId(''); }}
                                                                className="btn btn-ghost btn-circle btn-sm"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="btn btn-ghost btn-sm text-primary"
                                                            onClick={() => setReassigningCourse(course)}
                                                        >
                                                            <Edit2 size={14} className="mr-1" /> Reassign
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredCourses.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="text-center py-6 text-base-content/50">No courses match criteria.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comprehensive Faculty List Table */}
            <div className="card bg-base-100 shadow-xl border border-base-200 mt-6">
                <div className="card-body p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h2 className="card-title text-lg font-bold items-center gap-2">
                            <Users size={18} className="text-primary" /> Faculty Directory & Performance
                        </h2>

                        <div className="flex gap-2">
                            <select
                                className="select select-bordered select-sm"
                                value={filterRisk}
                                onChange={(e) => setFilterRisk(e.target.value)}
                            >
                                <option value="All">All Risk Levels</option>
                                <option value="Low">Low Risk</option>
                                <option value="Medium">Medium Risk</option>
                                <option value="High">High Risk</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr className="text-base-content/60 border-b border-base-200">
                                    <th>Faculty Name</th>
                                    <th>Courses Assigned</th>
                                    <th>Total Students</th>
                                    <th>Avg Attendance</th>
                                    <th>Avg Pass Rate</th>
                                    <th>Risk Indicator</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFaculty.map(fac => {
                                    // Determine risk styling
                                    let riskStyle = "badge-success badge-outline";
                                    let riskText = "Healthy";
                                    let RiskIcon = ShieldAlert;

                                    if (fac.riskIndicator === 'High') {
                                        riskStyle = "badge-error border-error/50 bg-error/10 text-error";
                                        riskText = "Critical";
                                    } else if (fac.riskIndicator === 'Medium') {
                                        riskStyle = "badge-warning border-warning/50 bg-warning/10 text-warning";
                                        riskText = "Monitor";
                                    } else if (fac.riskIndicator === 'N/A') {
                                        riskStyle = "badge-ghost";
                                        riskText = "No Data";
                                    }

                                    return (
                                        <tr key={fac._id} className="hover:bg-base-200/50 transition-colors border-b border-base-200/50">
                                            <td>
                                                <div className="font-semibold">{fac.name}</div>
                                                <div className="text-xs text-base-content/50">{fac.email}</div>
                                            </td>
                                            <td>
                                                <span className="badge badge-ghost badge-sm">{fac.coursesAssigned}</span>
                                                <span className="text-xs text-base-content/50 inline-block ms-2">
                                                    {fac.courses.map(c => c.name).join(', ').substring(0, 20)}
                                                    {fac.courses.length > 0 && fac.courses.join(', ').length > 20 ? '...' : ''}
                                                </span>
                                            </td>
                                            <td>{fac.totalStudents}</td>
                                            <td className="font-medium">{fac.avgAttendance}%</td>
                                            <td className={`font-medium ${fac.avgPassRate < 50 ? 'text-error' : ''}`}>
                                                {fac.avgPassRate}%
                                            </td>
                                            <td>
                                                <span className={`badge badge-sm gap-1 ${riskStyle}`}>
                                                    <RiskIcon size={12} /> {riskText}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-ghost btn-xs text-primary font-bold"
                                                    onClick={() => setShowDetails(fac)}
                                                >
                                                    View Details <ArrowRight size={12} className="ms-1" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredFaculty.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-8 text-base-content/50">
                                            No faculty records found matching current filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Faculty Details Modal */}
            {showDetails && (
                <div className="modal modal-open">
                    <div className="modal-box w-11/12 max-w-4xl max-h-[90vh] bg-base-100 border border-base-200 shadow-2xl p-0 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-base-200 flex justify-between items-center bg-base-200/30">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Users className="text-primary" size={24} />
                                    {showDetails.name}
                                </h3>
                                <p className="text-sm text-base-content/60">{showDetails.email}</p>
                            </div>
                            <button onClick={() => setShowDetails(null)} className="btn btn-circle btn-ghost btn-sm">✕</button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto flex-1">
                            {/* Summary row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-base-200/50 p-4 rounded-xl">
                                    <div className="text-xs text-base-content/50 uppercase font-black mb-1">Courses</div>
                                    <div className="text-xl font-bold">{showDetails.coursesAssigned}</div>
                                </div>
                                <div className="bg-base-200/50 p-4 rounded-xl">
                                    <div className="text-xs text-base-content/50 uppercase font-black mb-1">Avg Atten.</div>
                                    <div className="text-xl font-bold">{showDetails.avgAttendance}%</div>
                                </div>
                                <div className="bg-base-200/50 p-4 rounded-xl">
                                    <div className="text-xs text-base-content/50 uppercase font-black mb-1">Avg Pass</div>
                                    <div className="text-xl font-bold">{showDetails.avgPassRate}%</div>
                                </div>
                                <div className="bg-base-200/50 p-4 rounded-xl">
                                    <div className="text-xs text-base-content/50 uppercase font-black mb-1">Status</div>
                                    <div className={`text-xl font-bold ${showDetails.riskIndicator === 'High' ? 'text-error' : showDetails.riskIndicator === 'Medium' ? 'text-warning' : 'text-success'}`}>
                                        {showDetails.riskIndicator === 'High' ? 'Critical' : showDetails.riskIndicator === 'Medium' ? 'Monitor' : 'Healthy'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold mb-3 flex items-center gap-2">
                                    <BookOpen size={18} className="text-secondary" /> Course-wise Analysis
                                </h4>
                                <div className="overflow-x-auto border border-base-200 rounded-xl">
                                    <table className="table table-sm w-full">
                                        <thead>
                                            <tr className="bg-base-200/50 border-b border-base-200">
                                                <th className="w-10"></th>
                                                <th>Course</th>
                                                <th>Batch/Sem</th>
                                                <th>Students</th>
                                                <th>Attendance</th>
                                                <th>Pass Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {showDetails.courses.map(course => (
                                                <React.Fragment key={course._id}>
                                                    <tr
                                                        className={`border-b border-base-200 last:border-0 hover:bg-base-200/50 cursor-pointer transition-colors ${expandedCourse === course._id ? 'bg-primary/5' : ''}`}
                                                        onClick={() => setExpandedCourse(expandedCourse === course._id ? null : course._id)}
                                                    >
                                                        <td>
                                                            {expandedCourse === course._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </td>
                                                        <td className="font-bold py-3">{course.name}</td>
                                                        <td>{course.batch} ({course.semester})</td>
                                                        <td className="font-medium">{course.studentCount}</td>
                                                        <td>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 bg-base-300 rounded-full h-1.5 overflow-hidden">
                                                                    <div
                                                                        className={`h-full ${course.avgAttendance < 75 ? 'bg-warning' : 'bg-success'}`}
                                                                        style={{ width: `${course.avgAttendance}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-xs font-bold">{course.avgAttendance}%</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`badge badge-sm font-bold ${course.avgPassRate < 60 ? 'badge-error' : 'badge-success'} badge-outline`}>
                                                                {course.avgPassRate}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    {expandedCourse === course._id && (
                                                        <tr>
                                                            <td colSpan="6" className="p-0 bg-base-200/30">
                                                                <div className="p-4 animate-in slide-in-from-top-2 duration-200">
                                                                    <div className="flex justify-between items-center mb-3">
                                                                        <h5 className="text-xs font-black uppercase tracking-wider text-base-content/50 flex items-center gap-2">
                                                                            Student Performance Distribution
                                                                        </h5>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                        {course.students.map(s => (
                                                                            <div key={s._id} className="bg-base-100 p-3 rounded-lg border border-base-200 flex justify-between items-center shadow-sm">
                                                                                <div>
                                                                                    <div className="text-sm font-bold">{s.name}</div>
                                                                                    <div className="flex items-center gap-3 mt-1">
                                                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${s.attendance < 75 ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                                                                                            Atten: {s.attendance}%
                                                                                        </span>
                                                                                        <span className="text-[10px] text-base-content/50">
                                                                                            Marks: {s.marks} ({s.marksPercentage}%)
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex gap-1">
                                                                                    {[1, 2, 3, 4, 5].map(dot => (
                                                                                        <div
                                                                                            key={dot}
                                                                                            className={`w-1.5 h-1.5 rounded-full ${s.marksPercentage >= dot * 20 ? (s.marksPercentage > 80 ? 'bg-success' : 'bg-primary') : 'bg-base-300'}`}
                                                                                        ></div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-base-200 flex justify-end bg-base-200/30">
                            <button onClick={() => setShowDetails(null)} className="btn btn-primary px-8 text-white">Close</button>
                        </div>
                    </div>
                    <div className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={() => setShowDetails(null)}></div>
                </div>
            )}

        </div>
    );
};

export default HODDepartment;
