const pool = require("./db");

async function ensureDatabaseSchema() {
  const migrationQuery = `
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
      level VARCHAR(50) DEFAULT 'Advanced',
      color VARCHAR(50) DEFAULT '#3B82F6',
      is_featured BOOLEAN DEFAULT false,
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Password Resets table
    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      used_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- MIGRATIONS: Safely add missing columns to any existing tables
    ALTER TABLE skills ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
    ALTER TABLE skills ADD COLUMN IF NOT EXISTS level VARCHAR(50) DEFAULT 'Advanced';
    ALTER TABLE skills ADD COLUMN IF NOT EXISTS color VARCHAR(50) DEFAULT '#3B82F6';
    ALTER TABLE skills ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
    ALTER TABLE skills ADD COLUMN IF NOT EXISTS icon TEXT;
    ALTER TABLE skills ADD COLUMN IF NOT EXISTS percentage INTEGER DEFAULT 80;

    ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS dob DATE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'local';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);

    ALTER TABLE projects ADD COLUMN IF NOT EXISTS tech_stack TEXT[] DEFAULT '{}';
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]';
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS instructor VARCHAR(255);
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issued_on DATE;
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS image TEXT;

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_role_admin ON users(role) WHERE role = 'admin';
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_user_created ON projects(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured);
    CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
    CREATE INDEX IF NOT EXISTS idx_certificates_user_created ON certificates(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
    CREATE INDEX IF NOT EXISTS idx_skills_user_order ON skills(user_id, display_order ASC, percentage DESC);
    CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
    CREATE INDEX IF NOT EXISTS idx_skills_display_order ON skills(display_order);
    CREATE INDEX IF NOT EXISTS idx_password_resets_lookup ON password_resets(user_id, token_hash);
    CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
  `;

  try {
    await pool.query(migrationQuery);
    console.log("✅ Database schema & columns verified successfully");
  } catch (err) {
    console.error("⚠️ Database schema sync notice:", err.message);
  }
}

module.exports = { ensureDatabaseSchema };
