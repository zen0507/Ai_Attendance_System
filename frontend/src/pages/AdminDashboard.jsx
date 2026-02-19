import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getSemesterList } from "../utils/semesterHelper";
import {
    getAdminStats, getAcademicHealthFiltered,
    getAllUsers, registerUser, deleteUser, updateUser,
    getAllSubjects, createSubject, deleteSubject, updateSubject,
} from '../api/adminApi';
import { getDepartments, createDepartment, deleteDepartment } from '../api/departmentApi';
import API from '../api/axiosInstance';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import SystemHealthChart from '../components/dashboard/SystemHealthChart';
import {
    Users, GraduationCap, BookOpen, UserPlus, Plus, Trash2, Edit2,
    Save, X, RefreshCw, Search, ChevronLeft, ChevronRight, AlertTriangle,
    BarChart2, Shield, Eye
} from 'lucide-react';

// ─── Flash Message ────────────────────────────────────────────
const FlashMessage = ({ message, onDismiss }) => {
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        if (!message.text) return;
        setVisible(true);
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onDismiss, 400);
        }, 4000);
        return () => clearTimeout(timer);
    }, [message.text, onDismiss]);

    if (!message.text) return null;
    return (
        <div
            className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} transition-all duration-400 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
        >
            <span>{message.text}</span>
            <button onClick={onDismiss} className="btn btn-sm btn-ghost">Dismiss</button>
        </div>
    );
};

// ─── Delete Confirmation Modal ────────────────────────────────
const DeleteModal = ({ item, onConfirm, onCancel }) => {
    if (!item) return null;
    return (
        <dialog id="delete_modal" className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <AlertTriangle className="text-error" size={20} />
                    Confirm Deletion
                </h3>
                <p className="py-4">
                    Are you sure you want to delete <strong>{item.name}</strong>?
                    This action cannot be undone.
                </p>
                <div className="modal-action">
                    <button className="btn" onClick={onCancel}>Cancel</button>
                    <button className="btn btn-error" onClick={onConfirm}>Delete</button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onCancel}><button className="cursor-default">close</button></div>
        </dialog>
    );
};

// ─── Teacher Profile Modal ───────────────────────────────────
const TeacherProfileModal = ({ teacher, workload, onClose }) => {
    if (!teacher) return null;
    return (
        <dialog className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg">{teacher.name}</h3>
                <div className="py-4 space-y-2 text-sm">
                    <p><strong>Email:</strong> {teacher.email}</p>
                    <p><strong>Department:</strong> {teacher.department || 'N/A'}</p>
                    <p><strong>Courses Assigned:</strong>
                        <span className="badge badge-primary ml-2">{workload}</span>
                    </p>
                </div>
                <div className="modal-action">
                    <button className="btn" onClick={onClose}>Close</button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose}><button className="cursor-default">close</button></div>
        </dialog>
    );
};

