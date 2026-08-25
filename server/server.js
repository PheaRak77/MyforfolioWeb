require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const passport = require("passport");

const pool = require("./src/config/db");
const configurePassport = require("./src/config/passport");

const authRoutes = require("./src/routes/auth.routes");
const userRoutes = require("./src/routes/user.routes");
const projectRoutes = require("./src/routes/project.routes");
const certificateRoutes = require("./src/routes/certificate.routes");
const skillRoutes = require("./src/routes/skill.routes");
const uploadRoutes = require("./src/routes/upload.routes");
const contactRoutes = require("./src/routes/contact.routes");

const { notFound, errorHandler } = require("./src/middleware/error.middleware");
const { ensureDatabaseSchema } = require("./src/config/migrate");
const { cacheMiddleware, clearPublicCache } = require("./src/middleware/cache.middleware");


const app = express();

// Trust reverse proxy on cloud deployments (Render, Vercel, Heroku)
app.set("trust proxy", 1);

// Security Headers — hardened with strict CSP and XSS protections
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://lh3.googleusercontent.com", "blob:"],
        connectSrc: ["'self'", process.env.CLIENT_URL || "http://localhost:5173"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
      },
    },
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    permittedCrossDomainPolicies: false,
  }),
);

// Hide server fingerprint
app.disable("x-powered-by");

// Payload Compression for high-performance response times
app.use(compression());

// CORS configuration — strict whitelist, only allow known production/dev origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://myportfolio-web-xi.vercel.app",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no-origin requests (mobile apps, health checks) and whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body Parser with reduced payload limit for security
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Rate Limiter for Auth endpoints — strict brute-force protection
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  message: {
    success: false,
    message: "Too many authentication attempts. Please wait 15 minutes and try again.",
  },
});

// Contact form rate limiter — prevent spam
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 contact form submissions per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many messages sent. Please wait an hour before sending again.",
  },
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
});

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Static uploads directory with caching headers and cross-origin access for Vercel proxy
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    next();
  },
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "30d",
    etag: true,
    immutable: true,
  }),
);

configurePassport();
app.use(passport.initialize());

// Auto-migrate DB schema on every startup (safe: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
ensureDatabaseSchema().catch((err) =>
  console.warn("Migration warning:", err.message)
);

// Expose clearPublicCache so controllers can call it on write operations
app.locals.clearPublicCache = clearPublicCache;

// Health check route
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      success: true,
      status: "ok",
      database: "connected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "error",
      database: "disconnected",
      message: error.message,
    });
  }
});

// Mount Routes — public GET routes get 60-second in-memory cache for speed
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", apiLimiter, cacheMiddleware(90), userRoutes);
app.use("/api/projects", apiLimiter, cacheMiddleware(60), projectRoutes);
app.use("/api/certificates", apiLimiter, cacheMiddleware(60), certificateRoutes);
app.use("/api/skills", apiLimiter, cacheMiddleware(60), skillRoutes);
app.use("/api/uploads", apiLimiter, uploadRoutes);
app.use("/api/contact", contactLimiter, contactRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Secure portfolio server running on port ${PORT}`);
});

