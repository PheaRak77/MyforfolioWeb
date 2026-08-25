import axios from "axios";

/**
 * Public API client — no Authorization header.
 * Prevents auth token from affecting public read endpoints and improves cacheability.
 */
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return "https://myportfolio-api-8b84.onrender.com/api";
  }
  return "http://localhost:5000/api";
};

const publicApi = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
});

let activeRequests = 0;
let slowTimer = null;

const finishRequest = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) {
    window.clearTimeout(slowTimer);
    window.dispatchEvent(new CustomEvent("app:network-ready"));
  }
};

// Public portfolio requests are the ones visitors notice most. Surface a calm
// status animation only when one truly takes a while (such as a Render wake-up).
publicApi.interceptors.request.use((config) => {
  if (!config.silent && !config.url?.includes("/health")) {
    activeRequests += 1;
    if (activeRequests === 1) {
      slowTimer = window.setTimeout(() => {
        if (activeRequests > 0) {
          window.dispatchEvent(new CustomEvent("app:slow-network", {
            detail: { message: "Connecting to the portfolio server…" },
          }));
        }
      }, 3000);
    }
  }
  return config;
}, (error) => Promise.reject(error));

publicApi.interceptors.response.use(
  (response) => {
    if (!response.config.silent && !response.config.url?.includes("/health")) finishRequest();
    return response;
  },
  (error) => {
    if (!error.config?.silent && !error.config?.url?.includes("/health")) finishRequest();
    return Promise.reject(error);
  },
);

export default publicApi;
