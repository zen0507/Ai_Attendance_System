import API from './axiosInstance';

export const getStudentSubjects = async () => {
    const { data } = await API.get('/subjects');
    return data.data;
};

export const getStudentAttendance = async (studentId) => {
    const { data } = await API.get(`/attendance/${studentId}`);
    return data.data;
};

export const getStudentMarks = async (studentId) => {
    const { data } = await API.get(`/marks/${studentId}`);
    return data.data;
};

export const getRiskAnalysis = async (studentId) => {
    const { data } = await API.get(`/marks/analysis/${studentId}`);
    return data.data;
};

export const getClassAverage = async (studentId) => {
    const { data } = await API.get(`/marks/class-average/${studentId}`);
    return data.data;
};

