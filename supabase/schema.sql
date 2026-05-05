-- College Life Simulator — Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  code TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'setup', 'day', 'resolution', 'week_resolution', 'exam', 'end')),
  host_id UUID,
  current_day INTEGER NOT NULL DEFAULT 1,
  current_phase TEXT NOT NULL DEFAULT 'lobby' CHECK (current_phase IN ('lobby', 'setup', 'day', 'resolution', 'week_resolution', 'exam', 'end')),
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
    effect_type IN ('flat_stats', 'action_modifier', 'daily_decay', 'mixed')
  ),
  flat_stat_changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_modifiers JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate: add action_modifiers if table exists without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'public_event_defs' AND column_name = 'action_modifiers'
  ) THEN
    ALTER TABLE public_event_defs
      ADD COLUMN action_modifiers JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;

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

-- Room public event selections (pre-generated at room creation)
CREATE TABLE IF NOT EXISTS room_public_events (
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  public_event_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_code, day),
  FOREIGN KEY (public_event_id) REFERENCES public_event_defs(id)
);

-- Room private event day selections (pre-generated at room creation)
CREATE TABLE IF NOT EXISTS room_private_events (
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  private_event_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_code, day),
  FOREIGN KEY (private_event_id) REFERENCES private_event_defs(id)
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
ALTER TABLE room_public_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_private_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolutions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rooms' AND policyname = 'Allow read rooms') THEN
    CREATE POLICY "Allow read rooms" ON rooms FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'players' AND policyname = 'Allow read players') THEN
    CREATE POLICY "Allow read players" ON players FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'relationships' AND policyname = 'Allow read relationships') THEN
    CREATE POLICY "Allow read relationships" ON relationships FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wildcard_decks' AND policyname = 'Allow read wildcard_decks') THEN
    CREATE POLICY "Allow read wildcard_decks" ON wildcard_decks FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wildcard_defs' AND policyname = 'Allow read wildcard_defs') THEN
    CREATE POLICY "Allow read wildcard_defs" ON wildcard_defs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'public_event_defs' AND policyname = 'Allow read public_event_defs') THEN
    CREATE POLICY "Allow read public_event_defs" ON public_event_defs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'private_event_defs' AND policyname = 'Allow read private_event_defs') THEN
    CREATE POLICY "Allow read private_event_defs" ON private_event_defs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'day_actions' AND policyname = 'Allow read day_actions') THEN
    CREATE POLICY "Allow read day_actions" ON day_actions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'Allow read events') THEN
    CREATE POLICY "Allow read events" ON events FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'room_public_events' AND policyname = 'Allow read room_public_events') THEN
    CREATE POLICY "Allow read room_public_events" ON room_public_events FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'room_private_events' AND policyname = 'Allow read room_private_events') THEN
    CREATE POLICY "Allow read room_private_events" ON room_private_events FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resolutions' AND policyname = 'Allow read resolutions') THEN
    CREATE POLICY "Allow read resolutions" ON resolutions FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rooms' AND policyname = 'Allow all rooms') THEN
    CREATE POLICY "Allow all rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'players' AND policyname = 'Allow all players') THEN
    CREATE POLICY "Allow all players" ON players FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'relationships' AND policyname = 'Allow all relationships') THEN
    CREATE POLICY "Allow all relationships" ON relationships FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wildcard_decks' AND policyname = 'Allow all wildcard_decks') THEN
    CREATE POLICY "Allow all wildcard_decks" ON wildcard_decks FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wildcard_defs' AND policyname = 'Allow all wildcard_defs') THEN
    CREATE POLICY "Allow all wildcard_defs" ON wildcard_defs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'public_event_defs' AND policyname = 'Allow all public_event_defs') THEN
    CREATE POLICY "Allow all public_event_defs" ON public_event_defs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'private_event_defs' AND policyname = 'Allow all private_event_defs') THEN
    CREATE POLICY "Allow all private_event_defs" ON private_event_defs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'day_actions' AND policyname = 'Allow all day_actions') THEN
    CREATE POLICY "Allow all day_actions" ON day_actions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'Allow all events') THEN
    CREATE POLICY "Allow all events" ON events FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'room_public_events' AND policyname = 'Allow all room_public_events') THEN
    CREATE POLICY "Allow all room_public_events" ON room_public_events FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'room_private_events' AND policyname = 'Allow all room_private_events') THEN
    CREATE POLICY "Allow all room_private_events" ON room_private_events FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resolutions' AND policyname = 'Allow all resolutions') THEN
    CREATE POLICY "Allow all resolutions" ON resolutions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rooms') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'players') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE players;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'wildcard_decks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE wildcard_decks;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'day_actions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE day_actions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE events;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'room_public_events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE room_public_events;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'room_private_events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE room_private_events;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'resolutions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE resolutions;
  END IF;
END $$;

