-- Cloudflare D1 SQLite Database Schema for FotoPuan Arena
-- Run this in Cloudflare CLI: wrangler d1 execute fotopuan-db --file=./schema.sql

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS contestants;
DROP TABLE IF EXISTS settings;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nickname TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  in_game_screenshot_url TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'player', -- 'admin' or 'player'
  status TEXT NOT NULL DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
  voted_contestant_ids TEXT DEFAULT '[]', -- JSON array of string IDs
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contestants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  in_game_screenshot_url TEXT DEFAULT '',
  theme_id TEXT NOT NULL,
  theme_title TEXT NOT NULL,
  votes_count INTEGER DEFAULT 0,
  voter_user_ids TEXT DEFAULT '[]', -- JSON array of string user IDs
  elo INTEGER DEFAULT 1200,
  duel_wins INTEGER DEFAULT 0,
  duel_losses INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
  featured_badge TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Seed Clean Administrator (Admin account for managing settings and approvals)
INSERT OR IGNORE INTO users (id, nickname, password, in_game_screenshot_url, avatar_url, role, status, voted_contestant_ids, created_at)
VALUES (
  'user_admin',
  'admin',
  'admin',
  '',
  '',
  'admin',
  'approved',
  '[]',
  datetime('now')
);

-- Seed System Default Settings (Clean state, zero demo images)
INSERT OR REPLACE INTO settings (key, value)
VALUES (
  'system_settings',
  json_object(
    'maxVotesPerUser', 5,
    'requireAccountApproval', 1,
    'requirePhotoApproval', 1,
    'currentTheme', json_object(
      'id', 'theme_active',
      'title', 'Current Season Theme',
      'description', 'Enter your game character profile screenshot and theme portrait. Administrators can set and customize this theme, description, dates, and inspiration photos at any time from the Admin Panel.',
      'startDate', datetime('now'),
      'endDate', datetime('now', '+14 days'),
      'examplePhotoUrls', json_array(),
      'isActive', 1
    )
  )
);
