CREATE TABLE IF NOT EXISTS decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  period TEXT NOT NULL,
  context TEXT NOT NULL,
  financial_scale TEXT NOT NULL,
  emotional_impact TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposal' CHECK(status IN ('proposal', 'approved', 'closed')),
  approved_by_a INTEGER NOT NULL DEFAULT 0,
  approved_by_b INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL CHECK(created_by IN ('A', 'B')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_id INTEGER NOT NULL REFERENCES decisions(id),
  user_id TEXT NOT NULL CHECK(user_id IN ('A', 'B')),
  rating INTEGER CHECK(rating BETWEEN 1 AND 5),
  would_do_again INTEGER,
  biggest_ignored_risk TEXT,
  status TEXT NOT NULL DEFAULT 'editable' CHECK(status IN ('editable', 'locked')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(decision_id, user_id)
);

CREATE TABLE IF NOT EXISTS assessment_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('pro', 'con')),
  text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS responsibilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_id INTEGER NOT NULL REFERENCES decisions(id),
  user_id TEXT NOT NULL CHECK(user_id IN ('A', 'B')),
  brought_topic TEXT CHECK(brought_topic IN ('me', 'partner', 'both', 'dont_remember')),
  pushed_execution TEXT CHECK(pushed_execution IN ('me', 'partner', 'both', 'dont_remember')),
  main_burden TEXT CHECK(main_burden IN ('me', 'partner', 'both', 'dont_remember')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(decision_id, user_id)
);

CREATE TABLE IF NOT EXISTS shared_conclusions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_id INTEGER NOT NULL UNIQUE REFERENCES decisions(id),
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meta_conclusions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('bias', 'rule', 'red_flag')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
