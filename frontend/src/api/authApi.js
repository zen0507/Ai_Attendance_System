import API from './axiosInstance';

export const loginUser = async (email, password) => {
    const { data } = await API.post('/users/login', { email, password });
    return data.data;
};

// Add registration if needed later
// export const registerUser = ...
