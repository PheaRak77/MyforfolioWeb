// Ultra-fast in-memory cache for public GET endpoints with instant invalidation on writes
const cacheStore = new Map();

/**
 * Cache middleware for public GET routes
 * @param {number} durationSeconds - Cache TTL in seconds (default: 60s)
 */
const cacheMiddleware = (durationSeconds = 60) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cached = cacheStore.get(key);

    res.setHeader("Cache-Control", `public, max-age=${durationSeconds}, s-maxage=${durationSeconds * 2}, stale-while-revalidate=300`);

    if (cached && Date.now() < cached.expiry) {
      res.setHeader("X-Cache", "HIT");
      return res.json(cached.data);
    }

    // Override res.json to capture response and save to cache
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheStore.set(key, {
          data: body,
          expiry: Date.now() + durationSeconds * 1000,
        });
      }
      res.setHeader("X-Cache", "MISS");
      return originalJson(body);
    };

    next();
  };
};

/**
 * Invalidate all cached data when admin performs CRUD mutations
 */
const clearPublicCache = () => {
  cacheStore.clear();
};

module.exports = { cacheMiddleware, clearPublicCache };
