const { Pool } = require("pg");
const logger = require("../config/logger");

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "secure_api_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  // Use DATABASE_URL if provided (for cloud services)
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Error handling
pool.on("error", (err, client) => {
  logger.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Test connection
pool.on("connect", () => {
  logger.info("Database connected successfully");
});

/**
 * Initialize database dengan membuat tabel-tabel yang diperlukan
 */
async function initializeDatabase() {
  const client = await pool.connect();

  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create refresh_tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        token VARCHAR(500) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_items_created_by ON items(created_by);
    `);

    // Create admin user jika belum ada
    const adminCheck = await client.query(
      "SELECT id FROM users WHERE role = $1",
      ["admin"]
    );
    if (adminCheck.rows.length === 0) {
      const bcrypt = require("bcryptjs");
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      const hashedPassword = await bcrypt.hash(
        adminPassword,
        parseInt(process.env.BCRYPT_ROUNDS) || 10
      );

      await client.query(
        "INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)",
        ["admin", "admin@example.com", hashedPassword, "admin"]
      );
      logger.info("Default admin user created: admin@example.com / admin123");
    }

    logger.info("Database tables initialized successfully");
  } catch (error) {
    logger.error("Error initializing database:", error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Execute query dengan error handling
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug("Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error("Database query error:", error);
    throw error;
  }
}

/**
 * Get client from pool untuk transactions
 */
function getClient() {
  return pool.connect();
}

module.exports = {
  pool,
  query,
  getClient,
  initializeDatabase,
};
