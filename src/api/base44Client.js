import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const base44 = axios.create({
  baseURL: API_URL, // Isso já inclui o /api
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
base44.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`); // Debug
    return config;
  },
  (error) => Promise.reject(error)
);

export default base44;