import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

let activeRequests = 0;
let slowTimer = null;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    activeRequests++;
    if (activeRequests === 1) {
      // If a request takes > 2500ms, trigger slow network animation
      slowTimer = setTimeout(() => {
        if (activeRequests > 0) {
          window.dispatchEvent(
            new CustomEvent("app:slow-network", {
              detail: { message: "Cloud server is waking up or connection is slow..." },
            })
          );
        }
      }, 2500);
    }

    return config;
  },
  (error) => {
    activeRequests = Math.max(0, activeRequests - 1);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) {
      clearTimeout(slowTimer);
      window.dispatchEvent(new CustomEvent("app:network-ready"));
    }
    return response;
  },
  (error) => {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) {
      clearTimeout(slowTimer);
      window.dispatchEvent(new CustomEvent("app:network-ready"));
    }
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    return Promise.reject(error);
  },
);

export default api;
