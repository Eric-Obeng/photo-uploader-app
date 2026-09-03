const { Pool } = require("pg");

function loadCredentials() {
  const raw = process.env.DB_CREDENTIALS;
  if (!raw) {
    return { username: process.env.DB_USER, password: process.env.DB_PASSWORD };
  }
  const parsed = JSON.parse(raw);
  return { username: parsed.username, password: parsed.password };
}

const { username, password } = loadCredentials();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: username,
  password,
  ssl: { rejectUnauthorized: false },
});

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS photos (
      id SERIAL PRIMARY KEY,
      description TEXT NOT NULL,
      object_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

module.exports = { pool, ensureSchema };
