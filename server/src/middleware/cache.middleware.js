// Ultra-fast in-memory cache for public GET endpoints with instant invalidation on writes
const cacheStore = new Map();

/**
 * Cache middleware for public GET routes
 * @param {number} durationSeconds - In-memory server cache TTL in seconds (default: 60s)
 * @param {number} edgeSeconds - Shared CDN (Vercel/Cloudflare) s-maxage TTL in seconds
 */
const cacheMiddleware = (durationSeconds = 60, edgeSeconds = 30) => {
  return (req, res, next) => {
    // Only cache public GET requests; never cache authenticated/admin endpoints
    // or explicit cache-busting refreshes (`?fresh=1`).
    const bypass = req.query?.fresh === "1" || req.headers["cache-control"] === "no-cache";
    if (
      req.method !== "GET" ||
      req.headers.authorization ||
      req.path === "/my" ||
      req.path === "/profile"
    ) {
      return next();
    }

    const key = req.path === "/" ? req.baseUrl || req.originalUrl : req.originalUrl.split("?")[0];
    const cached = !bypass ? cacheStore.get(key) : null;

    res.setHeader(
      "Cache-Control",
      bypass
        ? "no-cache, max-age=0"
        : `public, max-age=15, s-maxage=${edgeSeconds}, stale-while-revalidate=3600`
    );

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
      res.setHeader("X-Cache", bypass ? "BYPASS" : "MISS");
      return originalJson(body);
    };

    next();
  };
};

/**
 * Populate a cache entry directly (used for startup pre-warming)
 */
const setPublicCacheEntry = (key, data, durationSeconds = 120) => {
  cacheStore.set(key, {
    data,
    expiry: Date.now() + durationSeconds * 1000,
  });
};

/**
 * Invalidate all cached data when admin performs CRUD mutations
 */
const clearPublicCache = () => {
  cacheStore.clear();
};

module.exports = { cacheMiddleware, clearPublicCache, setPublicCacheEntry };
