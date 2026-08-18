const CACHE_PREFIX = "portfolio_public_v1_";
const DEFAULT_TTL_MS = 5 * 60 * 1000;

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
      JSON.stringify({
        data,
        expiry: Date.now() + ttlMs,
      }),
    );
  } catch {
    // sessionStorage full or unavailable — ignore
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

/**
 * Fetch public portfolio endpoints with sessionStorage cache for faster repeat visits.
 */
export const fetchPublicPortfolioData = async (api, endpoints) => {
  const results = {};
  const pending = [];

  for (const [key, path] of Object.entries(endpoints)) {
    const cached = readCache(key);
    if (cached !== null) {
      results[key] = { status: "fulfilled", value: { data: cached } };
    } else {
      pending.push(
        api
          .get(path)
          .then((response) => {
            writeCache(key, response.data);
            return { key, response };
          })
          .catch((error) => ({ key, error })),
      );
    }
  }

  if (pending.length > 0) {
    const settled = await Promise.all(pending);
    for (const item of settled) {
      if (item.response) {
        results[item.key] = { status: "fulfilled", value: item.response };
      } else {
        results[item.key] = { status: "rejected", reason: item.error };
      }
    }
  }

  return results;
};
