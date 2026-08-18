require("dotenv").config();
const { ensureDatabaseSchema } = require("./src/config/migrate");

async function init() {
  console.log("Connecting to PostgreSQL database...");
  await ensureDatabaseSchema();
  console.log("✅ All tables, columns, and indexes verified in PostgreSQL!");
  process.exit(0);
}

init().catch((err) => {
  console.error("❌ Failed to initialize database:", err);
  process.exit(1);
});
