const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("./db");

module.exports = function configurePassport() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("Google OAuth credentials are missing.");

    return;
  }
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_UR ||
        "http://localhost:5000/api/auth/google/callback",
    },
    async (acessToken, refrehToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();

        if (!email) {
          return done(new Error("Google email is not invailable."));
        }

        const existingUser = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [email],
        );

        if (existingUser.rows.length > 0) {
          return done(null, existingUser.rows[0]);
        }

        const createUser = await pool.query(
          `INSERT INTO users (name , email , google_id, provider , role)
          VALUES($1, $2,$3,'google', 'user') RETURNING *`,
          [profile.diplayName || email, email, profile.id],
        );

        return done(null, createUser.rows[0]);
      } catch (error) {
        return done(error);
      }
    },
  ),
);
