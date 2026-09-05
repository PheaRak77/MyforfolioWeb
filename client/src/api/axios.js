import axios from "axios";

const getBaseUrl = () => {
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    // Use relative path so Vercel proxies the request server-side.
    // This avoids CORS entirely and works for ALL domains (ypheareak.site, vercel.app, etc.)
    return "/api";
  }
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return "http://localhost:5000/api";
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

let activeRequests = 0;
let slowTimer = null;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (!config.silent && !config.url?.includes("/contact") && !config.url?.includes("/health")) {
      activeRequests++;
      if (activeRequests === 1) {
        // If a request takes > 4000ms, trigger slow network animation
        slowTimer = setTimeout(() => {
          if (activeRequests > 0) {
            window.dispatchEvent(
              new CustomEvent("app:slow-network", {
                detail: { message: "Cloud server is waking up or connection is slow..." },
              })
            );
          }
        }, 4000);
      }
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
