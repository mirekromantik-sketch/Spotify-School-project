// db.js
const Database = require('better-sqlite3');

// Connect to SQLite database (creates file if not existing)
const db = new Database('./spotify_users.db');

// Create Users table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT,
    spotify_id TEXT UNIQUE,
    spotify_profile_url TEXT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at INTEGER
  )
`).run();

module.exports = db;