// ─── Student Detail Modal (Marks + Attendance) ───────────────
const StudentDetailModal = ({ student, onClose }) => {
    const [marks, setMarks] = useState([]);
    const [attendance, setAttendance] = useState(null);
    const [detailLoading, setDetailLoading] = useState(true);
    const [activeDetailTab, setActiveDetailTab] = useState('marks');

    useEffect(() => {
        if (!student) return;
        const fetchDetails = async () => {
            setDetailLoading(true);
            try {
                const [marksRes, attRes] = await Promise.all([
                    API.get(`/marks/${student._id}`),
                    API.get(`/attendance/percentage/${student._id}`),
                ]);
                setMarks(marksRes.data?.data || []);
                setAttendance(attRes.data?.data || null);
            } catch (err) {
                console.error('Error loading student details:', err);
            } finally {
                setDetailLoading(false);
            }
        };
        fetchDetails();
    }, [student]);

    if (!student) return null;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-2xl">
                <h3 className="font-bold text-lg flex items-center gap-2 mb-1">
                    <GraduationCap size={20} className="text-primary" />
                    {student.name}
                </h3>
                <p className="text-sm text-base-content/60 mb-4">
                    {student.email} • {student.department || 'N/A'} • Batch: {student.batch || 'N/A'} • Sem: {student.semester || 'N/A'}
                </p>

                {/* Sub-tabs */}
                <div role="tablist" className="tabs tabs-boxed tabs-sm mb-4">
                    <a role="tab" className={`tab ${activeDetailTab === 'marks' ? 'tab-active' : ''}`}
                        onClick={() => setActiveDetailTab('marks')}>Internal Marks</a>
                    <a role="tab" className={`tab ${activeDetailTab === 'attendance' ? 'tab-active' : ''}`}
                        onClick={() => setActiveDetailTab('attendance')}>Attendance</a>
                </div>

                {detailLoading ? (
                    <div className="flex justify-center py-8">
                        <span className="loading loading-spinner loading-md"></span>
                    </div>
                ) : (
                    <>
                        {/* Marks Tab */}
                        {activeDetailTab === 'marks' && (
                            marks.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="table table-xs table-zebra">
                                        <thead>
                                            <tr>
                                                <th>Subject</th>
                                                <th className="text-center">Test 1</th>
                                                <th className="text-center">Test 2</th>
                                                <th className="text-center">Assignment</th>
                                                <th className="text-center">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {marks.map((m, i) => (
                                                <tr key={i}>
                                                    <td className="font-medium">{m.subjectId?.name || 'Unknown'}</td>
                                                    <td className="text-center">{m.test1 ?? '—'}</td>
                                                    <td className="text-center">{m.test2 ?? '—'}</td>
                                                    <td className="text-center">{m.assignment ?? '—'}</td>
                                                    <td className="text-center">
                                                        <span className={`badge badge-sm ${m.total >= 20 ? 'badge-success' : 'badge-error'}`}>
                                                            {m.total?.toFixed(1) ?? '—'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="mt-3 text-xs text-base-content/50 text-right">
                                        Avg: {(marks.reduce((s, m) => s + (m.total || 0), 0) / marks.length).toFixed(1)}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-base-content/40">
                                    <p>No marks recorded yet.</p>
                                </div>
                            )
                        )}

                        {/* Attendance Tab */}
                        {activeDetailTab === 'attendance' && (
                            attendance ? (
                                <div className="space-y-4">
                                    {/* Overall summary */}
                                    <div className="stats stats-horizontal shadow w-full bg-base-200">
                                        <div className="stat py-3">
                                            <div className="stat-title text-xs">Overall</div>
                                            <div className={`stat-value text-lg ${(attendance.overallPercentage || 0) >= 75 ? 'text-success' : 'text-error'
                                                }`}>
                                                {attendance.overallPercentage?.toFixed(1) || '0.0'}%
                                            </div>
                                        </div>
                                        <div className="stat py-3">
                                            <div className="stat-title text-xs">Present</div>
                                            <div className="stat-value text-lg text-success">{attendance.totalPresent || 0}</div>
                                        </div>
                                        <div className="stat py-3">
                                            <div className="stat-title text-xs">Absent</div>
                                            <div className="stat-value text-lg text-error">{attendance.totalAbsent || 0}</div>
                                        </div>
                                        <div className="stat py-3">
                                            <div className="stat-title text-xs">Total Hrs</div>
                                            <div className="stat-value text-lg">{attendance.totalHours || 0}</div>
                                        </div>
                                    </div>

                                    {/* Per-subject breakdown */}
                                    {attendance.subjects && attendance.subjects.length > 0 && (
                                        <div className="overflow-x-auto">
                                            <table className="table table-xs table-zebra">
                                                <thead>
                                                    <tr>
                                                        <th>Subject</th>
                                                        <th className="text-center">Present</th>
                                                        <th className="text-center">Absent</th>
                                                        <th className="text-center">%</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {attendance.subjects.map((s, i) => (
                                                        <tr key={i}>
                                                            <td className="font-medium">{s.subjectName || 'Unknown'}</td>
                                                            <td className="text-center text-success">{s.present || 0}</td>
                                                            <td className="text-center text-error">{s.absent || 0}</td>
                                                            <td className="text-center">
                                                                <span className={`badge badge-sm ${(s.percentage || 0) >= 75 ? 'badge-success' : 'badge-error'}`}>
                                                                    {s.percentage?.toFixed(1) || '0.0'}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-base-content/40">
                                    <p>No attendance records found.</p>
                                </div>
                            )
                        )}
                    </>
                )}

                <div className="modal-action">
                    <button className="btn" onClick={onClose}>Close</button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose}><button className="cursor-default">close</button></div>
        </dialog>
    );
};

// ─── Edit Student Modal ──────────────────────────────────────
const EditStudentModal = ({ student, allDepartments, uniqueBatches, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        department: '',
        batch: '',
        semester: '',
        password: '' // Optional new password
    });

    useEffect(() => {
        if (student) {
            setFormData({
                name: student.name || '',
                email: student.email || '',
                department: student.department || '',
                batch: student.batch || '',
                semester: student.semester || '',
                password: ''
            });
        }
    }, [student]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate(student._id, formData);
    };

    if (!student) return null;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">Edit Student: {student.name}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label text-xs">Name</label>
                        <input name="name" className="input input-sm input-bordered w-full" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-control">
                        <label className="label text-xs">Email</label>
                        <input name="email" type="email" className="input input-sm input-bordered w-full" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label text-xs">Department</label>
                            <select name="department" className="select select-sm select-bordered w-full" value={formData.department} onChange={handleChange} required>
                                <option value="">Select Dept</option>
                                {allDepartments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label text-xs">Batch</label>
                            <input name="batch" className="input input-sm input-bordered w-full" value={formData.batch} onChange={handleChange} placeholder="Batch" list="batch-options" required />
                        </div>
                    </div>
                    <div className="form-control">
                        <label className="label text-xs">Semester</label>
                        <select name="semester" className="select select-sm select-bordered w-full" value={formData.semester} onChange={handleChange} required>
                            {getSemesterList(formData.batch).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="divider text-xs">Security</div>

                    <div className="form-control">
                        <label className="label text-xs font-bold text-warning">New Password (leave blank to keep current)</label>
                        <input name="password" type="password" className="input input-sm input-bordered w-full border-warning" value={formData.password} onChange={handleChange} placeholder="Enter new password to reset" />
                    </div>

                    <div className="modal-action">
                        <button type="button" className="btn btn-sm" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-sm btn-primary">Update Student</button>
                    </div>
                </form>
            </div>
            <div className="modal-backdrop" onClick={onClose}><button className="cursor-default">close</button></div>
        </dialog>
    );
};

// ─── Pagination Controls ─────────────────────────────────────
const Pagination = ({ page, pages, onPageChange }) => {
    if (pages <= 1) return null;
    return (
        <div className="flex justify-center items-center gap-2 mt-4">
            <button className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                <ChevronLeft size={16} /> Prev
            </button>
            <span className="text-sm text-base-content/60">
                Page {page} of {pages}
            </span>
            <button className="btn btn-sm btn-ghost" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
                Next <ChevronRight size={16} />
            </button>
        </div>
    );
};

// ─── Loading Skeleton ────────────────────────────────────────
const TableSkeleton = ({ cols = 4, rows = 5 }) => (
    <table className="table">
        <tbody>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j}><div className="skeleton h-4 w-full"></div></td>
                    ))}
                </tr>
            ))}
        </tbody>
    </table>
);

