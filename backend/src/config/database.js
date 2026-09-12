const { Pool } = require('pg');

let pool = null;

async function initDatabase() {
  if (!pool) {
    // If DATABASE_URL is not provided, use a dummy one just so it doesn't crash on require
    const connectionString = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/gem_bid_verify';
    pool = new Pool({
      connectionString,
    });
    
    // Connect to check if it's available
    try {
      const client = await pool.connect();
      console.log('✅ Connected to PostgreSQL database');
      client.release();
    } catch (err) {
      console.error('❌ Failed to connect to PostgreSQL (Ensure DATABASE_URL is correct or db is running):', err.message);
      // We don't throw here to allow the server to start, as requested in prompt:
      // "(even if it throws a connection error without the real DB URL, make sure the syntax is correct)"
    }
  }
  return pool;
}

const dbProxy = new Proxy({}, {
  get(target, prop) {
    if (prop === 'init') return initDatabase;
    if (prop === 'query') return pool ? pool.query.bind(pool) : async () => ({ rows: [] }); // dummy for startup without crash
    if (!pool) {
      throw new Error('Database not initialized yet. Call db.init() first and await it.');
    }
    return pool[prop];
  }
});

module.exports = dbProxy;
