-- ============================================================
-- LearnTOEIC – Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT UNIQUE NOT NULL,
  full_name       TEXT NOT NULL,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  plan            TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  target_score    INT DEFAULT 800,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Questions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  part            TEXT NOT NULL CHECK (part IN ('1','2','3','4','5','6','7')),
  difficulty      TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  question_text   TEXT NOT NULL,
  options         JSONB NOT NULL,       -- [{ label: 'A', text: '...' }, ...]
  correct_answer  TEXT NOT NULL,        -- 'A', 'B', 'C', 'D'
  explanation     TEXT,
  audio_url       TEXT,
  image_url       TEXT,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active','draft','archived','review')),
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Test Sets ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_sets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT,
  parts_covered   TEXT[],               -- ['1','2','3','4','5','6','7']
  total_questions INT NOT NULL DEFAULT 0,
  time_limit      INT NOT NULL DEFAULT 120, -- minutes
  difficulty      TEXT DEFAULT 'medium',
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','draft','archived')),
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Test Set Questions (join table) ───────────────────────────
CREATE TABLE IF NOT EXISTS test_set_questions (
  test_set_id     UUID REFERENCES test_sets(id) ON DELETE CASCADE,
  question_id     UUID REFERENCES questions(id) ON DELETE CASCADE,
  question_order  INT,
  PRIMARY KEY (test_set_id, question_id)
);

-- ── Test Results ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_results (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  test_set_id       UUID REFERENCES test_sets(id),
  score             INT NOT NULL DEFAULT 0,       -- total 10-990
  listening_score   INT NOT NULL DEFAULT 0,       -- 5-495
  reading_score     INT NOT NULL DEFAULT 0,       -- 5-495
  correct_count     INT NOT NULL DEFAULT 0,
  total_questions   INT NOT NULL DEFAULT 0,
  duration_minutes  INT,                           -- actual time taken
  answers           JSONB,                         -- { questionId: 'A', ... }
  status            TEXT DEFAULT 'completed',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── User Streaks ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak    INT DEFAULT 0,
  longest_streak    INT DEFAULT 0,
  last_study_date   DATE,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Study Plans ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_plans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_date       DATE NOT NULL,
  title           TEXT NOT NULL,
  duration_minutes INT,
  task_type       TEXT CHECK (task_type IN ('listening','reading','vocabulary','grammar','full_test')),
  is_completed    BOOLEAN DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Vocabulary ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vocabulary (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word            TEXT NOT NULL,
  definition      TEXT NOT NULL,
  example         TEXT,
  part_of_speech  TEXT,                  -- noun, verb, adj, adv
  difficulty      TEXT DEFAULT 'medium',
  topic           TEXT,                  -- business, travel, etc.
  audio_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── User Vocabulary Progress ──────────────────────────────────
CREATE TABLE IF NOT EXISTS user_vocabulary (
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  word_id         UUID REFERENCES vocabulary(id) ON DELETE CASCADE,
  is_known        BOOLEAN DEFAULT FALSE,
  review_count    INT DEFAULT 0,
  next_review     TIMESTAMPTZ,
  PRIMARY KEY (user_id, word_id)
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_questions_part ON questions(part);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_test_results_user ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_created ON test_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_plans_user_date ON study_plans(user_id, plan_date);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users own results" ON test_results FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own plans" ON study_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own vocabulary" ON user_vocabulary FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own streaks" ON user_streaks FOR ALL USING (auth.uid() = user_id);

-- Questions are readable by all authenticated users
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active questions" ON questions FOR SELECT USING (status = 'active');
CREATE POLICY "Admins manage questions" ON questions FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
