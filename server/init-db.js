require("dotenv").config();
const pool = require("./src/config/db");

async function initDatabase() {
  console.log("Connecting to PostgreSQL database...");

  const schema = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      role VARCHAR(50) DEFAULT 'user',
      provider VARCHAR(50) DEFAULT 'local',
      profile_image TEXT,
      phone VARCHAR(50),
      dob DATE,
      bio TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Projects table
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      tech_stack TEXT[] DEFAULT '{}',
      images TEXT[] DEFAULT '{}',
      links JSONB DEFAULT '[]',
      is_featured BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Certificates table
    CREATE TABLE IF NOT EXISTS certificates (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      course VARCHAR(255) NOT NULL,
      instructor VARCHAR(255),
      issued_on DATE,
      description TEXT,
      image TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Skills table
    CREATE TABLE IF NOT EXISTS skills (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      category VARCHAR(100) NOT NULL,
      percentage INTEGER DEFAULT 80,
      icon TEXT,
      is_featured BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Password Resets table
    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured);
    CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
    CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
    CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
    CREATE INDEX IF NOT EXISTS idx_password_resets_lookup ON password_resets(user_id, token_hash);
  `;

  try {
    await pool.query(schema);
    console.log("✅ All tables and indexes created successfully in PostgreSQL!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    process.exit(1);
  }
}

initDatabase();
