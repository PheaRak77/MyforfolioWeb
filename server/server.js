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

const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  }),
);

// Payload Compression for high-performance response times
app.use(compression());

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl) or allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev, or specify allowed list
      }
    },
    credentials: true,
  }),
);

// Body Parser with payload limit
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Rate Limiter for Auth endpoints (protection against brute force attacks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again in 15 minutes.",
  },
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Static uploads directory with caching headers
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "7d",
    etag: true,
  }),
);

configurePassport();
app.use(passport.initialize());

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

// Mount Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", apiLimiter, userRoutes);
app.use("/api/projects", apiLimiter, projectRoutes);
app.use("/api/certificates", apiLimiter, certificateRoutes);
app.use("/api/skills", apiLimiter, skillRoutes);
app.use("/api/uploads", apiLimiter, uploadRoutes);
app.use("/api/contact", apiLimiter, contactRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Secure portfolio server running on port ${PORT}`);
});

