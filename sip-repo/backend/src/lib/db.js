const { Pool } = require('pg');

// One pool per Lambda container, reused across warm invocations.
let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: 5432,
      max: 2,
      ssl: { rejectUnauthorized: false },
      idleTimeoutMillis: 10000,
    });
  }
  return pool;
}

async function query(text, params) {
  const result = await getPool().query(text, params);
  return result.rows;
}

module.exports = { query };
