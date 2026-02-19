import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Calendar, UserCheck, UserX, Save, GraduationCap, Users, AlertCircle, Edit3 } from 'lucide-react';
import API from '../api/axiosInstance';

const TeacherAttendance = () => {
    const { user } = useContext(AuthContext);
    const { success: toastSuccess, error: toastError } = useToast();

    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedSubjectName, setSelectedSubjectName] = useState("");
    const [selectedBatch, setSelectedBatch] = useState("");
    const [selectedSemester, setSelectedSemester] = useState("");

    const [students, setStudents] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Stats
    const [stats, setStats] = useState({ present: 0, absent: 0, percentage: 0 });

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const { data } = await API.get('/teacher/subjects');
                setSubjects(data.data || []);
            } catch (error) {
                console.error("Failed to fetch subjects", error);
                toastError("Could not load subjects.");
            }
        };
        fetchSubjects();
    }, []);

    // When subject/batch/semester/date changes → fetch students & check existing attendance
    useEffect(() => {
        if (selectedSubject && selectedBatch && selectedSemester && date) {
            fetchStudentsAndAttendance();
        } else {
            setStudents([]);
            setIsEditMode(false);
        }
    }, [selectedSubject, selectedBatch, selectedSemester, date]);

    const fetchStudentsAndAttendance = async () => {
        setLoading(true);
        try {
            // 1. Fetch students for this subject/batch/semester
            const { data: studentData } = await API.get(
                `/teacher/students?subjectId=${selectedSubject}&batch=${selectedBatch}&semester=${selectedSemester}`
            );
            const studentList = studentData.data.students || [];

            // 2. Check if attendance already exists for this date
            const { data: attData } = await API.get(
                `/teacher/attendance?subjectId=${selectedSubject}&batch=${selectedBatch}&date=${date}`
            );

            const existingRecords = attData.data;
            let finalStudents;

            if (existingRecords?.exists && existingRecords.records?.length > 0) {
                // Attendance exists — merge existing statuses into student list
                setIsEditMode(true);
                const recordMap = {};
                existingRecords.records.forEach(r => {
                    // r.studentId is Student._id; match against studentProfileId
                    recordMap[r.studentId?.toString()] = r.status;
                });

                finalStudents = studentList.map(s => ({
                    ...s,
                    status: recordMap[s.studentProfileId?.toString()] || 'Present'
                }));
            } else {
                // No attendance — default all to Present
                setIsEditMode(false);
                finalStudents = studentList.map(s => ({
                    ...s,
                    status: 'Present'
                }));
            }

            setStudents(finalStudents);
            calculateStats(finalStudents);

        } catch (error) {
            console.error(error);
            toastError("Failed to fetch students");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (id, status) => {
        const updated = students.map(s => s._id === id ? { ...s, status } : s);
        setStudents(updated);
        calculateStats(updated);
    };

    const markAllPresent = () => {
        const updated = students.map(s => ({ ...s, status: 'Present' }));
        setStudents(updated);
        calculateStats(updated);
    };

    const markAllAbsent = () => {
        const updated = students.map(s => ({ ...s, status: 'Absent' }));
        setStudents(updated);
        calculateStats(updated);
    };

    const calculateStats = (currentStudents) => {
        const total = currentStudents.length;
        const present = currentStudents.filter(s => s.status === 'Present').length;
        const absent = total - present;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        setStats({ present, absent, percentage });
    };

    const handleSubmit = async () => {
        if (!selectedSubject || !date) {
            toastError("Please select a subject and date.");
            return;
        }

        // Future Date Check
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (selectedDate > today) {
            toastError("Cannot mark attendance for future dates.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                subjectId: selectedSubject,
                batch: selectedBatch,
                date: date,
                // Send studentProfileId (Student._id) as _id so backend stores correct ID
                students: students.map(s => ({ _id: s.studentProfileId || s._id, status: s.status })),
                hours: 1
            };

            const { data } = await API.post('/teacher/attendance', payload);
            const isUpdate = data.data?.isUpdate;

            toastSuccess(isUpdate ? "Attendance updated!" : "Attendance marked successfully!");
            setIsEditMode(true); // After save, subsequent saves are edits
        } catch (error) {
            console.error(error);
            toastError(error.response?.data?.message || "Failed to submit attendance");
        } finally {
            setSaving(false);
        }
    };

    const handleSubjectChange = (e) => {
        const subId = e.target.value;
        const sub = subjects.find(s => s._id === subId);
        setSelectedSubject(subId);
        setSelectedSubjectName(sub ? sub.name : "");
        setSelectedBatch(sub ? sub.batch : "");
        setSelectedSemester(sub ? sub.semester || "S1" : "");
    };

    const canSubmit = selectedSubject && selectedBatch && selectedSemester && students.length > 0;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-base-content">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Calendar className="text-primary" size={32} />
                Attendance Management
            </h1>

            {/* Controls */}
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Subject */}
                    <div className="form-control">
                        <label className="label text-sm font-bold text-base-content/70">Subject</label>
                        <select className="select select-bordered w-full" value={selectedSubject} onChange={handleSubjectChange}>
                            <option value="">Select Subject</option>
                            {subjects.map(sub => (
                                <option key={sub._id} value={sub._id}>{sub.name} ({sub.batch})</option>
                            ))}
                        </select>
                    </div>

                    {/* Batch (Auto) */}
                    <div className="form-control">
                        <label className="label text-sm font-bold text-base-content/70">Batch</label>
                        <div className="relative">
                            <Users className="absolute left-3 top-3.5 text-base-content/40" size={18} />
                            <input type="text" className="input input-bordered pl-10 w-full bg-base-200 cursor-not-allowed" value={selectedBatch} readOnly />
                        </div>
                    </div>

                    {/* Semester */}
                    <div className="form-control">
                        <label className="label text-sm font-bold text-base-content/70">Semester</label>
                        <div className="relative">
                            <GraduationCap className="absolute left-3 top-3.5 text-base-content/40" size={18} />
                            <select
                                className="select select-bordered pl-10 w-full"
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                disabled={!selectedSubject}
                            >
                                {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="form-control">
                        <label className="label text-sm font-bold text-base-content/70">Date</label>
                        <input
                            type="date"
                            className="input input-bordered w-full"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </div>
            </div>

            {/* Edit Mode Banner */}
            {isEditMode && students.length > 0 && (
                <div className="alert alert-warning shadow-lg">
                    <Edit3 size={18} />
                    <span className="font-medium">Editing previously recorded session — changes will overwrite existing records for this date.</span>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center py-10">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            )}

            {/* Main Content */}
            {!loading && students.length > 0 ? (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Student List */}
                    <div className="flex-1 card bg-base-100 shadow-xl border border-base-200">
                        <div className="card-body p-0">
                            {/* Bulk Actions */}
                            <div className="flex gap-2 p-3 bg-base-200/50 border-b border-base-200">
                                <button className="btn btn-xs btn-success btn-outline" onClick={markAllPresent}>Mark All Present</button>
                                <button className="btn btn-xs btn-error btn-outline" onClick={markAllAbsent}>Mark All Absent</button>
                                <span className="text-xs opacity-50 ml-auto my-auto">{students.length} students</span>
                            </div>
                            <table className="table table-zebra w-full">
                                <thead className="bg-base-200">
                                    <tr>
                                        <th>Reg No</th>
                                        <th>Name</th>
                                        <th className="text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, idx) => (
                                        <tr key={student._id} className="hover">
                                            <td className="font-mono text-sm">{student.registerNo || `S${String(idx + 1).padStart(3, '0')}`}</td>
                                            <td className="font-medium">{student.name}</td>
                                            <td className="flex justify-center gap-2">
                                                <button
                                                    className={`btn btn-sm ${student.status === 'Present' ? 'btn-success text-white' : 'btn-ghost opacity-50'}`}
                                                    onClick={() => handleStatusChange(student._id, 'Present')}
                                                >
                                                    <UserCheck size={16} /> P
                                                </button>
                                                <button
                                                    className={`btn btn-sm ${student.status === 'Absent' ? 'btn-error text-white' : 'btn-ghost opacity-50'}`}
                                                    onClick={() => handleStatusChange(student._id, 'Absent')}
                                                >
                                                    <UserX size={16} /> A
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:w-80 space-y-6">
                        <div className="card bg-base-100 shadow-xl border border-base-200">
                            <div className="card-body">
                                <h3 className="card-title text-sm uppercase text-base-content/50">Session Summary</h3>
                                <div className="space-y-4 my-4">
                                    <div className="flex justify-between items-center">
                                        <span>Present</span>
                                        <span className="badge badge-success badge-lg font-mono">{stats.present}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Absent</span>
                                        <span className="badge badge-error badge-lg font-mono">{stats.absent}</span>
                                    </div>
                                    <div className="divider"></div>
                                    <div className="radial-progress text-primary mx-auto" role="progressbar" style={{ "--value": stats.percentage, "--size": "6rem" }}>
                                        {stats.percentage}%
                                    </div>
                                    <div className="text-center text-xs opacity-60">Batch Attendance %</div>
                                </div>
                                <button
                                    className={`btn btn-primary w-full gap-2 ${saving ? 'loading' : ''}`}
                                    onClick={handleSubmit}
                                    disabled={saving || !canSubmit}
                                >
                                    {!saving && <Save size={18} />} {saving ? 'Saving...' : (isEditMode ? 'Update Attendance' : 'Submit Attendance')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                !loading && (
                    <div className="text-center py-20 opacity-50">
                        <Users size={48} className="mx-auto mb-4" />
                        <p>Select a subject to load students.</p>
                    </div>
                )
            )}
        </div>
    );
};

export default TeacherAttendance;
