import axios from 'axios';

// In development, Vite proxies /api → http://localhost:8080
// In production, set VITE_API_URL environment variable
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  withCredentials: true, // send session cookie on every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept responses — unwrap error messages for convenience
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      'An unexpected error occurred.';
    error.message = message;
    return Promise.reject(error);
  }
);

export default api;