-- Wildcard card definitions (100 cards)
INSERT INTO wildcard_defs (id, tier, type, title, emoji, description, effect_summary, duration, target_stats, immediate, future, metadata) VALUES
  ('WC-001', 'really_bad', 'stat', 'Academic Probation', '📉', 'You check your portal way too late at night and instantly wish you had not. One awful grade is enough to ruin your entire mood and your academic confidence.', 'Academics -2.0', 'immediate', '["academics"]'::jsonb, '{"academics":-2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-002', 'really_bad', 'stat', 'Food Poisoning', '🤢', 'Something from the dining hall fights back. You spend the rest of the day miserable, weak, and deeply suspicious of institutional cooking.', 'Wellbeing -2.0', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":-2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-003', 'really_bad', 'stat', 'Wallet Gone', '💸', 'Somewhere between class, the bus stop, and your dorm, your wallet ceases to exist. Replacing everything feels expensive and humiliating.', 'Money -2.0', 'immediate', '["money"]'::jsonb, '{"money":-2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-004', 'really_bad', 'stat', 'Public Humiliation', '😬', 'You say the wrong thing in front of the wrong crowd and it lands like a brick. People definitely remember and unfortunately so do you.', 'Social -2.0', 'immediate', '["social"]'::jsonb, '{"social":-2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-005', 'really_bad', 'stat', 'Group Project Disaster', '🧨', 'Your teammates vanish, the document is empty, and the deadline is now somehow your personal problem. The stress wrecks both your output and your sanity.', 'Academics -1.0, Wellbeing -1.0', 'immediate', '["academics","wellbeing"]'::jsonb, '{"academics":-1,"wellbeing":-1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-006', 'really_bad', 'stat', 'ER Visit', '🚑', 'A stupid accident turns into a long miserable wait and a bill you absolutely did not budget for. The whole day is gone and you feel awful.', 'Money -1.0, Wellbeing -1.5', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":-1,"wellbeing":-1.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-007', 'really_bad', 'stat', 'Spiral Night', '🌪️', 'You mean to scroll for ten minutes and somehow lose the entire night to anxiety, bad comparisons, and existential nonsense. Morning arrives without mercy.', 'Social -0.5, Wellbeing -1.5', 'immediate', '["social","wellbeing"]'::jsonb, '{"social":-0.5,"wellbeing":-1.5}'::jsonb, NULL, '{}'::jsonb),

  ('WC-008', 'bad', 'stat', 'Missed Alarm', '⏰', 'You wake up in full panic mode, already late, already sweaty, and already behind. The whole day feels cursed from the first second.', 'Academics -1.0', 'immediate', '["academics"]'::jsonb, '{"academics":-1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-009', 'bad', 'stat', 'Awkward Hangout', '😶', 'You try to be normal, charming, or even just vaguely fun, and somehow the whole interaction goes stiff and weird. You replay it later against your will.', 'Social -1.0', 'immediate', '["social"]'::jsonb, '{"social":-1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-010', 'bad', 'stat', 'Impulse Purchase', '🛍️', 'You convince yourself this is self-care and then immediately feel stupid the second the payment goes through. Cute item, terrible decision.', 'Money -1.0', 'immediate', '["money"]'::jsonb, '{"money":-1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-011', 'bad', 'stat', 'Minor Cold', '🤧', 'Not sick enough to stay in bed, but sick enough to hate moving, thinking, and existing. The kind of illness that makes everything mildly worse.', 'Wellbeing -1.0', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":-1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-012', 'bad', 'stat', 'Parking Ticket', '🚓', 'Campus enforcement remains the most efficient institution in your life. They spot you instantly and improve your day in the worst possible way.', 'Money -0.75, Wellbeing -0.25', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":-0.75,"wellbeing":-0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-013', 'bad', 'stat', 'Bad Study Session', '📚', 'You spend an hour reading the same paragraph and somehow come away understanding less than when you started. Time wasted, confidence damaged.', 'Academics -0.75', 'immediate', '["academics"]'::jsonb, '{"academics":-0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-014', 'bad', 'stat', 'Overheard Rumor', '👂', 'A stupid rumor about you starts floating around campus and there is no graceful way to unhear it. Even worse, other people have heard it too.', 'Social -0.75, Wellbeing -0.25', 'immediate', '["social","wellbeing"]'::jsonb, '{"social":-0.75,"wellbeing":-0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-015', 'bad', 'stat', 'Shattered Phone', '📱', 'One bad drop and your phone screen becomes a cracked spiderweb. You can still use it, which almost makes it more annoying.', 'Money -0.75', 'immediate', '["money"]'::jsonb, '{"money":-0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-016', 'bad', 'stat', 'Missed Meal', '🍽️', 'You get too busy, too lazy, or too overwhelmed to eat properly, and your body makes sure you pay for it later.', 'Wellbeing -0.75', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":-0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-017', 'bad', 'stat', 'Laundry Disaster', '🧺', 'Everything is either shrunken, weirdly stained, or somehow all pink now. Doing chores should not feel like losing a boss fight.', 'Money -0.5, Wellbeing -0.5', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":-0.5,"wellbeing":-0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-018', 'bad', 'stat', 'Peer Comparison', '🪞', 'Everyone around you suddenly looks more successful, more stable, and more put together than you. Rationally, that means nothing. Emotionally, it means a lot.', 'Wellbeing -0.5, Social -0.5', 'immediate', '["wellbeing","social"]'::jsonb, '{"wellbeing":-0.5,"social":-0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-019', 'bad', 'stat', 'Broken Printer', '🖨️', 'The assignment is finished, but the printer you need has chosen violence. A simple task becomes an expensive personal feud.', 'Academics -0.5, Money -0.25', 'immediate', '["academics","money"]'::jsonb, '{"academics":-0.5,"money":-0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-020', 'bad', 'stat', 'Wrong Classroom', '🚪', 'You sit in the wrong class just long enough to realize you have deeply misread your day. The rest of the schedule never fully recovers.', 'Academics -0.5', 'immediate', '["academics"]'::jsonb, '{"academics":-0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-021', 'bad', 'stat', 'Terrible Coffee', '☕', 'You pay too much for a drink that tastes burnt and still leaves you exhausted. It feels almost personal.', 'Money -0.25, Wellbeing -0.5', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":-0.25,"wellbeing":-0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-022', 'bad', 'stat', 'Rain-Soaked Walk', '🌧️', 'You get drenched crossing campus and spend the rest of the day cold, damp, and quietly furious at the weather and your choices.', 'Wellbeing -0.5', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":-0.5}'::jsonb, NULL, '{}'::jsonb),

  ('WC-023', 'normal', 'stat', 'Found Twenty', '💵', 'A crumpled bill shows up in a coat pocket or notebook at exactly the right time. It is not a lot, but it feels like divine intervention.', 'Money +1.0', 'immediate', '["money"]'::jsonb, '{"money":1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-024', 'normal', 'stat', 'Unexpected Nap', '😌', 'You lie down for what should be ten minutes and wake up feeling weirdly human again. It solves more than it should.', 'Wellbeing +1.0', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-025', 'normal', 'stat', 'Clean Notes Swap', '📝', 'Someone hands you notes that are actually understandable. The material suddenly stops feeling like it was written in code.', 'Academics +1.0', 'immediate', '["academics"]'::jsonb, '{"academics":1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-026', 'normal', 'stat', 'Friendly Hallway Chat', '🙂', 'A random conversation hits at exactly the right moment and reminds you campus is not entirely full of strangers and deadlines.', 'Social +1.0', 'immediate', '["social"]'::jsonb, '{"social":1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-027', 'normal', 'stat', 'Free Pizza Slice', '🍕', 'You wander into a club event by accident and leave fed. That alone makes the detour worth it.', 'Money +0.5, Wellbeing +0.5', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":0.5,"wellbeing":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-028', 'normal', 'stat', 'Good Playlist', '🎧', 'The right song at the right time makes your walk across campus feel like a movie instead of a commute.', 'Wellbeing +0.75, Social +0.25', 'immediate', '["wellbeing","social"]'::jsonb, '{"wellbeing":0.75,"social":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-029', 'normal', 'stat', 'Study Groove', '🧠', 'For once, your brain actually locks in. The words stick, the work moves, and you stop feeling cursed for a few hours.', 'Academics +0.75, Wellbeing +0.25', 'immediate', '["academics","wellbeing"]'::jsonb, '{"academics":0.75,"wellbeing":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-030', 'normal', 'stat', 'Tipsy Tip Jar', '☕', 'The shift is boring, but customers are weirdly generous and no one makes your life harder than necessary. Rare and beautiful.', 'Money +0.75, Social +0.25', 'immediate', '["money","social"]'::jsonb, '{"money":0.75,"social":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-031', 'normal', 'stat', 'Sunny Bench Break', '🌤️', 'You accidentally take ten peaceful minutes in the sun and come back to the day slightly less like a live grenade.', 'Wellbeing +0.75', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-032', 'normal', 'stat', 'Good Hair Day', '💁', 'Your reflection cooperates for once and your confidence quietly improves all day because of it.', 'Social +0.75', 'immediate', '["social"]'::jsonb, '{"social":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-033', 'normal', 'stat', 'Club Flyer Curiosity', '📣', 'You follow a random flyer or friend into the right room at the right time and come out with something actually useful.', 'Social +0.5, Academics +0.5', 'immediate', '["social","academics"]'::jsonb, '{"social":0.5,"academics":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-034', 'normal', 'stat', 'Meal Swipe Gift', '🎟️', 'Someone with an extra swipe saves you from spending money and from pretending ramen counts as balance.', 'Money +0.5, Wellbeing +0.5', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":0.5,"wellbeing":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-035', 'normal', 'stat', 'Tutor Tip', '💡', 'One offhand explanation from the right person makes a whole topic click in a way your textbook never managed.', 'Academics +0.75', 'immediate', '["academics"]'::jsonb, '{"academics":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-036', 'normal', 'stat', 'Free Bus Ride', '🚌', 'You save both time and energy by catching a lucky ride when your feet were already done with the day.', 'Money +0.25, Wellbeing +0.5', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":0.25,"wellbeing":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-037', 'normal', 'stat', 'Late Library Hours', '🌃', 'The library stays open just long enough for you to actually get something done instead of giving up and going home.', 'Academics +0.5, Wellbeing +0.25', 'immediate', '["academics","wellbeing"]'::jsonb, '{"academics":0.5,"wellbeing":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-038', 'normal', 'stat', 'Compliment from a Stranger', '🌟', 'Someone says something kind at exactly the moment you needed a reason to be less brutal to yourself.', 'Social +0.5, Wellbeing +0.25', 'immediate', '["social","wellbeing"]'::jsonb, '{"social":0.5,"wellbeing":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-039', 'normal', 'stat', 'Campus Freebie Bag', '🎁', 'Most of it is junk, but enough of it is useful that the whole experience feels like a tiny lottery win.', 'Money +0.75', 'immediate', '["money"]'::jsonb, '{"money":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-040', 'normal', 'stat', 'Rain Delay Reset', '☔', 'Plans fall apart, but the forced pause gives you a little more room to breathe than you had before.', 'Wellbeing +0.75', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-041', 'normal', 'stat', 'Lucky Seat in Class', '🪑', 'You sit next to the one person who actually understood the lecture and they explain it in plain English after class.', 'Academics +0.5, Social +0.25', 'immediate', '["academics","social"]'::jsonb, '{"academics":0.5,"social":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-042', 'normal', 'stat', 'Decent Shift', '🍽️', 'Nothing catches fire, nobody yells at you, and the money arrives exactly as promised. That alone feels luxurious.', 'Money +1.0', 'immediate', '["money"]'::jsonb, '{"money":1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-043', 'normal', 'stat', 'Stretch Break', '🧘', 'A simple break for your body resets more tension than you realized you were carrying around all day.', 'Wellbeing +0.75', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-044', 'normal', 'stat', 'Small Scholarship Email', '📩', 'It is not life-changing money, but it lands in your inbox at exactly the right moment to matter.', 'Money +0.75', 'immediate', '["money"]'::jsonb, '{"money":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-045', 'normal', 'stat', 'Lucky Guess', '❓', 'You gamble on a question, a call, or a small decision and somehow come out looking smarter than you felt.', 'Academics +0.75', 'immediate', '["academics"]'::jsonb, '{"academics":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-046', 'normal', 'stat', 'Vending Jackpot', '🥤', 'The machine double-drops your snack and for one beautiful second you believe the universe is not entirely against you.', 'Money +0.25, Wellbeing +0.5', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":0.25,"wellbeing":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-047', 'normal', 'stat', 'Syllabus Surprise', '📋', 'Your professor drops the lowest quiz score and the whole class experiences one shared moment of hope.', 'Academics +0.75, Wellbeing +0.25', 'immediate', '["academics","wellbeing"]'::jsonb, '{"academics":0.75,"wellbeing":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-048', 'normal', 'stat', 'Free Laundry', '🧺', 'Someone left quarters in the machine and you get to wash your clothes without paying. Weirdly thrilling.', 'Money +0.5, Wellbeing +0.5', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":0.5,"wellbeing":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-049', 'normal', 'stat', 'Pet a Campus Dog', '🐕', 'A stranger''s dog lets you pet it for five full minutes and your entire nervous system calms down.', 'Wellbeing +1.0', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-050', 'normal', 'stat', 'Extended Deadline', '⏳', 'The due date moves back by a weekend and suddenly life feels survivable again.', 'Academics +0.75', 'immediate', '["academics"]'::jsonb, '{"academics":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-051', 'normal', 'stat', 'Empty Gym', '🏋️', 'You walk into the rec center and every machine you want is open. No waiting, no crowd, no stress.', 'Wellbeing +0.5, Social +0.25', 'immediate', '["wellbeing","social"]'::jsonb, '{"wellbeing":0.5,"social":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-052', 'normal', 'stat', 'Shared Ride', '🚗', 'A friend splits gas and somehow also makes the trip enjoyable enough that you forget how stressed you were.', 'Money +0.75, Social +0.25', 'immediate', '["money","social"]'::jsonb, '{"money":0.75,"social":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-053', 'normal', 'stat', 'Power Nap', '😴', 'Exactly twenty minutes of unconsciousness resets your personality in the best possible way.', 'Wellbeing +0.75', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-054', 'normal', 'stat', 'Free Sample Day', '🛍️', 'You drift through events collecting snacks, tote bags, and random little free things until the whole day feels profitable.', 'Money +1.0', 'immediate', '["money"]'::jsonb, '{"money":1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-055', 'normal', 'stat', 'Ghosted Class', '👻', 'The TA never shows, everyone leaves, and you gain an hour of your life back with zero guilt.', 'Wellbeing +0.5, Academics +0.25', 'immediate', '["wellbeing","academics"]'::jsonb, '{"wellbeing":0.5,"academics":0.25}'::jsonb, NULL, '{}'::jsonb),

  ('WC-056', 'good', 'stat', 'Professor Mercy', '🎓', 'The professor gives the class a hint, extension, or break they absolutely did not have to give you.', 'Academics +1.5', 'immediate', '["academics"]'::jsonb, '{"academics":1.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-057', 'good', 'stat', 'Perfect Sleep', '😴', 'You wake up feeling suspiciously rested, like your body finally remembered it is supposed to help you.', 'Wellbeing +1.5', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":1.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-058', 'good', 'stat', 'Cash Gig', '💼', 'A random one-day job appears and somehow pays better than any of your normal opportunities.', 'Money +1.5', 'immediate', '["money"]'::jsonb, '{"money":1.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-059', 'good', 'stat', 'Magnetic Energy', '✨', 'People are weirdly drawn to you today, and every conversation goes a little smoother than expected.', 'Social +1.5', 'immediate', '["social"]'::jsonb, '{"social":1.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-060', 'good', 'stat', 'Locked-In Study Day', '📚', 'The distractions vanish and your brain finally behaves. You get through a shocking amount of work without suffering.', 'Academics +1.25, Wellbeing +0.25', 'immediate', '["academics","wellbeing"]'::jsonb, '{"academics":1.25,"wellbeing":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-061', 'good', 'stat', 'Healing Weekend', '🛀', 'You somehow spend a whole stretch of time making healthy choices and not regretting a single one of them.', 'Wellbeing +1.25, Social +0.25', 'immediate', '["wellbeing","social"]'::jsonb, '{"wellbeing":1.25,"social":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-062', 'good', 'stat', 'Great Tips Night', '🍻', 'Customers are nice, management is absent, and the money stacks faster than your stress does.', 'Money +1.25, Social +0.25', 'immediate', '["money","social"]'::jsonb, '{"money":1.25,"social":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-063', 'good', 'stat', 'Campus Celebrity Moment', '📸', 'For one evening, people know your name for a good reason and it feels incredible.', 'Social +1.25, Wellbeing +0.25', 'immediate', '["social","wellbeing"]'::jsonb, '{"social":1.25,"wellbeing":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-064', 'good', 'stat', 'Advisor Hookup', '🧠', 'You get pointed toward exactly the right office, person, or resource at exactly the right time.', 'Academics +1.0, Money +0.5', 'immediate', '["academics","money"]'::jsonb, '{"academics":1.0,"money":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-065', 'good', 'stat', 'Recharge Day', '🌿', 'You do less, breathe more, and somehow come out ahead because your brain and body stop fighting you for once.', 'Wellbeing +1.0, Academics +0.5', 'immediate', '["wellbeing","academics"]'::jsonb, '{"wellbeing":1.0,"academics":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-066', 'good', 'stat', 'Good Crowd', '🫶', 'You land in a room where everyone is easy to talk to and no one drains your social battery.', 'Social +1.0, Money +0.5', 'immediate', '["social","money"]'::jsonb, '{"social":1.0,"money":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-067', 'good', 'stat', 'Paid Opportunity', '📑', 'Somebody notices competence and turns it into actual money. Rare, beautiful, and highly motivating.', 'Money +1.0, Academics +0.5', 'immediate', '["money","academics"]'::jsonb, '{"money":1.0,"academics":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-068', 'good', 'stat', 'Lucky Break', '🍀', 'A few small things go right in a row and your entire day becomes easier to live inside.', 'Academics +0.75, Wellbeing +0.75', 'immediate', '["academics","wellbeing"]'::jsonb, '{"academics":0.75,"wellbeing":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-069', 'good', 'stat', 'Confidence Surge', '🔥', 'You stop second-guessing every move and suddenly life feels a lot more playable.', 'Social +0.75, Wellbeing +0.75', 'immediate', '["social","wellbeing"]'::jsonb, '{"social":0.75,"wellbeing":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-070', 'good', 'stat', 'Free Groceries', '🛒', 'Someone moving out hands you a ridiculous amount of usable food. You feel briefly rich and strangely cared for.', 'Money +0.75, Wellbeing +0.75', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":0.75,"wellbeing":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-071', 'good', 'stat', 'Research Assistant Lead', '🔬', 'A professor, TA, or grad student points you toward a real opportunity that makes you feel terrifyingly competent.', 'Academics +1.25', 'immediate', '["academics"]'::jsonb, '{"academics":1.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-072', 'good', 'stat', 'Great Gym Session', '🏋️', 'Your body cooperates, your lungs behave, and you leave feeling annoyingly healthy and smug.', 'Wellbeing +1.25', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":1.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-073', 'good', 'stat', 'Unexpected Venmo', '📲', 'Somebody finally pays you back for something ancient and you stop believing in karma out of sheer surprise.', 'Money +1.25', 'immediate', '["money"]'::jsonb, '{"money":1.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-074', 'good', 'stat', 'Party Win', '🪩', 'You go out, have fun, meet people, and somehow avoid doing anything embarrassing. Historic success.', 'Social +1.25', 'immediate', '["social"]'::jsonb, '{"social":1.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-075', 'good', 'stat', 'Dean''s List Letter', '📜', 'A letter arrives telling you your grades put you on the honors list. It glows on your desk like emotional sunscreen.', 'Academics +1.25, Wellbeing +0.25', 'immediate', '["academics","wellbeing"]'::jsonb, '{"academics":1.25,"wellbeing":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-076', 'good', 'stat', 'Weekend Trip', '🏕️', 'You escape campus with the exact right people and return genuinely refreshed instead of just less exhausted.', 'Wellbeing +1.25, Social +0.25', 'immediate', '["wellbeing","social"]'::jsonb, '{"wellbeing":1.25,"social":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-077', 'good', 'stat', 'Research Grant', '🔬', 'A small grant lands with your name on it. Not life-changing, but enough to make your future feel a little less fake.', 'Money +1.25, Academics +0.25', 'immediate', '["money","academics"]'::jsonb, '{"money":1.25,"academics":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-078', 'good', 'stat', 'Perfect Test Score', '💯', 'You get a score back so good you check it three times before trusting your own eyes.', 'Academics +1.5', 'immediate', '["academics"]'::jsonb, '{"academics":1.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-079', 'good', 'stat', 'Roommate Bought Groceries', '🛒', 'You open the fridge and discover your roommate stocked it like they care about your survival. Weirdly moving.', 'Money +1.0, Wellbeing +0.5', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":1.0,"wellbeing":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-080', 'good', 'stat', 'Alumni Connection', '🤝', 'A random intro turns into a real professional contact who actually follows through. You feel briefly chosen.', 'Social +1.0, Money +0.5', 'immediate', '["social","money"]'::jsonb, '{"social":1.0,"money":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-081', 'good', 'stat', 'Campus Job Promotion', '📈', 'Your boss offers you a better role with better pay and only slightly more responsibility. You say yes immediately.', 'Money +1.5', 'immediate', '["money"]'::jsonb, '{"money":1.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-082', 'good', 'stat', 'Concert Tickets', '🎫', 'A friend hands you tickets to something you had no business attending and the whole night feels stolen from a better timeline.', 'Social +1.25, Wellbeing +0.25', 'immediate', '["social","wellbeing"]'::jsonb, '{"social":1.25,"wellbeing":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-083', 'good', 'stat', 'Wellness Retreat', '🧖', 'Campus runs a free spa-day event and you emerge feeling suspiciously stable and at peace with your own existence.', 'Wellbeing +1.5', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":1.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-084', 'good', 'stat', 'Study Abroad Info', '✈️', 'An info session about a semester abroad makes your future feel bigger and more exciting than it did this morning.', 'Social +1.0, Academics +0.5', 'immediate', '["social","academics"]'::jsonb, '{"social":1.0,"academics":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-085', 'good', 'stat', 'Campus Award', '🏅', 'You win a minor campus award that comes with a certificate, a handshake, and actual money. Not bad for showing up.', 'Academics +1.0, Money +0.5', 'immediate', '["academics","money"]'::jsonb, '{"academics":1.0,"money":0.5}'::jsonb, NULL, '{}'::jsonb),

  ('WC-086', 'really_good', 'stat', 'Secret Answer Key', '🔑', 'You stumble into exactly the clue, answer pattern, or hidden edge you were never supposed to see. It feels illegal and fantastic.', 'Academics +2.0', 'immediate', '["academics"]'::jsonb, '{"academics":2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-087', 'really_good', 'stat', 'Scholarship Win', '🏆', 'Real money, no weird catch, no scam, no strings. For one shining moment the institution gives back.', 'Money +2.0', 'immediate', '["money"]'::jsonb, '{"money":2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-088', 'really_good', 'stat', 'Miracle Recovery', '🌈', 'Whatever was wrong with your body or brain gets patched for a while and you feel like a person again.', 'Wellbeing +2.0', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-089', 'really_good', 'stat', 'Legendary Social Night', '🎉', 'Everything about the night lands perfectly and somehow you become exactly the version of yourself you wanted to be.', 'Social +2.0', 'immediate', '["social"]'::jsonb, '{"social":2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-090', 'really_good', 'stat', 'Dream Internship Offer', '💼', 'The kind of opportunity you assumed was a long shot calls back with a yes. Your future suddenly looks expensive in a good way.', 'Money +1.5, Academics +0.75', 'immediate', '["money","academics"]'::jsonb, '{"money":1.5,"academics":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-091', 'really_good', 'stat', 'Peak Flow State', '🧠', 'You become terrifyingly efficient for one stretch of time and tear through work that should have ruined your week.', 'Academics +1.5, Wellbeing +0.75', 'immediate', '["academics","wellbeing"]'::jsonb, '{"academics":1.5,"wellbeing":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-092', 'really_good', 'stat', 'Perfect Reset Weekend', '🛏️', 'You sleep, eat, breathe, and recover like somebody in a productivity vlog instead of a college student.', 'Wellbeing +1.5, Social +0.75', 'immediate', '["wellbeing","social"]'::jsonb, '{"wellbeing":1.5,"social":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-093', 'really_good', 'stat', 'Main Character Arc', '🌟', 'For one entire day, the universe seems to remember your name and reward your existence for it.', 'Social +1.5, Money +0.75', 'immediate', '["social","money"]'::jsonb, '{"social":1.5,"money":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-094', 'really_good', 'stat', 'Double Lucky Break', '🎲', 'Two unrelated good things happen back to back and you spend hours waiting for the cosmic catch that never comes.', 'Academics +1.0, Money +1.0', 'immediate', '["academics","money"]'::jsonb, '{"academics":1.0,"money":1.0}'::jsonb, NULL, '{}'::jsonb),
  ('WC-095', 'really_good', 'stat', 'Full Tuition Grant', '💰', 'A grant application you barely remember submitting comes back approved. The number on the email makes you sit down.', 'Money +2.0', 'immediate', '["money"]'::jsonb, '{"money":2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-096', 'really_good', 'stat', 'Published Research', '📰', 'Your work gets cited, published, or noticed by somebody who actually matters. It feels unreal in the best possible way.', 'Academics +2.0', 'immediate', '["academics"]'::jsonb, '{"academics":2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-097', 'really_good', 'stat', 'Perfect Health Check', '🩺', 'Every number on your checkup looks great and for one moment adulthood feels surprisingly survivable.', 'Wellbeing +2.0', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-098', 'really_good', 'stat', 'Viral Moment', '📱', 'A post of yours blows up in the best way possible. Friends, followers, and random opportunities start appearing out of nowhere.', 'Social +2.0', 'immediate', '["social"]'::jsonb, '{"social":2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-099', 'really_good', 'stat', 'Dream Job Offer', '💎', 'The kind of opportunity you assumed belonged to other people suddenly has your name on it.', 'Money +1.5, Academics +0.75', 'immediate', '["money","academics"]'::jsonb, '{"money":1.5,"academics":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-100', 'really_good', 'stat', 'Perfect Week', '🌈', 'Everything lines up for one stretch of time and you become briefly unstoppable in every category that matters.', 'Academics +1.0, Wellbeing +0.5, Social +0.5, Money +0.5', 'immediate', '["academics","wellbeing","social","money"]'::jsonb, '{"academics":1.0,"wellbeing":0.5,"social":0.5,"money":0.5}'::jsonb, NULL, '{}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  tier = EXCLUDED.tier,
  type = EXCLUDED.type,
  title = EXCLUDED.title,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  effect_summary = EXCLUDED.effect_summary,
  duration = EXCLUDED.duration,
  target_stats = EXCLUDED.target_stats,
  immediate = EXCLUDED.immediate,
  future = EXCLUDED.future,
  metadata = EXCLUDED.metadata;

INSERT INTO private_event_defs (
  id,
  title,
  description,
  effect_type,
  code_prefix,
  risk_payload,
  reward_payload,
  metadata
) VALUES
  ('PRIV-001', 'Secret Study Group', 'A grad student slips you an invite to a locked basement room where the most stressed people on campus quietly get ahead together.', 'flat_stats', 'STUDY', '{}'::jsonb, '{"academics":1.75}'::jsonb, '{"theme":"academics"}'::jsonb),
  ('PRIV-002', 'Underground Poker', 'A whispered invite leads you to a packed apartment where everyone is acting like money grows back.', 'flat_stats', 'POKER', '{}'::jsonb, '{"money":1.75}'::jsonb, '{"theme":"money"}'::jsonb),
  ('PRIV-003', 'VIP Concert', 'A backstage pass lands in your hands and the whole night feels louder and better than it should.', 'flat_stats', 'VIP', '{}'::jsonb, '{"social":1.25,"wellbeing":0.5}'::jsonb, '{"theme":"music"}'::jsonb),
  ('PRIV-004', 'Office Hours Invite', 'A direct invitation from a professor turns into exactly the kind of academic edge most people wish they had.', 'flat_stats', 'OFFICE', '{}'::jsonb, '{"academics":1.75}'::jsonb, '{"theme":"academics"}'::jsonb),
  ('PRIV-005', 'Greek Mixer', 'A handwritten invite gets you into a room full of social momentum and very little subtlety.', 'flat_stats', 'GREEK', '{}'::jsonb, '{"social":1.75}'::jsonb, '{"theme":"social"}'::jsonb),
  ('PRIV-006', 'Insider Internship', 'A not-quite-public job opening falls into your lap and suddenly your future looks a little more expensive in a good way.', 'flat_stats', 'INTERN', '{}'::jsonb, '{"money":1.25,"academics":0.5}'::jsonb, '{"theme":"career"}'::jsonb),
  ('PRIV-007', 'Rooftop Party', 'You end up somewhere you should not technically be, with exactly the kind of people you wanted to be around.', 'flat_stats', 'ROOF', '{}'::jsonb, '{"social":1.5,"wellbeing":0.25}'::jsonb, '{"theme":"social"}'::jsonb),
  ('PRIV-008', 'Quiet Tutor', 'A one-on-one session gives you more clarity in an hour than lecture did all week.', 'flat_stats', 'TUTOR', '{}'::jsonb, '{"academics":1.5,"wellbeing":0.25}'::jsonb, '{"theme":"academics"}'::jsonb),
  ('PRIV-009', 'Late Shift', 'A one-night side job turns out to be unexpectedly worth your time.', 'flat_stats', 'DELIV', '{}'::jsonb, '{"money":1.75}'::jsonb, '{"theme":"money"}'::jsonb),
  ('PRIV-010', 'Supper Club', 'An invite-only dinner gives you great food, easy conversation, and a better night than you planned for.', 'flat_stats', 'SUPPER', '{}'::jsonb, '{"social":0.75,"wellbeing":1.0}'::jsonb, '{"theme":"food"}'::jsonb),
  ('PRIV-011', 'Textbook Hookup', 'You get access to the exact materials you needed without the usual hassle or cost.', 'flat_stats', 'BOOK', '{}'::jsonb, '{"academics":1.0,"money":0.75}'::jsonb, '{"theme":"money"}'::jsonb),
  ('PRIV-012', 'After-Hours Lab', 'A private lab visit makes your coursework feel much more real and much more manageable.', 'flat_stats', 'LAB', '{}'::jsonb, '{"academics":1.5,"money":0.25}'::jsonb, '{"theme":"academics"}'::jsonb),
  ('PRIV-013', 'Comedy Night', 'A tiny room off campus turns into one of those nights people keep joking about for weeks.', 'flat_stats', 'COMEDY', '{}'::jsonb, '{"social":1.25,"wellbeing":0.5}'::jsonb, '{"theme":"social"}'::jsonb),
  ('PRIV-014', 'Rival Club Leak', 'You get access to the kind of gossip and intel that makes campus politics weirdly useful.', 'flat_stats', 'RIVAL', '{}'::jsonb, '{"social":1.0,"money":0.75}'::jsonb, '{"theme":"social"}'::jsonb),
  ('PRIV-015', 'Professor Dinner', 'A small faculty dinner gives you better access, better conversation, and more academic confidence than expected.', 'flat_stats', 'DINNER', '{}'::jsonb, '{"academics":1.0,"social":0.75}'::jsonb, '{"theme":"career"}'::jsonb),
  ('PRIV-016', 'Hidden Art Show', 'A private exhibit turns out to be exactly the sort of social and emotional lift you needed.', 'flat_stats', 'ART', '{}'::jsonb, '{"social":1.25,"wellbeing":0.5}'::jsonb, '{"theme":"arts"}'::jsonb),
  ('PRIV-017', 'Finance Backroom', 'A room full of overconfident business students somehow leaves you with real money and useful takeaways.', 'flat_stats', 'FIN', '{}'::jsonb, '{"money":1.5,"academics":0.25}'::jsonb, '{"theme":"money"}'::jsonb),
  ('PRIV-018', 'Basement Cinema', 'A secret movie night gives you one of those rare evenings that feels low-stakes and deeply worthwhile.', 'flat_stats', 'CINEMA', '{}'::jsonb, '{"social":0.75,"wellbeing":1.0}'::jsonb, '{"theme":"social"}'::jsonb),
  ('PRIV-019', 'Yoga Loft', 'A private class above a storefront leaves your body and brain in much better shape than before.', 'flat_stats', 'YOGA', '{}'::jsonb, '{"wellbeing":1.75}'::jsonb, '{"theme":"wellbeing"}'::jsonb),
  ('PRIV-020', 'Answer Rumor', 'You hear a study rumor at exactly the right time and use it to get ahead before anyone else can.', 'flat_stats', 'LEAK', '{}'::jsonb, '{"academics":1.75}'::jsonb, '{"theme":"academics"}'::jsonb),
  ('PRIV-021', 'Barista Trial', 'A one-night tryout at a cafe turns out to be far more worth it than expected.', 'flat_stats', 'BAR', '{}'::jsonb, '{"money":1.25,"social":0.5}'::jsonb, '{"theme":"money"}'::jsonb),
  ('PRIV-022', 'Survey Stack', 'A weird bundle of research studies somehow turns into easy money and a little academic usefulness too.', 'flat_stats', 'SURVEY', '{}'::jsonb, '{"money":1.25,"academics":0.5}'::jsonb, '{"theme":"money"}'::jsonb),
  ('PRIV-023', 'Road Trip', 'A reckless little escape from campus gives you stories, oxygen, and a night that feels bigger than your routine.', 'flat_stats', 'TRIP', '{}'::jsonb, '{"social":1.25,"wellbeing":0.5}'::jsonb, '{"theme":"social"}'::jsonb),
  ('PRIV-024', 'Focus Session', 'A locked-in private work session goes far better than you expected and actually changes your week.', 'flat_stats', 'FOCUS', '{}'::jsonb, '{"academics":1.5,"wellbeing":0.25}'::jsonb, '{"theme":"academics"}'::jsonb),
  ('PRIV-025', 'House Show', 'A last-minute basement concert turns into a much better social night than your original plans would have been.', 'flat_stats', 'SHOW', '{}'::jsonb, '{"social":1.25,"wellbeing":0.5}'::jsonb, '{"theme":"music"}'::jsonb),
  ('PRIV-026', 'Advisor Rec', 'A personal recommendation opens a real door and makes the rest of the semester feel a bit more possible.', 'flat_stats', 'REC', '{}'::jsonb, '{"academics":0.75,"money":1.0}'::jsonb, '{"theme":"career"}'::jsonb),
  ('PRIV-027', 'Bookstore Buyback', 'A quiet off-campus deal turns old books into very welcome cash.', 'flat_stats', 'BUYBACK', '{}'::jsonb, '{"money":1.75}'::jsonb, '{"theme":"money"}'::jsonb),
  ('PRIV-028', 'Archive Room', 'A hidden archive access slot gives you exactly the edge your classes needed.', 'flat_stats', 'ARCHIVE', '{}'::jsonb, '{"academics":1.75}'::jsonb, '{"theme":"academics"}'::jsonb),
  ('PRIV-029', 'Dance Floor', 'A hidden party lands perfectly and gives you the kind of night that resets your social battery upward.', 'flat_stats', 'DANCE', '{}'::jsonb, '{"social":1.5,"wellbeing":0.25}'::jsonb, '{"theme":"social"}'::jsonb),
  ('PRIV-030', 'Meditation Circle', 'A private quiet session ends up helping far more than your cynical side wanted to admit.', 'flat_stats', 'MEDITATE', '{}'::jsonb, '{"wellbeing":1.5,"academics":0.25}'::jsonb, '{"theme":"wellbeing"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  effect_type = EXCLUDED.effect_type,
  code_prefix = EXCLUDED.code_prefix,
  risk_payload = EXCLUDED.risk_payload,
  reward_payload = EXCLUDED.reward_payload,
  metadata = EXCLUDED.metadata;

-- Public event definitions (action-specific flat modifiers)
INSERT INTO public_event_defs (
  id,
  title,
  description,
  effect_type,
  flat_stat_changes,
  action_modifiers,
  metadata
) VALUES
  ('PUB-001', 'Heatwave', 'The whole campus feels sticky and overheated, and people get worn down faster than usual.', 'action_modifier', '{}'::jsonb, '{"exercise": {"wellbeing": -0.25}}'::jsonb, '{"theme": "weather"}'::jsonb),
  ('PUB-002', 'Cram Season', 'The library is packed and the stress is real, but the academic energy is impossible to ignore.', 'action_modifier', '{}'::jsonb, '{"study": {"academics": 0.25}}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PUB-003', 'Block Party', 'Half the school seems to know where the music is coming from, and suddenly everyone wants to be social.', 'action_modifier', '{}'::jsonb, '{"socialize": {"social": 0.25}}'::jsonb, '{"theme": "social"}'::jsonb),
  ('PUB-004', 'Power Outage', 'A campus outage throws off routines, patience, and everybody''s ability to get anything done cleanly.', 'action_modifier', '{}'::jsonb, '{"study": {"academics": -0.25}}'::jsonb, '{"theme": "disruption"}'::jsonb),
  ('PUB-005', 'Hiring Spree', 'Every shop near campus seems desperate for help and money feels slightly easier to find today.', 'action_modifier', '{}'::jsonb, '{"work": {"money": 0.25}}'::jsonb, '{"theme": "money"}'::jsonb),
  ('PUB-006', 'Wellness Week', 'The school is pretending to care about mental health, and for one day some of it actually helps.', 'action_modifier', '{}'::jsonb, '{"rest": {"wellbeing": 0.25}, "sleep": {"wellbeing": 0.25}}'::jsonb, '{"theme": "wellbeing"}'::jsonb),
  ('PUB-007', 'Snow Day', 'The campus goes quiet under snow and even the most stressed people slow down a little.', 'action_modifier', '{}'::jsonb, '{"class": {"academics": -0.25}}'::jsonb, '{"theme": "weather"}'::jsonb),
  ('PUB-008', 'Flu Outbreak', 'Everyone seems one cough away from collapse and nobody feels quite right.', 'action_modifier', '{}'::jsonb, '{"socialize": {"wellbeing": -0.25}}'::jsonb, '{"theme": "health"}'::jsonb),
  ('PUB-009', 'Career Fair', 'Students in blazers swarm the student center and the whole day feels slightly more professional.', 'action_modifier', '{}'::jsonb, '{"work": {"money": 0.25}}'::jsonb, '{"theme": "career"}'::jsonb),
  ('PUB-010', 'Coffee Promo', 'The cafe is running deals and the whole school feels a little more awake than usual.', 'action_modifier', '{}'::jsonb, '{"socialize": {"social": 0.25}}'::jsonb, '{"theme": "study"}'::jsonb),
  ('PUB-011', 'Open Mic Night', 'People are showing up braver than usual and campus conversations come easier because of it.', 'action_modifier', '{}'::jsonb, '{"socialize": {"social": 0.25}}'::jsonb, '{"theme": "performance"}'::jsonb),
  ('PUB-012', 'Pop Quiz Panic', 'Rumors about surprise quizzes make everyone sharper and more miserable at the same time.', 'action_modifier', '{}'::jsonb, '{"study": {"academics": 0.25}}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PUB-013', 'Free Breakfast', 'The school hands out actual food in the morning and morale rises way more than it should.', 'action_modifier', '{}'::jsonb, '{"rest": {"wellbeing": 0.25}}'::jsonb, '{"theme": "food"}'::jsonb),
  ('PUB-014', 'Election Week', 'Clipboard people are everywhere and campus is slightly more socially charged than usual.', 'action_modifier', '{}'::jsonb, '{"socialize": {"social": 0.25}}'::jsonb, '{"theme": "campus politics"}'::jsonb),
  ('PUB-015', 'Library Flooding', 'Part of the library is unusable and everyone who needed quiet space feels it.', 'action_modifier', '{}'::jsonb, '{"study": {"academics": -0.25}}'::jsonb, '{"theme": "disruption"}'::jsonb),
  ('PUB-016', 'Guest Lecture', 'A visiting speaker makes the campus feel slightly smarter and slightly more social for a day.', 'action_modifier', '{}'::jsonb, '{"class": {"academics": 0.25}}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PUB-017', 'Fun Run', 'A campus fitness event nudges people into being a little healthier and a little more connected.', 'action_modifier', '{}'::jsonb, '{"exercise": {"wellbeing": 0.25, "social": 0.25}}'::jsonb, '{"theme": "fitness"}'::jsonb),
  ('PUB-018', 'Tuition Panic', 'A badly timed billing reminder reminds everyone that being here is very expensive.', 'action_modifier', '{}'::jsonb, '{"work": {"money": -0.25}}'::jsonb, '{"theme": "money"}'::jsonb),
  ('PUB-019', 'Volunteer Fair', 'The campus mood gets briefly more wholesome and people feel a little better around each other.', 'action_modifier', '{}'::jsonb, '{"socialize": {"social": 0.25}}'::jsonb, '{"theme": "community"}'::jsonb),
  ('PUB-020', 'Hackathon Weekend', 'Everyone is tired but strangely productive, and the academic mood spikes even if the sleep does not.', 'action_modifier', '{}'::jsonb, '{"study": {"academics": 0.25}}'::jsonb, '{"theme": "tech"}'::jsonb),
  ('PUB-021', 'Spring Sunshine', 'Nice weather makes campus feel easier to live in and people noticeably soften.', 'action_modifier', '{}'::jsonb, '{"socialize": {"social": 0.25}, "exercise": {"wellbeing": 0.25}}'::jsonb, '{"theme": "weather"}'::jsonb),
  ('PUB-022', 'Rainy Gloom', 'Grey skies hang over everything and the energy on campus drops with them.', 'action_modifier', '{}'::jsonb, '{"exercise": {"wellbeing": -0.25}}'::jsonb, '{"theme": "weather"}'::jsonb),
  ('PUB-023', 'Dining Hall Upgrade', 'The food is weirdly decent today and people are less miserable because of it.', 'action_modifier', '{}'::jsonb, '{"rest": {"wellbeing": 0.25}}'::jsonb, '{"theme": "food"}'::jsonb),
  ('PUB-024', 'Renovation Noise', 'Construction noise follows you across campus and concentration suffers for it.', 'action_modifier', '{}'::jsonb, '{"study": {"academics": -0.25}}'::jsonb, '{"theme": "construction"}'::jsonb),
  ('PUB-025', 'Campus Festival', 'Booths, music, and random free stuff make the whole campus feel more open and social.', 'action_modifier', '{}'::jsonb, '{"socialize": {"social": 0.5}}'::jsonb, '{"theme": "festival"}'::jsonb),
  ('PUB-026', 'Housing Email Scare', 'One terrible email about housing logistics is enough to ruin everyone''s mood and budget thoughts.', 'action_modifier', '{}'::jsonb, '{"rest": {"wellbeing": -0.25}}'::jsonb, '{"theme": "stress"}'::jsonb),
  ('PUB-027', 'Midnight Breakfast', 'A late-night food event gives people a small emotional and financial lift.', 'action_modifier', '{}'::jsonb, '{"rest": {"wellbeing": 0.25}}'::jsonb, '{"theme": "food"}'::jsonb),
  ('PUB-028', 'Office Hours Push', 'Professors are unusually visible and the day ends up a little more academically useful than normal.', 'action_modifier', '{}'::jsonb, '{"class": {"academics": 0.25}}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PUB-029', 'Gym Promo', 'The rec center is suddenly full of free stuff and positive energy, and people really do feel it.', 'action_modifier', '{}'::jsonb, '{"exercise": {"wellbeing": 0.25}}'::jsonb, '{"theme": "fitness"}'::jsonb),
  ('PUB-030', 'Slow Wi-Fi Day', 'The internet crawls and everyone who needed it wants to scream.', 'action_modifier', '{}'::jsonb, '{"study": {"academics": -0.25}}'::jsonb, '{"theme": "tech"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  effect_type = EXCLUDED.effect_type,
  flat_stat_changes = EXCLUDED.flat_stat_changes,
  action_modifiers = EXCLUDED.action_modifiers,
  metadata = EXCLUDED.metadata;
