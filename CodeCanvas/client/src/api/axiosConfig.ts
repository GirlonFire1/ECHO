import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1'; // use the Node proxy at the same origin to avoid CORS

const api = axios.create({
  baseURL: API_URL,
  // withCredentials: true, // enable this if you use cookies/sessions
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
