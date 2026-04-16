import { Pool, PoolConfig } from "pg";

// Reusable PostgreSQL connection pool — singleton pattern to prevent
// creating multiple pools during hot-reload in development.
const poolConfig: PoolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false
  },
};

// In development, attach the pool to globalThis to survive HMR reloads.
// In production, a module-level variable is sufficient.
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool: Pool = globalForPg.pgPool ?? new Pool(poolConfig);

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

/**
 * Initialize the tasks table and status enum if they don't exist.
 * Called once on first API request (idempotent).
 */
let initialized = false;

export async function initializeDatabase(): Promise<void> {
  if (initialized) return;

  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id            SERIAL PRIMARY KEY,
      title         TEXT NOT NULL,
      description   TEXT,
      status        task_status NOT NULL DEFAULT 'pending',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);


  // Add user_id to existing tasks table if it doesn't exist
  // Add user_id to existing tasks table if it doesn't exist
      ALTER TABLE tasks ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_column THEN NULL;
    END $$;
  `);

  // Add first_name and last_name to existing users table
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN first_name VARCHAR(255) DEFAULT '';
      ALTER TABLE users ADD COLUMN last_name VARCHAR(255) DEFAULT '';
    EXCEPTION
      WHEN duplicate_column THEN NULL;
    END $$;
  `);

  // Add tags to existing tasks table
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE tasks ADD COLUMN tags TEXT[] DEFAULT '{}';
    EXCEPTION
      WHEN duplicate_column THEN NULL;
    END $$;
  `);


  // Auto-update `updated_at` on row modification
  await pool.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await pool.query(`
    DO $$ BEGIN
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON tasks
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  initialized = true;
}
