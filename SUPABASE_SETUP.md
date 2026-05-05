# Supabase Setup

Copy these SQL blocks into the Supabase SQL Editor **in order**.

## 1. Core Schema

```sql
-- College Life Simulator — Full Core Schema
-- Safe to run on an existing project.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS rooms (
  code TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'setup', 'day', 'resolution', 'exam', 'end')),
  host_id UUID,
  current_day INTEGER NOT NULL DEFAULT 1,
  current_phase TEXT NOT NULL DEFAULT 'lobby' CHECK (current_phase IN ('lobby', 'setup', 'day', 'resolution', 'exam', 'end')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS relationships (
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  player_a UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player_b UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 3),
  progress INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (room_code, player_a, player_b),
  CHECK (player_a < player_b)
);

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

CREATE TABLE IF NOT EXISTS wildcard_decks (
  room_code TEXT PRIMARY KEY REFERENCES rooms(code) ON DELETE CASCADE,
  draw_pile JSONB NOT NULL DEFAULT '[]'::jsonb,
  discard_pile JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_public_events (
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  public_event_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_code, day)
);

CREATE TABLE IF NOT EXISTS room_private_events (
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  private_event_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_code, day)
);

CREATE INDEX IF NOT EXISTS idx_players_room ON players(room_code);
CREATE INDEX IF NOT EXISTS idx_day_actions_room_day ON day_actions(room_code, day);
CREATE INDEX IF NOT EXISTS idx_events_room_day ON events(room_code, day);
CREATE INDEX IF NOT EXISTS idx_resolutions_room_day ON resolutions(room_code, day);
CREATE INDEX IF NOT EXISTS idx_wildcard_decks_room ON wildcard_decks(room_code);
CREATE INDEX IF NOT EXISTS idx_room_public_events_room ON room_public_events(room_code);
CREATE INDEX IF NOT EXISTS idx_room_private_events_room ON room_private_events(room_code);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wildcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_public_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_private_events ENABLE ROW LEVEL SECURITY;

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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'day_actions' AND policyname = 'Allow read day_actions') THEN
    CREATE POLICY "Allow read day_actions" ON day_actions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'Allow read events') THEN
    CREATE POLICY "Allow read events" ON events FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resolutions' AND policyname = 'Allow read resolutions') THEN
    CREATE POLICY "Allow read resolutions" ON resolutions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wildcard_decks' AND policyname = 'Allow read wildcard_decks') THEN
    CREATE POLICY "Allow read wildcard_decks" ON wildcard_decks FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'room_public_events' AND policyname = 'Allow read room_public_events') THEN
    CREATE POLICY "Allow read room_public_events" ON room_public_events FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'room_private_events' AND policyname = 'Allow read room_private_events') THEN
    CREATE POLICY "Allow read room_private_events" ON room_private_events FOR SELECT USING (true);
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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'day_actions' AND policyname = 'Allow all day_actions') THEN
    CREATE POLICY "Allow all day_actions" ON day_actions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'Allow all events') THEN
    CREATE POLICY "Allow all events" ON events FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'resolutions' AND policyname = 'Allow all resolutions') THEN
    CREATE POLICY "Allow all resolutions" ON resolutions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wildcard_decks' AND policyname = 'Allow all wildcard_decks') THEN
    CREATE POLICY "Allow all wildcard_decks" ON wildcard_decks FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'room_public_events' AND policyname = 'Allow all room_public_events') THEN
    CREATE POLICY "Allow all room_public_events" ON room_public_events FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'room_private_events' AND policyname = 'Allow all room_private_events') THEN
    CREATE POLICY "Allow all room_private_events" ON room_private_events FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'players'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE players;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'day_actions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE day_actions;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE events;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'resolutions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE resolutions;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'wildcard_decks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE wildcard_decks;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'room_public_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE room_public_events;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'room_private_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE room_private_events;
  END IF;
END $$;
```

## 2. Verify

```sql
select count(*) from wildcard_decks;
select count(*) from wildcard_defs;
select count(*) from public_event_defs;
select count(*) from private_event_defs;
select count(*) from room_public_events;
select count(*) from room_private_events;
```
