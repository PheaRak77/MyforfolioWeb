import axios from "axios";

/**
 * Public API client — no Authorization header.
 * Prevents auth token from affecting public read endpoints and improves cacheability.
 */
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 30000,
});

export default publicApi;
