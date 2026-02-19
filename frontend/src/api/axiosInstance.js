import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

API.interceptors.request.use((config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        const token = JSON.parse(userInfo).token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('userInfo');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;
