-- College Life Simulator — Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  code TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'setup', 'day', 'resolution', 'exam', 'end')),
  host_id UUID,
  current_day INTEGER NOT NULL DEFAULT 1,
  current_phase TEXT NOT NULL DEFAULT 'lobby' CHECK (current_phase IN ('lobby', 'setup', 'day', 'resolution', 'exam', 'end')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  major TEXT,
  pos_trait TEXT,
  neg_trait TEXT,
  academics NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  social NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  wellbeing NUMERIC(4,2) NOT NULL DEFAULT 5.0,
  money NUMERIC(4,2) NOT NULL DEFAULT 2.0,
  class_schedule JSONB DEFAULT '[]'::jsonb,
  eliminated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relationships table (per-pair, hidden)
CREATE TABLE IF NOT EXISTS relationships (
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  player_a UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player_b UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 3),
  progress INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (room_code, player_a, player_b),
  CHECK (player_a < player_b)
);

-- Wildcard deck state (per room)
CREATE TABLE IF NOT EXISTS wildcard_decks (
  room_code TEXT PRIMARY KEY REFERENCES rooms(code) ON DELETE CASCADE,
  draw_pile JSONB NOT NULL DEFAULT '[]'::jsonb,
  discard_pile JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wildcard definitions (permanent catalog)
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

-- Public event definitions (permanent catalog)
CREATE TABLE IF NOT EXISTS public_event_defs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  effect_type TEXT NOT NULL CHECK (
    effect_type IN ('flat_stats', 'action_multiplier', 'slot_multiplier', 'daily_decay', 'mixed')
  ),
  flat_stat_changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  multipliers JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Private event definitions (permanent catalog)
CREATE TABLE IF NOT EXISTS private_event_defs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  effect_type TEXT NOT NULL CHECK (
    effect_type IN ('risk_reward', 'flat_stats', 'gimmick', 'future_effect', 'mixed')
  ),
  code_prefix TEXT NOT NULL,
  risk_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  reward_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Day actions table
CREATE TABLE IF NOT EXISTS day_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('morning', 'afternoon', 'night')),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_id UUID REFERENCES players(id) ON DELETE SET NULL,
  money_spent NUMERIC(4,2) DEFAULT 0,
  outcome_tier TEXT CHECK (outcome_tier IN ('bad', 'normal', 'good')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (room_code, day, slot, player_id)
);

-- Events table (public and private)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  event_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  holders JSONB DEFAULT '[]'::jsonb,
  effect TEXT,
  redeemed_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resolutions table (day-end logs)
CREATE TABLE IF NOT EXISTS resolutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  old_stats JSONB NOT NULL,
  new_stats JSONB NOT NULL,
  changes JSONB NOT NULL,
  highlights JSONB DEFAULT '[]'::jsonb,
  resolved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (room_code, day, player_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_players_room ON players(room_code);
CREATE INDEX IF NOT EXISTS idx_day_actions_room_day ON day_actions(room_code, day);
CREATE INDEX IF NOT EXISTS idx_events_room_day ON events(room_code, day);
CREATE INDEX IF NOT EXISTS idx_resolutions_room_day ON resolutions(room_code, day);

-- Row Level Security (RLS) policies
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE wildcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wildcard_defs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_event_defs ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_event_defs ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolutions ENABLE ROW LEVEL SECURITY;

-- Allow read access to all (game uses room code as auth)
CREATE POLICY "Allow read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Allow read players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow read relationships" ON relationships FOR SELECT USING (true);
CREATE POLICY "Allow read wildcard_decks" ON wildcard_decks FOR SELECT USING (true);
CREATE POLICY "Allow read wildcard_defs" ON wildcard_defs FOR SELECT USING (true);
CREATE POLICY "Allow read public_event_defs" ON public_event_defs FOR SELECT USING (true);
CREATE POLICY "Allow read private_event_defs" ON private_event_defs FOR SELECT USING (true);
CREATE POLICY "Allow read day_actions" ON day_actions FOR SELECT USING (true);
CREATE POLICY "Allow read events" ON events FOR SELECT USING (true);
CREATE POLICY "Allow read resolutions" ON resolutions FOR SELECT USING (true);

-- Allow insert/update for game operations (we'll use service role for mutations)
CREATE POLICY "Allow all rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all relationships" ON relationships FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all wildcard_decks" ON wildcard_decks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all wildcard_defs" ON wildcard_defs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public_event_defs" ON public_event_defs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all private_event_defs" ON private_event_defs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all day_actions" ON day_actions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all resolutions" ON resolutions FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE wildcard_decks;
ALTER PUBLICATION supabase_realtime ADD TABLE day_actions;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE resolutions;
