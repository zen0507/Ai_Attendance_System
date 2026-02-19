import API from './axiosInstance';

// --- Admin Dashboard Stats ---
export const getAdminStats = async (params = {}) => {
    const { data } = await API.get('/admin/stats', { params });
    return data.data;
};

export const getAcademicHealthFiltered = async (params = {}) => {
    const { data } = await API.get('/admin/academic-health', { params });
    return data.data;
};

// --- Users (paginated) ---
export const getAllUsers = async (params) => {
    const { data } = await API.get('/users', { params });
    return data.data;
};

export const registerUser = async (userData) => {
    const { data } = await API.post('/users', userData);
    return data.data;
};

export const updateUser = async (id, userData) => {
    const { data } = await API.put(`/users/${id}`, userData);
    return data.data;
};

export const deleteUser = async (id) => {
    const { data } = await API.delete(`/users/${id}`);
    return data;
};

// --- Subjects/Courses (paginated) ---
export const getAllSubjects = async (params) => {
    const { data } = await API.get('/subjects', { params });
    return data.data;
};

export const createSubject = async (subjectData) => {
    const { data } = await API.post('/subjects', subjectData);
    return data.data;
};

export const updateSubject = async (id, subjectData) => {
    const { data } = await API.put(`/subjects/${id}`, subjectData);
    return data.data;
};

export const deleteSubject = async (id) => {
    const { data } = await API.delete(`/subjects/${id}`);
    return data;
};

// --- Activity ---
export const getActivityLogs = async () => {
    const { data } = await API.get('/activity');
    return data.data;
};

// --- Legacy (kept for components that still use it) ---
export const getAcademicHealth = async () => {
    const { data } = await API.get('/marks/health/academic');
    return data.data;
};
