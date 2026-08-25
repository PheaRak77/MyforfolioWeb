const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";
const isCloudDb =
  process.env.DATABASE_URL &&
  (process.env.DATABASE_URL.includes("neon.tech") ||
    process.env.DATABASE_URL.includes("supabase.co") ||
    process.env.DATABASE_URL.includes("render.com") ||
    process.env.DATABASE_URL.includes("aivencloud.com") ||
    process.env.DATABASE_URL.includes("sslmode=require"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction || isCloudDb ? { rejectUnauthorized: false } : false,
  // Keep a small warm pool on serverless hosts without exhausting Neon/Postgres
  // connection limits during traffic bursts.
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 8_000,
  allowExitOnIdle: !isProduction,
});

module.exports = pool;
