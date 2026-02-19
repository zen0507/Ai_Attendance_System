import API from './axiosInstance';

// Old methods (Keep if needed, but we likely replace them)
export const getTeacherSubjects = async () => {
    const { data } = await API.get('/teacher/subjects'); // Updated to use new optimized endpoint
    return data.data;
};

// New methods
export const getDashboardStats = async () => {
    const { data } = await API.get('/teacher/dashboard-stats');
    return data.data;
};

export const getStudentsForSubject = async (subjectId) => {
    const { data } = await API.get(`/teacher/students?subjectId=${subjectId}`);
    return data.data; // Returns { subjectName, batch, students: [...] }
};

export const bulkSubmitMarks = async (subjectId, marksData) => {
    const { data } = await API.post('/teacher/marks/bulk', { subjectId, marks: marksData });
    return data;
};

// Keep existing for single attendance if needed, but we might prefer bulk
export const markAttendance = async (attendanceData) => {
    const { data } = await API.post('/attendance', attendanceData);
    return data.data;
};

export const submitMarks = async (marksData) => {
    const { data } = await API.post('/marks', marksData);
    return data.data;
};
