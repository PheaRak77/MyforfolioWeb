/**
 * Public API client — no Authorization header, no axios.
 *
 * Deliberately built on `fetch` so the landing page does not pay for axios on the
 * critical path. The surface mirrors the small slice of the axios API its callers
 * use: `get`/`post` resolve to `{ data }`, and failures throw an error carrying
 * `response: { status, data }` so `err.response?.data?.message` keeps working.
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

const BASE_URL = getBaseUrl();
const TIMEOUT_MS = 30000;
const SLOW_AFTER_MS = 3000;

let activeRequests = 0;
let slowTimer = null;

/** Health pings are background noise — they must not drive the status animation. */
const isTracked = (url, config) => !config?.silent && !url.includes("/health");

const startTracking = () => {
  activeRequests += 1;
  if (activeRequests === 1) {
    slowTimer = window.setTimeout(() => {
      if (activeRequests > 0) {
        window.dispatchEvent(
          new CustomEvent("app:slow-network", {
            detail: { message: "Connecting to the portfolio server…" },
          }),
        );
      }
    }, SLOW_AFTER_MS);
  }
};

const finishTracking = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) {
    window.clearTimeout(slowTimer);
    window.dispatchEvent(new CustomEvent("app:network-ready"));
  }
};

const buildError = (message, { status = 0, data = null } = {}) => {
  const error = new Error(message);
  // Match the axios error shape the callers already destructure.
  error.response = status ? { status, data } : undefined;
  return error;
};

const parseBody = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) return await response.json();
    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
};

const request = async (method, path, body, config = {}) => {
  const url = `${BASE_URL}${path}`;
  const tracked = isTracked(url, config);

  if (tracked) startTracking();

  try {
    const response = await fetch(url, {
      method,
      mode: "cors",
      signal: AbortSignal.timeout(config.timeout ?? TIMEOUT_MS),
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await parseBody(response);

    if (!response.ok) {
      throw buildError(`Request failed with status code ${response.status}`, {
        status: response.status,
        data,
      });
    }

    return { data, status: response.status };
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      throw buildError(`timeout of ${config.timeout ?? TIMEOUT_MS}ms exceeded`);
    }
    throw error;
  } finally {
    if (tracked) finishTracking();
  }
};

const publicApi = {
  get: (path, config) => request("GET", path, undefined, config),
  post: (path, body, config) => request("POST", path, body, config),
};

export default publicApi;
