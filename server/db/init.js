import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "calendar.db");

async function initDb() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  console.log("Connected to SQLite database at", dbPath);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users_admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS photographers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      instagram_username TEXT,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photographer_id INTEGER NOT NULL,
      image_original_url TEXT NOT NULL,
      image_web_url TEXT NOT NULL,
      caption_optional TEXT,
      status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_at DATETIME,
      FOREIGN KEY(photographer_id) REFERENCES photographers(id)
    );

    CREATE TABLE IF NOT EXISTS calendar_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL, -- YYYY-MM-DD
      submission_id INTEGER,
      pinned BOOLEAN DEFAULT 0,
      notes_optional TEXT,
      FOREIGN KEY(submission_id) REFERENCES submissions(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL, -- YYYY-MM-DD
      title TEXT NOT NULL,
      type TEXT CHECK(type IN ('holiday', 'wildlife', 'variable')) NOT NULL,
      region TEXT DEFAULT 'Global',
      source TEXT,
      is_active BOOLEAN DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS notifications_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      photographer_id INTEGER NOT NULL,
      channel TEXT CHECK(channel IN ('email', 'instagram')),
      status TEXT CHECK(status IN ('queued', 'sent', 'failed')),
      details_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
    CREATE INDEX IF NOT EXISTS idx_calendar_date ON calendar_assignments(date);
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
  `);

  console.log("Database initialized successfully.");
  return db;
}

initDb().catch(console.error);