// ─── Empty State ─────────────────────────────────────────────
const EmptyState = ({ message }) => (
    <div className="text-center py-12 text-base-content/40">
        <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
        <p>{message}</p>
    </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const AdminDashboard = () => {
    // --- Global State ---
    const [activeTab, setActiveTab] = useState('overview');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [sortDepartment, setSortDepartment] = useState('All');
    const [allDepartments, setAllDepartments] = useState([]);
    const [newDeptName, setNewDeptName] = useState('');

    // --- Overview Stats ---
    const [stats, setStats] = useState(null);

    // --- Teachers Tab ---
    const [teachers, setTeachers] = useState([]);
    const [teacherPage, setTeacherPage] = useState(1);
    const [teacherPages, setTeacherPages] = useState(1);
    const [teacherTotal, setTeacherTotal] = useState(0);
    const [teacherSearch, setTeacherSearch] = useState('');

    // --- Students Tab ---
    const [students, setStudents] = useState([]);
    const [studentPage, setStudentPage] = useState(1);
    const [studentPages, setStudentPages] = useState(1);
    const [studentTotal, setStudentTotal] = useState(0);
    const [studentSearch, setStudentSearch] = useState('');
    const [studentBatchFilter, setStudentBatchFilter] = useState('');
    const [studentSemFilter, setStudentSemFilter] = useState('');

    // --- Courses Tab ---
    const [courses, setCourses] = useState([]);
    const [coursePage, setCoursePage] = useState(1);
    const [coursePages, setCoursePages] = useState(1);
    const [courseTotal, setCourseTotal] = useState(0);
    const [courseSearch, setCourseSearch] = useState('');
    const [courseSemFilter, setCourseSemFilter] = useState('');

    // --- Edit / Create forms ---
    const [editingUser, setEditingUser] = useState(null);
    const [editStudentData, setEditStudentData] = useState(null); // For modal editing
    const [editingSubject, setEditingSubject] = useState(null);
    const [newTeacher, setNewTeacher] = useState({ name: '', email: '', password: '', department: '' });
    const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '', batch: '', semester: 'S1', department: '', startDate: '', endDate: '' });
    const [newSubject, setNewSubject] = useState({ name: '', teacherId: '', department: '', startDate: '', semester: 'S1', batch: '' });

    // --- Delete Confirmation ---
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, name, type: 'user' | 'subject' | 'department' }

    // --- Teacher Profile Modal ---
    const [profileTeacher, setProfileTeacher] = useState(null);
    const [profileWorkload, setProfileWorkload] = useState(0);

    // --- Student Detail Modal ---
    const [detailStudent, setDetailStudent] = useState(null);

    // --- Tab loading states ---
    const [tabLoading, setTabLoading] = useState(false);

    // Debounce ref for search
    const searchTimerRef = useRef(null);

    // ─── Department list (for dropdowns) ────────────────────
    const departments = allDepartments.map(d => d.name).sort();

    // ─── FETCH: Overview Stats ──────────────────────────────
    const fetchStats = useCallback(async () => {
        try {
            const data = await getAdminStats({ department: sortDepartment });
            setStats(data);
        } catch (err) {
            console.error('Stats fetch failed', err);
        }
    }, [sortDepartment]);

    // ─── FETCH: Teachers (paginated) ────────────────────────
    const fetchTeachers = useCallback(async () => {
        setTabLoading(true);
        try {
            const data = await getAllUsers({
                role: 'teacher', page: teacherPage, limit: 10,
                search: teacherSearch || undefined,
                department: sortDepartment !== 'All' ? sortDepartment : undefined,
            });
            if (data.users) {
                setTeachers(data.users);
                setTeacherPages(data.pages);
                setTeacherTotal(data.total);
            } else {
                // Backward-compat: non-paginated response
                const t = (data || []).filter(u => u.role === 'teacher');
                setTeachers(t);
                setTeacherPages(1);
                setTeacherTotal(t.length);
            }
        } catch (err) { console.error(err); }
        finally { setTabLoading(false); }
    }, [teacherPage, teacherSearch, sortDepartment]);

    // ─── FETCH: Students (paginated) ────────────────────────
    const fetchStudents = useCallback(async () => {
        setTabLoading(true);
        try {
            const data = await getAllUsers({
                role: 'student', page: studentPage, limit: 10,
                search: studentSearch || undefined,
                department: sortDepartment !== 'All' ? sortDepartment : undefined,
                batch: studentBatchFilter || undefined,
                semester: studentSemFilter || undefined,
            });
            if (data.users) {
                setStudents(data.users);
                setStudentPages(data.pages);
                setStudentTotal(data.total);
            } else {
                const s = (data || []).filter(u => u.role === 'student');
                setStudents(s);
                setStudentPages(1);
                setStudentTotal(s.length);
            }
        } catch (err) { console.error(err); }
        finally { setTabLoading(false); }
    }, [studentPage, studentSearch, sortDepartment, studentBatchFilter, studentSemFilter]);

    // ─── FETCH: Courses (paginated) ─────────────────────────
    const fetchCourses = useCallback(async () => {
        setTabLoading(true);
        try {
            const data = await getAllSubjects({
                page: coursePage, limit: 10,
                search: courseSearch || undefined,
                department: sortDepartment !== 'All' ? sortDepartment : undefined,
                semester: courseSemFilter || undefined,
            });
            if (data.subjects) {
                setCourses(data.subjects);
                setCoursePages(data.pages);
                setCourseTotal(data.total);
            } else {
                setCourses(data || []);
                setCoursePages(1);
                setCourseTotal((data || []).length);
            }
        } catch (err) { console.error(err); }
        finally { setTabLoading(false); }
    }, [coursePage, courseSearch, sortDepartment, courseSemFilter]);

    // ─── FETCH: Departments ─────────────────────────────────
    const fetchDepartments = useCallback(async () => {
        try {
            const d = await getDepartments();
            setAllDepartments(d || []);
        } catch (err) { console.error(err); }
    }, []);

    // ─── Initial Load ───────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchDepartments(), fetchStats()]);
            setLoading(false);
        };
        init();
    }, []); // eslint-disable-line

    // Re-fetch stats when department filter changes
    useEffect(() => { fetchStats(); }, [fetchStats]);

    // Fetch tab data when switching tabs or filters change
    useEffect(() => {
        if (activeTab === 'teachers') fetchTeachers();
        if (activeTab === 'students') fetchStudents();
        if (activeTab === 'subjects') fetchCourses();
    }, [activeTab, fetchTeachers, fetchStudents, fetchCourses]);

    // ─── Debounced search handlers ──────────────────────────
    const handleSearchChange = (setter, pageSetter) => (e) => {
        const val = e.target.value;
        setter(val);
        pageSetter(1);
    };

    // ─── CRUD Handlers ──────────────────────────────────────
    const flashSuccess = (msg) => {
        setMessage({ text: msg, type: 'success' });
        setRefreshKey(k => k + 1);
        fetchStats();
        fetchDepartments();
        if (activeTab === 'teachers') fetchTeachers();
        if (activeTab === 'students') fetchStudents();
        if (activeTab === 'subjects') fetchCourses();
    };

    const flashError = (error, defaultMsg) => {
        setMessage({ text: error.response?.data?.message || error.message || defaultMsg, type: 'error' });
    };

    const handleCreateTeacher = async (e) => {
        e.preventDefault();
        try {
            await registerUser({ ...newTeacher, role: 'teacher' });
            setNewTeacher({ name: '', email: '', password: '', department: '' });
            document.getElementById('teacher_modal')?.close();
            flashSuccess('Teacher created successfully');
        } catch (error) { flashError(error, 'Error creating teacher'); }
    };

    const handleCreateStudent = async (e) => {
        e.preventDefault();
        try {
            await registerUser({ ...newStudent, role: 'student' });
            setNewStudent({ name: '', email: '', password: '', batch: '', semester: 'S1', department: '', startDate: '', endDate: '' });
            document.getElementById('student_modal')?.close();
            flashSuccess('Student created successfully');
        } catch (error) { flashError(error, 'Error creating student'); }
    };

    const handleCreateSubject = async (e) => {
        e.preventDefault();
        try {
            await createSubject(newSubject);
            setNewSubject({ name: '', teacherId: '', department: '', startDate: '', semester: 'S1', batch: '' });
            document.getElementById('subject_modal')?.close();
            flashSuccess('Course created successfully');
        } catch (error) { flashError(error, 'Error creating course'); }
    };

    const handleCreateDepartment = async (e) => {
        e.preventDefault();
        try {
            await createDepartment({ name: newDeptName });
            setNewDeptName('');
            flashSuccess('Department added successfully');
        } catch (error) { flashError(error, 'Error adding department'); }
    };

    // Delete (via modal)
    const requestDelete = (id, name, type) => setDeleteTarget({ id, name, type });
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            if (deleteTarget.type === 'user') await deleteUser(deleteTarget.id);
            else if (deleteTarget.type === 'subject') await deleteSubject(deleteTarget.id);
            else if (deleteTarget.type === 'department') await deleteDepartment(deleteTarget.id);
            setDeleteTarget(null);
            flashSuccess(`${deleteTarget.name} deleted successfully`);
        } catch (error) { flashError(error, 'Delete failed'); setDeleteTarget(null); }
    };

    const handleUpdateUser = async () => {
        try {
            await updateUser(editingUser._id, editingUser);
            setEditingUser(null);
            flashSuccess('User updated successfully');
        } catch (error) { flashError(error, 'Error updating user'); }
    };

    const handleUpdateStudentSubmit = async (id, formData) => {
        try {
            // Clean up empty password if not provided
            const dataToSend = { ...formData };
            if (!dataToSend.password) delete dataToSend.password;

            await updateUser(id, dataToSend);
            setEditStudentData(null);
            flashSuccess('Student updated successfully');
        } catch (error) { flashError(error, 'Error updating student'); }
    };

    const handleUpdateSubject = async () => {
        try {
            await updateSubject(editingSubject._id, editingSubject);
            setEditingSubject(null);
            flashSuccess('Course updated successfully');
        } catch (error) { flashError(error, 'Error updating course'); }
    };

    // Refresh all
    const handleRefresh = async () => {
        setLoading(true);
        await Promise.all([fetchDepartments(), fetchStats()]);
        if (activeTab === 'teachers') await fetchTeachers();
        if (activeTab === 'students') await fetchStudents();
        if (activeTab === 'subjects') await fetchCourses();
        setRefreshKey(k => k + 1);
        setLoading(false);
    };

    // Teacher profile
    const openTeacherProfile = (teacher, workload) => {
        setProfileTeacher(teacher);
        setProfileWorkload(workload);
    };

    // Get all teachers for course teacher assignment (from stats)
    const allTeachers = stats?.courseInsights
        ? [...new Map(stats.courseInsights.filter(c => c.teacher).map(c => [c.teacher._id, c.teacher])).values()]
        : [];

    // Unique values from stats
    const uniqueBatches = stats?.uniqueBatches || [];
    const uniqueSemesters = stats?.uniqueSemesters || [];

    if (loading) return (
        <div className="flex justify-center items-center p-20">
            <span className="loading loading-spinner loading-lg"></span>
        </div>
    );

    return (
        <div className="space-y-6 fade-in">
            {/* Batch autocomplete datalist */}
            <datalist id="batch-options">
                {uniqueBatches.map(b => <option key={b} value={b} />)}
            </datalist>

            {/* ─── Header ─────────────────────────────────────── */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-base-content/60">System overview and management.</p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <button className="btn btn-ghost btn-sm btn-square" title="Refresh" onClick={handleRefresh}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <select
                        className="select select-bordered select-sm"
                        value={sortDepartment}
                        onChange={(e) => { setSortDepartment(e.target.value); setTeacherPage(1); setStudentPage(1); setCoursePage(1); }}
                    >
                        <option value="All">All Departments</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <div className="flex gap-2">
                        <button className="btn btn-primary btn-sm" onClick={() => document.getElementById('student_modal').showModal()}>
                            <UserPlus size={16} /> Add Student
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => document.getElementById('teacher_modal').showModal()}>
                            <UserPlus size={16} /> Add Teacher
                        </button>
                        <button className="btn btn-accent btn-sm" onClick={() => document.getElementById('subject_modal').showModal()}>
                            <Plus size={16} /> Add Course
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Flash Message ───────────────────────────────── */}
            <FlashMessage message={message} onDismiss={() => setMessage({ text: '', type: '' })} />

            {/* ─── Tabs ────────────────────────────────────────── */}
            <div role="tablist" className="tabs tabs-boxed">
                {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'teachers', label: 'Manage Teachers' },
                    { key: 'students', label: 'Manage Students' },
                    { key: 'subjects', label: 'Manage Courses' },
                ].map(t => (
                    <a key={t.key} role="tab" className={`tab ${activeTab === t.key ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab(t.key)}>{t.label}</a>
                ))}
            </div>

            {/* ═══ OVERVIEW TAB ════════════════════════════════ */}
            {activeTab === 'overview' && (
                <>
                    {/* Stats Cards */}
                    <div className="stats shadow w-full bg-base-100">
                        <div className="stat">
                            <div className="stat-figure text-primary"><GraduationCap size={32} /></div>
                            <div className="stat-title">Total Students</div>
                            <div className="stat-value text-primary">{stats?.counts?.students ?? 0}</div>
                            <div className="stat-desc">{sortDepartment === 'All' ? 'Registered in system' : `In ${sortDepartment}`}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-figure text-secondary"><Users size={32} /></div>
                            <div className="stat-title">Total Teachers</div>
                            <div className="stat-value text-secondary">{stats?.counts?.teachers ?? 0}</div>
                            <div className="stat-desc">{sortDepartment === 'All' ? 'Active faculty' : `In ${sortDepartment}`}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-figure text-accent"><BookOpen size={32} /></div>
                            <div className="stat-title">Total Courses</div>
                            <div className="stat-value text-accent">{stats?.counts?.courses ?? 0}</div>
                            <div className="stat-desc">{sortDepartment === 'All' ? 'Courses offered' : `In ${sortDepartment}`}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Academic Health Chart */}
                            <SystemHealthChart department={sortDepartment} refreshKey={refreshKey} />

                            {/* Relational Insights: Course Details */}
                            {stats?.courseInsights && stats.courseInsights.length > 0 && (
                                <div className="card bg-base-100 shadow-xl">
                                    <div className="card-body">
                                        <h3 className="card-title text-sm font-bold flex items-center gap-2 mb-3">
                                            <BarChart2 size={16} className="text-primary" /> Course Insights
                                        </h3>
                                        <div className="overflow-x-auto">
                                            <table className="table table-xs table-zebra">
                                                <thead>
                                                    <tr>
                                                        <th>Course</th>
                                                        <th>Students</th>
                                                        <th>Avg Marks</th>
                                                        <th>Pass Rate</th>
                                                        <th>Attendance</th>
                                                        <th>Teacher</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {stats.courseInsights.map(c => (
                                                        <tr key={c._id}>
                                                            <td className="font-medium">{c.name}</td>
                                                            <td>{c.enrolledStudents}</td>
                                                            <td>{c.avgMarks}</td>
                                                            <td>
                                                                <span className={`badge badge-sm ${c.passRate >= 70 ? 'badge-success' : c.passRate >= 40 ? 'badge-warning' : 'badge-error'}`}>
                                                                    {c.passRate}%
                                                                </span>
                                                            </td>
                                                            <td>{c.totalSessions > 0 ? `${c.attendanceRate}%` : '—'}</td>
                                                            <td>
                                                                {c.teacher ? (
                                                                    <button
                                                                        className="badge badge-outline badge-sm cursor-pointer hover:badge-primary transition-colors"
                                                                        onClick={() => openTeacherProfile(c.teacher, c.teacher.workload)}
                                                                    >
                                                                        {c.teacher.name}
                                                                    </button>
                                                                ) : <span className="text-base-content/40 italic text-xs">Unassigned</span>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="lg:col-span-1 space-y-6">
                            {/* Department Management */}
                            <div className="card bg-base-100 shadow-xl border border-primary/10">
                                <div className="card-body p-6">
                                    <h3 className="card-title text-sm font-bold flex items-center gap-2 mb-4">
                                        <Shield size={16} className="text-primary" /> Manage Departments
                                    </h3>
                                    <form onSubmit={handleCreateDepartment} className="flex gap-2 mb-4">
                                        <input className="input input-sm input-bordered flex-1" placeholder="New Dept Name"
                                            value={newDeptName} onChange={e => setNewDeptName(e.target.value)} required />
                                        <button className="btn btn-sm btn-primary btn-square"><Plus size={16} /></button>
                                    </form>
                                    <div className="max-h-[200px] overflow-y-auto space-y-2">
                                        {allDepartments.map(dept => (
                                            <div key={dept._id} className="flex justify-between items-center bg-base-200 p-2 rounded-lg group">
                                                <span className="text-xs font-medium">{dept.name}</span>
                                                <button className="btn btn-xs btn-error btn-ghost btn-square opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => requestDelete(dept._id, dept.name, 'department')}>
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Teacher Workload Summary */}
                            {stats?.teacherWorkload && stats.teacherWorkload.length > 0 && (
                                <div className="card bg-base-100 shadow-xl border border-secondary/10">
                                    <div className="card-body p-6">
                                        <h3 className="card-title text-sm font-bold flex items-center gap-2 mb-4">
                                            <Users size={16} className="text-secondary" /> Teacher Workload
                                        </h3>
                                        <div className="space-y-2">
                                            {stats.teacherWorkload.map((tw, i) => (
                                                <div key={i} className="flex justify-between items-center text-sm">
                                                    <span>{tw.name}</span>
                                                    <span className="badge badge-ghost badge-sm">{tw.courseCount} courses</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <ActivityFeed />
                        </div>
                    </div>
                </>
            )}

            {/* ═══ TEACHERS TAB ════════════════════════════════ */}
            {activeTab === 'teachers' && (
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                            <h2 className="card-title">Manage Teachers {sortDepartment !== 'All' && `(${sortDepartment})`}
                                <span className="badge badge-ghost badge-sm ml-2">{teacherTotal} total</span>
                            </h2>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                                    <input className="input input-sm input-bordered pl-9 w-56" placeholder="Search by name/email..."
                                        value={teacherSearch} onChange={handleSearchChange(setTeacherSearch, setTeacherPage)} />
                                </div>
                            </div>
                        </div>
                        {tabLoading ? <TableSkeleton cols={4} /> : teachers.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra table-pin-rows">
                                    <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {teachers.map(teacher => (
                                            <tr key={teacher._id}>
                                                <td>{editingUser?._id === teacher._id ?
                                                    <input className="input input-sm input-bordered" value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} />
                                                    : teacher.name}</td>
                                                <td>{editingUser?._id === teacher._id ?
                                                    <input className="input input-sm input-bordered" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} />
                                                    : teacher.email}</td>
                                                <td>{editingUser?._id === teacher._id ?
                                                    <select className="select select-sm select-bordered w-full" value={editingUser.department || ''}
                                                        onChange={e => setEditingUser({ ...editingUser, department: e.target.value })}>
                                                        <option value="">Select Dept</option>
                                                        {allDepartments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                                                    </select>
                                                    : teacher.department || '—'}</td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        {editingUser?._id === teacher._id ? (<>
                                                            <button className="btn btn-sm btn-success btn-square" onClick={handleUpdateUser}><Save size={16} /></button>
                                                            <button className="btn btn-sm btn-ghost btn-square" onClick={() => setEditingUser(null)}><X size={16} /></button>
                                                        </>) : (<>
                                                            <button className="btn btn-sm btn-primary btn-square" onClick={() => setEditingUser(teacher)}><Edit2 size={16} /></button>
                                                            <button className="btn btn-sm btn-error btn-square" onClick={() => requestDelete(teacher._id, teacher.name, 'user')}><Trash2 size={16} /></button>
                                                        </>)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <EmptyState message="No teachers found." />}
                        <Pagination page={teacherPage} pages={teacherPages} onPageChange={setTeacherPage} />
                    </div>
                </div>
            )}

            {/* ═══ STUDENTS TAB ════════════════════════════════ */}
            {activeTab === 'students' && (
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                            <h2 className="card-title">Manage Students {sortDepartment !== 'All' && `(${sortDepartment})`}
                                <span className="badge badge-ghost badge-sm ml-2">{studentTotal} total</span>
                            </h2>
                            <div className="flex gap-2 flex-wrap">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                                    <input className="input input-sm input-bordered pl-9 w-48" placeholder="Search..."
                                        value={studentSearch} onChange={handleSearchChange(setStudentSearch, setStudentPage)} />
                                </div>
                                <select className="select select-sm select-bordered" value={studentBatchFilter}
                                    onChange={e => { setStudentBatchFilter(e.target.value); setStudentPage(1); }}>
                                    <option value="">All Batches</option>
                                    {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                                <select className="select select-sm select-bordered" value={studentSemFilter}
                                    onChange={e => { setStudentSemFilter(e.target.value); setStudentPage(1); }}>
                                    <option value="">All Semesters</option>
                                    {uniqueSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        {tabLoading ? <TableSkeleton cols={6} /> : students.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra table-pin-rows">
                                    <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Batch</th><th>Semester</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {students.map(student => (
                                            <tr key={student._id}>
                                                <td>{student.name}</td>
                                                <td>{student.email}</td>
                                                <td>{student.department || '—'}</td>
                                                <td>{student.batch || '—'}</td>
                                                <td><div className="badge badge-ghost badge-sm">{student.semester || 'N/A'}</div></td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button className="btn btn-sm btn-info btn-square" title="View Marks & Attendance" onClick={() => setDetailStudent(student)}><Eye size={16} /></button>
                                                        <button className="btn btn-sm btn-primary btn-square" title="Edit Student" onClick={() => setEditStudentData(student)}><Edit2 size={16} /></button>
                                                        <button className="btn btn-sm btn-error btn-square" title="Delete Student" onClick={() => requestDelete(student._id, student.name, 'user')}><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <EmptyState message="No students found." />}
                        <Pagination page={studentPage} pages={studentPages} onPageChange={setStudentPage} />
                    </div>
                </div>
            )}

            {/* ═══ COURSES TAB ═════════════════════════════════ */}
            {activeTab === 'subjects' && (
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                            <h2 className="card-title">Manage Courses {sortDepartment !== 'All' && `(${sortDepartment})`}
                                <span className="badge badge-ghost badge-sm ml-2">{courseTotal} total</span>
                            </h2>
                            <div className="flex gap-2 flex-wrap">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                                    <input className="input input-sm input-bordered pl-9 w-48" placeholder="Search courses..."
                                        value={courseSearch} onChange={handleSearchChange(setCourseSearch, setCoursePage)} />
                                </div>
                                <select className="select select-sm select-bordered" value={courseSemFilter}
                                    onChange={e => { setCourseSemFilter(e.target.value); setCoursePage(1); }}>
                                    <option value="">All Semesters</option>
                                    {uniqueSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        {tabLoading ? <TableSkeleton cols={6} /> : courses.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra table-pin-rows">
                                    <thead><tr><th>Course Name</th><th>Department</th><th>Semester</th><th>Batch</th><th>Assigned Teacher</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {courses.map(subject => (
                                            <tr key={subject._id}>
                                                <td>{editingSubject?._id === subject._id ?
                                                    <input className="input input-sm input-bordered" value={editingSubject.name} onChange={e => setEditingSubject({ ...editingSubject, name: e.target.value })} />
                                                    : subject.name}</td>
                                                <td>{editingSubject?._id === subject._id ?
                                                    <select className="select select-sm select-bordered w-full" value={editingSubject.department || ''}
                                                        onChange={e => setEditingSubject({ ...editingSubject, department: e.target.value })}>
                                                        <option value="">Select Dept</option>
                                                        {allDepartments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                                                    </select>
                                                    : subject.department || '—'}</td>
                                                <td>{editingSubject?._id === subject._id ?
                                                    <select className="select select-sm select-bordered w-full" value={editingSubject.semester || 'S1'}
                                                        onChange={e => setEditingSubject({ ...editingSubject, semester: e.target.value })}>
                                                        {getSemesterList(editingSubject.batch).map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                    : <span className="badge badge-ghost">{subject.semester || 'S1'}</span>}</td>
                                                <td>{editingSubject?._id === subject._id ?
                                                    <input className="input input-sm input-bordered w-full" value={editingSubject.batch || ''}
                                                        onChange={e => setEditingSubject({ ...editingSubject, batch: e.target.value })} placeholder="Batch" list="batch-options" />
                                                    : subject.batch || '—'}</td>
                                                <td>{editingSubject?._id === subject._id ? (
                                                    <select className="select select-sm select-bordered" value={editingSubject.teacherId || ''}
                                                        onChange={e => setEditingSubject({ ...editingSubject, teacherId: e.target.value })}>
                                                        <option value="">No Teacher Assigned</option>
                                                        {allTeachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                                    </select>
                                                ) : subject.teacherId ? (
                                                    <button className="badge badge-outline badge-sm cursor-pointer hover:badge-primary transition-colors"
                                                        onClick={() => openTeacherProfile(
                                                            { name: subject.teacherId.name, email: subject.teacherId.email, department: subject.department },
                                                            subject.teacherWorkload || 0
                                                        )}>
                                                        {subject.teacherId.name}
                                                        <span className="ml-1 badge badge-primary badge-xs">{subject.teacherWorkload || 0}</span>
                                                    </button>
                                                ) : <span className="text-base-content/40 italic">Unassigned</span>}</td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        {editingSubject?._id === subject._id ? (<>
                                                            <button className="btn btn-sm btn-success btn-square" onClick={handleUpdateSubject}><Save size={16} /></button>
                                                            <button className="btn btn-sm btn-ghost btn-square" onClick={() => setEditingSubject(null)}><X size={16} /></button>
                                                        </>) : (<>
                                                            <button className="btn btn-sm btn-primary btn-square" onClick={() => setEditingSubject({ ...subject, teacherId: subject.teacherId?._id || '' })}><Edit2 size={16} /></button>
                                                            <button className="btn btn-sm btn-error btn-square" onClick={() => requestDelete(subject._id, subject.name, 'subject')}><Trash2 size={16} /></button>
                                                        </>)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <EmptyState message="No courses found." />}
                        <Pagination page={coursePage} pages={coursePages} onPageChange={setCoursePage} />
                    </div>
                </div>
            )}

            {/* ═══ MODALS ══════════════════════════════════════ */}
            <DeleteModal item={deleteTarget} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
            <TeacherProfileModal teacher={profileTeacher} workload={profileWorkload} onClose={() => setProfileTeacher(null)} />
            <StudentDetailModal student={detailStudent} onClose={() => setDetailStudent(null)} />
            <EditStudentModal student={editStudentData} allDepartments={allDepartments} uniqueBatches={uniqueBatches} onClose={() => setEditStudentData(null)} onUpdate={handleUpdateStudentSubmit} />

            {/* Teacher Create Modal */}
            <dialog id="teacher_modal" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">Add New Teacher</h3>
                    <form id="teacher-form" onSubmit={handleCreateTeacher} className="space-y-4">
                        <input className="input input-bordered w-full" placeholder="Name" value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })} required />
                        <input className="input input-bordered w-full" type="email" placeholder="Email" value={newTeacher.email} onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })} required />
                        <select className="select select-bordered w-full" value={newTeacher.department} onChange={e => setNewTeacher({ ...newTeacher, department: e.target.value })} required>
                            <option value="">Select Department</option>
                            {allDepartments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                        </select>
                        <input className="input input-bordered w-full" type="password" placeholder="Password" value={newTeacher.password} onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })} required />
                    </form>
                    <div className="modal-action">
                        <form method="dialog"><button className="btn">Cancel</button></form>
                        <button type="submit" form="teacher-form" className="btn btn-primary">Create Teacher</button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop"><button>close</button></form>
            </dialog>

            {/* Student Create Modal */}
            <dialog id="student_modal" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">Add New Student</h3>
                    <form id="student-form" onSubmit={handleCreateStudent} className="space-y-4">
                        <input className="input input-bordered w-full" placeholder="Name" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} required />
                        <input className="input input-bordered w-full" type="email" placeholder="Email" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} required />
                        <div className="grid grid-cols-2 gap-4">
                            <input className="input input-bordered w-full" placeholder="Batch (e.g., 2024-28)" value={newStudent.batch} onChange={e => setNewStudent({ ...newStudent, batch: e.target.value })} required list="batch-options" />
                            <select className="select select-bordered w-full" value={newStudent.semester} onChange={e => setNewStudent({ ...newStudent, semester: e.target.value })} required>
                                {getSemesterList(newStudent.batch).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <select className="select select-bordered w-full" value={newStudent.department} onChange={e => setNewStudent({ ...newStudent, department: e.target.value })} required>
                            <option value="">Select Department</option>
                            {allDepartments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label text-xs">Start Date</label>
                                <input type="date" className="input input-bordered w-full" value={newStudent.startDate} onChange={e => setNewStudent({ ...newStudent, startDate: e.target.value })} required />
                            </div>
                            <div className="form-control">
                                <label className="label text-xs">End Date</label>
                                <input type="date" className="input input-bordered w-full" value={newStudent.endDate} onChange={e => setNewStudent({ ...newStudent, endDate: e.target.value })} required />
                            </div>
                        </div>
                        <input className="input input-bordered w-full" type="password" placeholder="Password" value={newStudent.password} onChange={e => setNewStudent({ ...newStudent, password: e.target.value })} required />
                    </form>
                    <div className="modal-action">
                        <form method="dialog"><button className="btn">Cancel</button></form>
                        <button type="submit" form="student-form" className="btn btn-primary">Create Student</button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop"><button>close</button></form>
            </dialog>

            {/* Course Create Modal */}
            <dialog id="subject_modal" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">Add New Course</h3>
                    <form id="subject-form" onSubmit={handleCreateSubject} className="space-y-4">
                        <input className="input input-bordered w-full" placeholder="Course Name" value={newSubject.name} onChange={e => setNewSubject({ ...newSubject, name: e.target.value })} required />
                        <select className="select select-bordered w-full" value={newSubject.department} onChange={e => setNewSubject({ ...newSubject, department: e.target.value })} required>
                            <option value="">Select Department</option>
                            {allDepartments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                        </select>
                        <select className="select select-bordered w-full" value={newSubject.semester} onChange={e => setNewSubject({ ...newSubject, semester: e.target.value })} required>
                            {getSemesterList(newSubject.batch).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input className="input input-bordered w-full" placeholder="Batch (e.g. 2023-2026)" value={newSubject.batch || ''} onChange={e => setNewSubject({ ...newSubject, batch: e.target.value })} required list="batch-options" />
                        <div className="form-control">
                            <label className="label text-xs">Start Date</label>
                            <input type="date" className="input input-bordered w-full" value={newSubject.startDate} onChange={e => setNewSubject({ ...newSubject, startDate: e.target.value })} required />
                        </div>
                        <select className="select select-bordered w-full" value={newSubject.teacherId} onChange={e => setNewSubject({ ...newSubject, teacherId: e.target.value })}>
                            <option value="">Select Teacher (Optional)</option>
                            {allTeachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                        </select>
                    </form>
                    <div className="modal-action">
                        <form method="dialog"><button className="btn">Cancel</button></form>
                        <button type="submit" form="subject-form" className="btn btn-primary">Create Course</button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop"><button>close</button></form>
            </dialog>
        </div>
    );
};

export default AdminDashboard;
