const CACHE_PREFIX = "portfolio_public_v2_";
const DEFAULT_TTL_MS = 10 * 60 * 1000;

const readCache = (key) => {
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.expiry || Date.now() > parsed.expiry) {
      sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
};

const writeCache = (key, data, ttlMs = DEFAULT_TTL_MS) => {
  try {
    sessionStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify({ data, expiry: Date.now() + ttlMs }),
    );
  } catch {
    // ignore quota errors
  }
};

export const getCachedPublicData = (key) => readCache(key);

export const setCachedPublicData = (key, data, ttlMs) => writeCache(key, data, ttlMs);

export const clearPublicDataCache = () => {
  try {
    Object.keys(sessionStorage).forEach((storageKey) => {
      if (storageKey.startsWith(CACHE_PREFIX)) {
        sessionStorage.removeItem(storageKey);
      }
    });
  } catch {
    // ignore
  }
};

/** Load all cached portfolio sections at once for instant first paint */
export const hydrateFromCache = () => ({
  profile: readCache("profile"),
  projects: readCache("projects"),
  certificates: readCache("certificates"),
  skills: readCache("skills"),
});

/** Fetch with stale-while-revalidate: show cache instantly, refresh in background */
export const fetchPublicPortfolioData = async (api, endpoints) => {
  const results = {};

  const fetches = Object.entries(endpoints).map(async ([key, path]) => {
    try {
      const response = await api.get(path);
      writeCache(key, response.data);
      results[key] = { status: "fulfilled", value: response };
    } catch (error) {
      const cached = readCache(key);
      if (cached !== null) {
        results[key] = { status: "fulfilled", value: { data: cached } };
      } else {
        results[key] = { status: "rejected", reason: error };
      }
    }
  });

  await Promise.all(fetches);
  return results;
};
