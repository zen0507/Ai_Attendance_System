import API from './axiosInstance';

export const getDepartments = async () => {
    const { data } = await API.get('/departments');
    return data.data;
};

export const createDepartment = async (departmentData) => {
    const { data } = await API.post('/departments', departmentData);
    return data.data;
};

export const deleteDepartment = async (id) => {
    const { data } = await API.delete(`/departments/${id}`);
    return data;
};
