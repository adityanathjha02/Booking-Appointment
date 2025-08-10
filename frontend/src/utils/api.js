import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies with every request
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Optionally add Authorization header if token exists
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (!["/login", "/register"].includes(currentPath)) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
