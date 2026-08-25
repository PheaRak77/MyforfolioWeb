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

export default publicApi;
