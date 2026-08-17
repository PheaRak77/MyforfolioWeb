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
});

module.exports = pool;
