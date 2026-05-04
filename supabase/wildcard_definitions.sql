-- College Life Simulator — Wildcard Definition Table
-- Run this after schema.sql in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS wildcard_defs (
  id TEXT PRIMARY KEY,
  tier TEXT NOT NULL CHECK (
    tier IN ('really_bad', 'bad', 'normal', 'good', 'really_good')
  ),
  type TEXT NOT NULL CHECK (
    type IN ('stat', 'gimmick')
  ),
  title TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  effect_summary TEXT NOT NULL,
  duration TEXT NOT NULL CHECK (
    duration IN ('immediate', 'next_action', 'next_day', 'next_two_actions', 'until_triggered', 'instant')
  ),
  target_stats JSONB NOT NULL DEFAULT '[]'::jsonb,
  immediate JSONB NOT NULL DEFAULT '{}'::jsonb,
  future JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wildcard_defs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read wildcard_defs"
ON wildcard_defs FOR SELECT USING (true);

CREATE POLICY "Allow all wildcard_defs"
ON wildcard_defs FOR ALL USING (true) WITH CHECK (true);
