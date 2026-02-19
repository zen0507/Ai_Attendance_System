import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Save, TrendingUp, BarChart2 } from 'lucide-react';
import API from '../api/axiosInstance';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Max marks per component (raw, before weighting)
const MAX_TEST1 = 50;
const MAX_TEST2 = 50;
const MAX_ASSIGNMENT = 50;

const TeacherMarks = () => {
    const { user } = useContext(AuthContext);
    const { success: toastSuccess, error: toastError } = useToast();

    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedBatch, setSelectedBatch] = useState("");
    const [selectedSemester, setSelectedSemester] = useState("S1");

    const [students, setStudents] = useState([]);
    const [marksMap, setMarksMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Weightage from settings
    const [weightage, setWeightage] = useState({ test1: 0.3, test2: 0.3, assignment: 0.4 });

    // Computed max total (e.g., 50*0.3 + 50*0.3 + 50*0.4 = 50)
    const maxTotal = (MAX_TEST1 * weightage.test1 + MAX_TEST2 * weightage.test2 + MAX_ASSIGNMENT * weightage.assignment).toFixed(1);

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const { data } = await API.get('/teacher/subjects');
                setSubjects(data.data || []);

                // Fetch settings via API instance
                const profileRes = await API.get('/users/profile');
                if (profileRes.data.data.settings?.weightage) {
                    setWeightage(profileRes.data.data.settings.weightage);
                }
            } catch (error) {
                console.error("Failed to load initial data", error);
            }
        };
        fetchInitial();
    }, []);

    useEffect(() => {
        if (selectedSubject && selectedBatch && selectedSemester) {
            fetchStudents();
        } else {
            setStudents([]);
            setMarksMap({});
        }
    }, [selectedSubject, selectedBatch, selectedSemester]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const { data } = await API.get(`/teacher/students?subjectId=${selectedSubject}&batch=${selectedBatch}&semester=${selectedSemester}`);
            const studentList = data.data.students || [];
            setStudents(studentList);

            const initialMap = {};
            studentList.forEach(s => {
                // Use studentProfileId (Student._id) as key — this is what gets stored in Marks collection
                const key = s.studentProfileId || s._id;
                if (s.marks) {
                    initialMap[key] = {
                        test1: s.marks.test1,
                        test2: s.marks.test2,
                        assignment: s.marks.assignment,
                        total: s.marks.total
                    };
                } else {
                    initialMap[key] = { test1: '', test2: '', assignment: '', total: 0 };
                }
            });
            setMarksMap(initialMap);
        } catch (error) {
            console.error(error);
            toastError("Failed to fetch students");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = (studentId, field, value) => {
        // Enforce max per component
        const maxMap = { test1: MAX_TEST1, test2: MAX_TEST2, assignment: MAX_ASSIGNMENT };
        let numVal = value === '' ? '' : Math.min(parseFloat(value) || 0, maxMap[field]);
        if (numVal < 0) numVal = 0;

        const current = marksMap[studentId] || { test1: 0, test2: 0, assignment: 0 };
        const updated = { ...current, [field]: value === '' ? '' : numVal };

        // Calculate weighted total
        const t1 = parseFloat(updated.test1) || 0;
        const t2 = parseFloat(updated.test2) || 0;
        const a = parseFloat(updated.assignment) || 0;
        const total = (t1 * weightage.test1) + (t2 * weightage.test2) + (a * weightage.assignment);
        updated.total = parseFloat(total.toFixed(1));

        setMarksMap(prev => ({ ...prev, [studentId]: updated }));
    };

    const handleSubmit = async () => {
        if (!selectedSubject) {
            toastError("Please select a subject first.");
            return;
        }

        // Validate: check if any marks exceed limits
        for (const [sid, m] of Object.entries(marksMap)) {
            if ((parseFloat(m.test1) || 0) > MAX_TEST1 || (parseFloat(m.test2) || 0) > MAX_TEST2 || (parseFloat(m.assignment) || 0) > MAX_ASSIGNMENT) {
                toastError("Some marks exceed maximum allowed values. Please correct them.");
                return;
            }
        }

        setSaving(true);
        try {
            const marksArray = Object.keys(marksMap).map(studentId => ({
                studentId, // This is now Student._id (studentProfileId)
                test1: parseFloat(marksMap[studentId].test1) || 0,
                test2: parseFloat(marksMap[studentId].test2) || 0,
                assignment: parseFloat(marksMap[studentId].assignment) || 0
            }));

            await API.post('/teacher/marks/bulk', {
                subjectId: selectedSubject,
                marks: marksArray,
                semester: selectedSemester,
                batch: selectedBatch
            });
            toastSuccess("Marks saved successfully!");
        } catch (error) {
            console.error(error);
            toastError(error.response?.data?.message || "Failed to save marks");
        } finally {
            setSaving(false);
        }
    };

    // Chart Data — Distribution uses 0-50 scale (10-point bins)
    const distributionData = {
        labels: ['0-10', '10-20', '20-30', '30-40', '40-50'],
        datasets: [{
            label: 'Students',
            data: [0, 0, 0, 0, 0],
            backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']
        }]
    };
    Object.values(marksMap).forEach(m => {
        const t = parseFloat(m.total || 0);
        if (t < 10) distributionData.datasets[0].data[0]++;
        else if (t < 20) distributionData.datasets[0].data[1]++;
        else if (t < 30) distributionData.datasets[0].data[2]++;
        else if (t < 40) distributionData.datasets[0].data[3]++;
        else distributionData.datasets[0].data[4]++;
    });

    // Stats
    const enteredCount = Object.values(marksMap).filter(m => m.test1 !== '' || m.test2 !== '' || m.assignment !== '').length;
    const avgTotal = enteredCount > 0
        ? (Object.values(marksMap).reduce((sum, m) => sum + (parseFloat(m.total) || 0), 0) / enteredCount).toFixed(1)
        : '0.0';

    const handleSubjectChange = (e) => {
        const subId = e.target.value;
        const sub = subjects.find(s => s._id === subId);
        setSelectedSubject(subId);
        setSelectedBatch(sub ? sub.batch : "");
        setSelectedSemester(sub ? sub.semester || "S1" : "");
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-base-content">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <TrendingUp className="text-primary" size={32} />
                Internal Marks
            </h1>

            {/* Controls */}
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="form-control">
                        <label className="label text-sm font-bold opacity-70">Subject</label>
                        <select className="select select-bordered" value={selectedSubject} onChange={handleSubjectChange}>
                            <option value="">Select Subject</option>
                            {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.batch})</option>)}
                        </select>
                    </div>
                    <div className="form-control">
                        <label className="label text-sm font-bold opacity-70">Semester</label>
                        <select className="select select-bordered" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} disabled={!selectedSubject}>
                            {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="form-control md:col-span-2">
                        <label className="label text-sm font-bold opacity-70">Weightage</label>
                        <div className="flex flex-wrap gap-3 text-xs opacity-70">
                            <span className="badge badge-outline">Test 1: ×{weightage.test1} (max {MAX_TEST1})</span>
                            <span className="badge badge-outline">Test 2: ×{weightage.test2} (max {MAX_TEST2})</span>
                            <span className="badge badge-outline">Assignment: ×{weightage.assignment} (max {MAX_ASSIGNMENT})</span>
                            <span className="badge badge-primary">Total Max: {maxTotal}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-10">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            )}

            {/* Content */}
            {!loading && students.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Table */}
                    <div className="lg:col-span-2 card bg-base-100 shadow-xl border border-base-200">
                        <div className="card-body p-0">
                            <table className="table table-zebra w-full">
                                <thead className="bg-base-200">
                                    <tr>
                                        <th>Reg No</th>
                                        <th>Name</th>
                                        <th className="w-24 text-center">Test 1 <span className="text-xs opacity-40">/{MAX_TEST1}</span></th>
                                        <th className="w-24 text-center">Test 2 <span className="text-xs opacity-40">/{MAX_TEST2}</span></th>
                                        <th className="w-24 text-center">Assign <span className="text-xs opacity-40">/{MAX_ASSIGNMENT}</span></th>
                                        <th className="w-20 text-center font-bold">Total <span className="text-xs opacity-40">/{maxTotal}</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((s, idx) => (
                                        <tr key={s._id}>
                                            <td className="font-mono text-xs">{s.registerNo || `S${String(idx + 1).padStart(3, '0')}`}</td>
                                            <td className="font-medium text-sm">{s.name}</td>
                                            <td>
                                                <input type="number" min="0" max={MAX_TEST1} className="input input-sm input-bordered w-full"
                                                    value={marksMap[s.studentProfileId || s._id]?.test1 ?? ''}
                                                    onChange={(e) => handleMarkChange(s.studentProfileId || s._id, 'test1', e.target.value)} />
                                            </td>
                                            <td>
                                                <input type="number" min="0" max={MAX_TEST2} className="input input-sm input-bordered w-full"
                                                    value={marksMap[s.studentProfileId || s._id]?.test2 ?? ''}
                                                    onChange={(e) => handleMarkChange(s.studentProfileId || s._id, 'test2', e.target.value)} />
                                            </td>
                                            <td>
                                                <input type="number" min="0" max={MAX_ASSIGNMENT} className="input input-sm input-bordered w-full"
                                                    value={marksMap[s.studentProfileId || s._id]?.assignment ?? ''}
                                                    onChange={(e) => handleMarkChange(s.studentProfileId || s._id, 'assignment', e.target.value)} />
                                            </td>
                                            <td className="font-bold text-primary text-center">
                                                {marksMap[s.studentProfileId || s._id]?.total ?? 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Class Stats */}
                        <div className="card bg-base-100 shadow-xl border border-base-200">
                            <div className="card-body">
                                <h3 className="card-title text-sm uppercase opacity-50">Class Stats</h3>
                                <div className="space-y-2 my-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="opacity-70">Students</span>
                                        <span className="font-bold">{students.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="opacity-70">Entered</span>
                                        <span className="font-bold">{enteredCount}/{students.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="opacity-70">Class Average</span>
                                        <span className="font-bold text-primary">{avgTotal}/{maxTotal}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Distribution Chart */}
                        <div className="card bg-base-100 shadow-xl border border-base-200">
                            <div className="card-body">
                                <h3 className="card-title text-sm uppercase opacity-50">Distribution (0–{maxTotal})</h3>
                                <div className="h-40">
                                    <Bar data={distributionData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                                </div>
                            </div>
                        </div>

                        <button
                            className={`btn btn-primary w-full gap-2 shadow-lg ${saving ? 'loading' : ''}`}
                            onClick={handleSubmit}
                            disabled={saving || !selectedSubject}
                        >
                            {!saving && <Save size={18} />} {saving ? 'Saving...' : 'Save Marks'}
                        </button>
                    </div>
                </div>
            ) : (
                !loading && (
                    <div className="text-center py-20 opacity-50">
                        <BarChart2 size={48} className="mx-auto mb-4" />
                        <p>Select a subject to view and enter marks.</p>
                    </div>
                )
            )}
        </div>
    );
};

export default TeacherMarks;
