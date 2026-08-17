require("dotenv").config();

const bcrypt = require("bcrypt");
const pool = require("./src/config/db");

async function seed() {
  try {
    const adminPassword = await bcrypt.hash("Admin@123", 10);
    const userPassword = await bcrypt.hash("User@123", 10);

    await pool.query(
      `
      INSERT INTO users (name, email, password_hash, role, provider)
      VALUES ('Admin User', 'admin@example.com', $1, 'admin', 'local')
      ON CONFLICT (email) DO NOTHING
      `,
      [adminPassword],
    );

    const userResult = await pool.query(
      `
      INSERT INTO users (name, email, password_hash, role, provider)
      VALUES ('Normal User', 'user@example.com', $1, 'user', 'local')
      ON CONFLICT (email) DO UPDATE
      SET email = EXCLUDED.email
      RETURNING id
      `,
      [userPassword],
    );

    const userId = userResult.rows[0]?.id;

    if (userId) {
      await pool.query(
        `
        INSERT INTO certificates (user_id, course, instructor, description)
        VALUES ($1, $2, $3, $4)
        `,
        [
          userId,
          "Full Stack Web Development",
          "Programming Academy",
          "Completed full stack web development course.",
        ],
      );

      await pool.query(
        `
        INSERT INTO projects (
          user_id,
          title,
          description,
          tech_stack,
          images,
          links,
          is_featured
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
        `,
        [
          userId,
          "Portfolio Dashboard",
          "A full stack portfolio dashboard project.",
          ["React", "Express", "PostgreSQL"],
          [],
          JSON.stringify([
            {
              label: "GitHub",
              url: "https://github.com",
            },
          ]),
          true,
        ],
      );
    }

    console.log("Seed completed successfully");
    console.log("Admin login: admin@example.com / Admin@123");
    console.log("User login: user@example.com / User@123");

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seed();
