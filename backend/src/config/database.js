const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'finance.db');

let db;

function initDB() {
  db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('viewer', 'analyst', 'admin')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      reset_token TEXT,
      reset_token_expiry DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    db.exec(`
      ALTER TABLE users 
      ADD COLUMN reset_token TEXT;
    `);
    db.exec(`
      ALTER TABLE users 
      ADD COLUMN reset_token_expiry DATETIME;
    `);
  } catch (err) {
    // Columns might already exist, ignore error
  }

  try {
    db.exec(`
      ALTER TABLE users 
      ADD COLUMN currency TEXT DEFAULT 'USD';
    `);
  } catch (err) {
    // Column might already exist, ignore error
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS financial_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      created_by INTEGER NOT NULL,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE (user_id, category, month, year)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      notes TEXT,
      frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
      next_run_date TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('Database initialized successfully');
  return db;
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
}

module.exports = { initDB, getDB };
