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
CREATE POLICY "Allow read room_public_events" ON room_public_events FOR SELECT USING (true);
CREATE POLICY "Allow read room_private_events" ON room_private_events FOR SELECT USING (true);
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
CREATE POLICY "Allow all room_public_events" ON room_public_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all room_private_events" ON room_private_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all resolutions" ON resolutions FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE wildcard_decks;
ALTER PUBLICATION supabase_realtime ADD TABLE day_actions;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE room_public_events;
ALTER PUBLICATION supabase_realtime ADD TABLE room_private_events;
ALTER PUBLICATION supabase_realtime ADD TABLE resolutions;

-- Wildcard card definitions (100 cards)
INSERT INTO wildcard_defs (id, tier, type, title, emoji, description, effect_summary, duration, target_stats, immediate, future, metadata) VALUES
  ('WC-001', 'really_bad', 'stat', 'Academic Probation', '📉', 'A late-night portal check reveals that your academic situation is much worse than you thought. The panic does not help.', 'Academics -2.0', 'immediate', '["academics"]'::jsonb, '{"academics":-2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-002', 'really_bad', 'stat', 'Food Poisoning', '🤢', 'Something from the dining hall wages biological warfare on your stomach. You spend the rest of the day regretting every life choice that led here.', 'Wellbeing -2.0', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":-2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-003', 'really_bad', 'stat', 'Wallet Gone', '💸', 'Somewhere between campus, the bus stop, and your dorm, your wallet stops existing. You will be reconstructing this disaster for days.', 'Money -2.0', 'immediate', '["money"]'::jsonb, '{"money":-2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-004', 'really_bad', 'stat', 'Public Humiliation', '😬', 'You say something incredibly wrong in a crowded room and everyone remembers it longer than they should. The social fallout is immediate.', 'Social -2.0', 'immediate', '["social"]'::jsonb, '{"social":-2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-005', 'really_bad', 'stat', 'Group Project Disaster', '🧨', 'Your teammates vanish, the document is empty, and the deadline is now. You absorb the consequences personally.', 'Academics -1.0, Wellbeing -1.0', 'immediate', '["academics","wellbeing"]'::jsonb, '{"academics":-1,"wellbeing":-1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-006', 'really_bad', 'stat', 'ER Visit', '🚑', 'A dumb accident eats your time, your energy, and more money than you want to think about. Campus life continues without mercy.', 'Money -1.0, Wellbeing -1.5', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":-1,"wellbeing":-1.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-007', 'really_bad', 'stat', 'Spiral Night', '🌪️', 'What starts as a little doomscrolling turns into a full emotional freefall. By sunrise you are somehow both tired and ashamed.', 'Social -0.5, Wellbeing -1.5', 'immediate', '["social","wellbeing"]'::jsonb, '{"social":-0.5,"wellbeing":-1.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-008', 'really_bad', 'stat', 'Dorm Flood', '💧', 'A pipe bursts or a ceiling leaks, and your room briefly becomes a shallow indoor pond. Cleanup costs money and your last nerve.', 'Money -1.5, Wellbeing -0.5', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":-1.5,"wellbeing":-0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-009', 'really_bad', 'stat', 'Identity Crisis', '🫠', 'You lose an entire evening staring at the ceiling and questioning your path, your major, and maybe your entire personality.', 'Academics -0.5, Social -0.5, Wellbeing -1.0', 'immediate', '["academics","social","wellbeing"]'::jsonb, '{"academics":-0.5,"social":-0.5,"wellbeing":-1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-010', 'really_bad', 'gimmick', 'Blacklisted Shift', '🚫', 'You mouth off at the wrong supervisor and discover that service jobs have long memories. The punishment arrives the next time you try to work.', 'Money -1.0, and your next Work gives 0 Money', 'next_action', '["money"]'::jsonb, '{"money":-1}'::jsonb, '{"kind":"action_override","duration":"next_action","action":"work","override":"zero_money_gain"}'::jsonb, '{}'::jsonb),
  ('WC-011', 'really_bad', 'gimmick', 'Professor Grudge', '🧾', 'You accidentally antagonize a professor who definitely keeps mental receipts. Their next impression of you is not going to be charitable.', 'Academics -0.5, and your next Class gives -0.25 Academics instead of its normal gain', 'next_action', '["academics"]'::jsonb, '{"academics":-0.5}'::jsonb, '{"kind":"action_override","duration":"next_action","action":"class","override":"class_academics_negative","amount":-0.25}'::jsonb, '{}'::jsonb),
  ('WC-012', 'really_bad', 'gimmick', 'Meltdown Week', '🔥', 'You hold it together just long enough for the week to end, and then everything catches up to you all at once. Tomorrow is going to feel heavier than usual.', 'Wellbeing -1.0, and your next day adds an extra -0.5 Wellbeing decay', 'next_day', '["wellbeing"]'::jsonb, '{"wellbeing":-1}'::jsonb, '{"kind":"extra_decay","duration":"next_day","stat":"wellbeing","amount":-0.5}'::jsonb, '{}'::jsonb),
  ('WC-013', 'bad', 'stat', 'Missed Alarm', '⏰', 'You wake up in a blind panic, already too late to salvage the plan you had. The day starts behind and never catches up.', 'Academics -1.0', 'immediate', '["academics"]'::jsonb, '{"academics":-1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-014', 'bad', 'stat', 'Awkward Hangout', '😶', 'You try to be charming, but somehow the whole interaction becomes stilted, weird, and hard to recover from.', 'Social -1.0', 'immediate', '["social"]'::jsonb, '{"social":-1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-015', 'bad', 'stat', 'Impulse Purchase', '🛍️', 'You convince yourself that buying this thing is self-care, then regret it almost immediately after checkout.', 'Money -1.0', 'immediate', '["money"]'::jsonb, '{"money":-1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-016', 'bad', 'stat', 'Minor Cold', '🤧', 'You are not sick enough to stop functioning, just sick enough to feel miserable doing everything. That is somehow worse.', 'Wellbeing -1.0', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":-1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-017', 'bad', 'stat', 'Parking Ticket', '🚓', 'Campus parking enforcement remains one of the most competent institutions in your life. It finds you quickly and without mercy.', 'Money -0.75, Wellbeing -0.25', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":-0.75,"wellbeing":-0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-018', 'bad', 'stat', 'Bad Study Session', '📚', 'You stare at the same page for an hour and retain nothing except growing self-hatred. The time is gone forever.', 'Academics -0.75', 'immediate', '["academics"]'::jsonb, '{"academics":-0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-019', 'bad', 'stat', 'Overheard Rumor', '👂', 'A dumb story about you starts making the rounds, and the worst part is how little control you have over it.', 'Social -0.75, Wellbeing -0.25', 'immediate', '["social","wellbeing"]'::jsonb, '{"social":-0.75,"wellbeing":-0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-020', 'bad', 'stat', 'Shattered Phone', '📱', 'One slip of the hand and your phone screen becomes an expensive spiderweb. You pretend not to care while absolutely caring.', 'Money -0.75', 'immediate', '["money"]'::jsonb, '{"money":-0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-021', 'bad', 'stat', 'Missed Meal', '🍽️', 'You get too busy, too stubborn, or too distracted to eat properly, and your body notices before you do.', 'Wellbeing -0.75', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":-0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-022', 'bad', 'stat', 'Laundry Disaster', '🧺', 'An entire load comes back shrunk, pink, or mysteriously ruined. You now own fewer usable clothes and more resentment.', 'Money -0.5, Wellbeing -0.5', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":-0.5,"wellbeing":-0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-023', 'bad', 'stat', 'Peer Comparison', '🪞', 'Everyone around you suddenly seems more accomplished, more stable, and more sure of themselves. It gets into your head.', 'Wellbeing -0.5, Social -0.5', 'immediate', '["wellbeing","social"]'::jsonb, '{"wellbeing":-0.5,"social":-0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-024', 'bad', 'stat', 'Broken Printer', '🖨️', 'The assignment is finished, but the machine you need refuses to cooperate when it matters. Campus technology remains your enemy.', 'Academics -0.5, Money -0.25', 'immediate', '["academics","money"]'::jsonb, '{"academics":-0.5,"money":-0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-025', 'bad', 'stat', 'Wrong Classroom', '🚪', 'You sit through a chunk of the wrong lecture before realizing you are not where you are supposed to be. The lost momentum stings.', 'Academics -0.5', 'immediate', '["academics"]'::jsonb, '{"academics":-0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-026', 'bad', 'stat', 'Terrible Coffee', '☕', 'The coffee tastes burnt, costs too much, and somehow still fails to wake you up. It is an insult on every level.', 'Money -0.25, Wellbeing -0.5', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":-0.25,"wellbeing":-0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-027', 'bad', 'stat', 'Rain-Soaked Walk', '🌧️', 'You get absolutely drenched between buildings and spend the rest of the day damp, cold, and quietly furious.', 'Wellbeing -0.5', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":-0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-028', 'bad', 'stat', 'Passive-Aggressive Roommate', '🛏️', 'Your roommate starts a conflict through body language, weird comments, and the strategic relocation of your stuff.', 'Social -0.5, Wellbeing -0.5', 'immediate', '["social","wellbeing"]'::jsonb, '{"social":-0.5,"wellbeing":-0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-029', 'bad', 'stat', 'Library Fine', '📘', 'That borrowed book was due so long ago that the fee feels less like a penalty and more like a personal judgment.', 'Money -0.5', 'immediate', '["money"]'::jsonb, '{"money":-0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-030', 'bad', 'stat', 'Bad Networking Event', '🤝', 'You collect free pens, fake smiles, and absolutely no real opportunities. The whole evening feels like a tax on your spirit.', 'Social -0.5, Money -0.25', 'immediate', '["social","money"]'::jsonb, '{"social":-0.5,"money":-0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-031', 'bad', 'stat', 'Late-Night Regret', '🌙', 'Something that seemed fun in the moment becomes much less charming under the brutal light of tomorrow.', 'Wellbeing -0.75, Academics -0.25', 'immediate', '["wellbeing","academics"]'::jsonb, '{"wellbeing":-0.75,"academics":-0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-032', 'bad', 'gimmick', 'Foggy Head', '💤', 'Your brain never fully boots up, and whatever focus you had planned to use later is already compromised.', 'Your next Study loses 0.5 Academics', 'next_action', '["academics"]'::jsonb, '{}'::jsonb, '{"kind":"action_bonus","duration":"next_action","action":"study","stat":"academics","amount":-0.5}'::jsonb, '{}'::jsonb),
  ('WC-033', 'bad', 'gimmick', 'Cringe Flashback', '😵', 'Your body decides now is the perfect time to replay something humiliating from years ago in full detail.', 'Your next Socialize loses 0.5 Social', 'next_action', '["social"]'::jsonb, '{}'::jsonb, '{"kind":"action_bonus","duration":"next_action","action":"socialize","stat":"social","amount":-0.5}'::jsonb, '{}'::jsonb),
  ('WC-034', 'bad', 'gimmick', 'Bad Budget Week', '📉', 'Small expenses keep stacking until your whole week feels cursed by invisible charges. The next shift will not save you.', 'Your next Work gives only +0.5 Money', 'next_action', '["money"]'::jsonb, '{}'::jsonb, '{"kind":"action_bonus","duration":"next_action","action":"work","stat":"money","amount":-0.5}'::jsonb, '{}'::jsonb),
  ('WC-035', 'bad', 'gimmick', 'Sore Muscles', '🦵', 'You move wrong exactly once and spend the next day discovering new ways to be annoyed by your own body.', 'Your next Exercise gives 0 Wellbeing', 'next_action', '["wellbeing"]'::jsonb, '{}'::jsonb, '{"kind":"action_override","duration":"next_action","action":"exercise","override":"zero_wellbeing_gain"}'::jsonb, '{}'::jsonb),
  ('WC-036', 'bad', 'gimmick', 'Bad Sleep Spiral', '🛌', 'You technically sleep, but it is the kind of sleep that feels like a prank your body is playing on you.', 'Your next Sleep gives only +0.5 Wellbeing', 'next_action', '["wellbeing"]'::jsonb, '{}'::jsonb, '{"kind":"action_bonus","duration":"next_action","action":"sleep","stat":"wellbeing","amount":-0.5}'::jsonb, '{}'::jsonb),
  ('WC-037', 'bad', 'stat', 'Office Hours Panic', '😨', 'You show up hoping for clarity and leave replaying every awkward second of the conversation in your head.', 'Academics -0.25, Wellbeing -0.5', 'immediate', '["academics","wellbeing"]'::jsonb, '{"academics":-0.25,"wellbeing":-0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-038', 'normal', 'stat', 'Found Twenty', '💵', 'A crumpled bill appears in a coat pocket or an old notebook like the universe taking pity on you. It is not much, but it feels blessed.', 'Money +1.0', 'immediate', '["money"]'::jsonb, '{"money":1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-039', 'normal', 'stat', 'Unexpected Nap', '😌', 'You lie down ''for ten minutes'' and wake up noticeably more human than you were before. It saves the whole day.', 'Wellbeing +1.0', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-040', 'normal', 'stat', 'Clean Notes Swap', '📝', 'Someone shares notes that are somehow clearer than the lecture itself. You suddenly understand much more than you should.', 'Academics +1.0', 'immediate', '["academics"]'::jsonb, '{"academics":1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-041', 'normal', 'stat', 'Friendly Hallway Chat', '🙂', 'A small conversation catches you at exactly the right moment and leaves you lighter than it has any right to.', 'Social +1.0', 'immediate', '["social"]'::jsonb, '{"social":1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-042', 'normal', 'stat', 'Free Pizza Slice', '🍕', 'You drift into a student event you had no intention of attending and still leave fed. That counts as a win.', 'Money +0.5, Wellbeing +0.5', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":0.5,"wellbeing":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-043', 'normal', 'stat', 'Good Playlist', '🎧', 'The right song at the right time makes walking across campus feel cinematic instead of miserable. Mood matters more than you admit.', 'Wellbeing +0.75, Social +0.25', 'immediate', '["wellbeing","social"]'::jsonb, '{"wellbeing":0.75,"social":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-044', 'normal', 'stat', 'Study Groove', '🧠', 'You finally hit a patch of concentration where the words stick and the work moves. It feels almost suspicious.', 'Academics +0.75, Wellbeing +0.25', 'immediate', '["academics","wellbeing"]'::jsonb, '{"academics":0.75,"wellbeing":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-045', 'normal', 'stat', 'Tipsy Tip Jar', '☕', 'Your shift is boring, but people are weirdly generous all night and that changes your opinion of humanity a little.', 'Money +0.75, Social +0.25', 'immediate', '["money","social"]'::jsonb, '{"money":0.75,"social":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-046', 'normal', 'stat', 'Sunny Bench Break', '🌤️', 'You end up alone in a warm patch of sunlight for ten peaceful minutes and return to life less brittle than before.', 'Wellbeing +0.75', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-047', 'normal', 'stat', 'Good Hair Day', '💁', 'Your reflection surprises you in a good way and your confidence quietly spikes for the rest of the day.', 'Social +0.75', 'immediate', '["social"]'::jsonb, '{"social":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-048', 'normal', 'stat', 'Club Flyer Curiosity', '📣', 'You follow a random flyer or friend into a room you would normally ignore and accidentally learn something useful.', 'Social +0.5, Academics +0.5', 'immediate', '["social","academics"]'::jsonb, '{"social":0.5,"academics":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-049', 'normal', 'stat', 'Meal Swipe Gift', '🎟️', 'Someone with an extra swipe saves you from paying and from pretending instant noodles are a personality trait.', 'Money +0.5, Wellbeing +0.5', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":0.5,"wellbeing":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-050', 'normal', 'stat', 'Tutor Tip', '💡', 'One offhand explanation from the right person makes a concept click in a way your textbook never managed.', 'Academics +0.75', 'immediate', '["academics"]'::jsonb, '{"academics":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-051', 'normal', 'stat', 'Free Bus Ride', '🚌', 'You save both time and energy by catching a lucky ride when your body was already done with walking.', 'Money +0.25, Wellbeing +0.5', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":0.25,"wellbeing":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-052', 'normal', 'stat', 'Late Library Hours', '🌃', 'The library stays open just long enough for you to actually get something done instead of giving up and spiraling.', 'Academics +0.5, Wellbeing +0.25', 'immediate', '["academics","wellbeing"]'::jsonb, '{"academics":0.5,"wellbeing":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-053', 'normal', 'stat', 'Compliment from a Stranger', '🌟', 'Someone says something kind at exactly the moment you needed a reason to stop being so harsh on yourself.', 'Social +0.5, Wellbeing +0.25', 'immediate', '["social","wellbeing"]'::jsonb, '{"social":0.5,"wellbeing":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-054', 'normal', 'stat', 'Campus Freebie Bag', '🎁', 'Most of the bag is nonsense, but enough of it is useful that the whole experience feels like a tiny festival of luck.', 'Money +0.75', 'immediate', '["money"]'::jsonb, '{"money":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-055', 'normal', 'stat', 'Rain Delay Reset', '☔', 'Plans fall apart, but the forced pause gives you a little more room to breathe than your day had before.', 'Wellbeing +0.75', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-056', 'normal', 'stat', 'Lucky Seat in Class', '🪑', 'You sit next to the one person who actually understood the lecture and they explain it in plain language after class.', 'Academics +0.5, Social +0.25', 'immediate', '["academics","social"]'::jsonb, '{"academics":0.5,"social":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-057', 'normal', 'stat', 'Decent Shift', '🍽️', 'Nothing dramatic happens, nobody yells at you, and the money arrives exactly as promised. That alone feels rare.', 'Money +1.0', 'immediate', '["money"]'::jsonb, '{"money":1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-058', 'normal', 'stat', 'Stretch Break', '🧘', 'A simple break for your body resets more tension than you realized you were carrying.', 'Wellbeing +0.75', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-059', 'normal', 'stat', 'Small Scholarship Email', '📩', 'It is not a life-changing amount, but it lands in your inbox at exactly the right time to matter.', 'Money +0.75', 'immediate', '["money"]'::jsonb, '{"money":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-060', 'normal', 'stat', 'Lucky Guess', '❓', 'You make a guess on something you probably should not know and somehow come out looking competent.', 'Academics +0.75', 'immediate', '["academics"]'::jsonb, '{"academics":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-061', 'normal', 'stat', 'Vending Jackpot', '🥤', 'The machine double-drops your snack and you briefly feel favored by forces beyond your understanding.', 'Money +0.25, Wellbeing +0.5', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":0.25,"wellbeing":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-062', 'normal', 'gimmick', 'Next Study Boost', '📖', 'You stumble across a clue, a source, or a trick that will make your next real study session much more productive.', 'Your next Study gains +0.75 Academics', 'next_action', '["academics"]'::jsonb, '{}'::jsonb, '{"kind":"action_bonus","duration":"next_action","action":"study","stat":"academics","amount":0.75}'::jsonb, '{}'::jsonb),
  ('WC-063', 'normal', 'gimmick', 'Next Work Boost', '💼', 'Someone offers you an easy task, a good shift, or a small advantage that turns your next work session into a better deal.', 'Your next Work gains +0.75 Money', 'next_action', '["money"]'::jsonb, '{}'::jsonb, '{"kind":"action_bonus","duration":"next_action","action":"work","stat":"money","amount":0.75}'::jsonb, '{}'::jsonb),
  ('WC-064', 'good', 'stat', 'Professor Mercy', '🎓', 'The professor hands out a hint, extension, or grading break that they absolutely did not have to give you.', 'Academics +1.5', 'immediate', '["academics"]'::jsonb, '{"academics":1.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-065', 'good', 'stat', 'Perfect Sleep', '😴', 'You wake up feeling startlingly rested, like your body briefly remembered how to function correctly.', 'Wellbeing +1.5', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":1.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-066', 'good', 'stat', 'Cash Gig', '💼', 'A random one-day job appears and somehow pays better than your actual normal opportunities.', 'Money +1.5', 'immediate', '["money"]'::jsonb, '{"money":1.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-067', 'good', 'stat', 'Magnetic Energy', '✨', 'People are weirdly drawn to you today, and every interaction goes a little smoother than expected.', 'Social +1.5', 'immediate', '["social"]'::jsonb, '{"social":1.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-068', 'good', 'stat', 'Locked-In Study Day', '📚', 'The distractions fall away, the tasks line up, and you spend hours actually making progress instead of pretending to.', 'Academics +1.25, Wellbeing +0.25', 'immediate', '["academics","wellbeing"]'::jsonb, '{"academics":1.25,"wellbeing":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-069', 'good', 'stat', 'Healing Weekend', '🛀', 'You accidentally do everything right for one stretch of time and your body rewards you for it immediately.', 'Wellbeing +1.25, Social +0.25', 'immediate', '["wellbeing","social"]'::jsonb, '{"wellbeing":1.25,"social":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-070', 'good', 'stat', 'Great Tips Night', '🍻', 'Customers are cheerful, management is absent, and the cash accumulates faster than your stress does.', 'Money +1.25, Social +0.25', 'immediate', '["money","social"]'::jsonb, '{"money":1.25,"social":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-071', 'good', 'stat', 'Campus Celebrity Moment', '📸', 'For one evening, people know who you are for a good reason and the glow carries farther than expected.', 'Social +1.25, Wellbeing +0.25', 'immediate', '["social","wellbeing"]'::jsonb, '{"social":1.25,"wellbeing":0.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-072', 'good', 'stat', 'Advisor Hookup', '🧠', 'You get pointed toward exactly the right person, office, or resource just before you would have given up.', 'Academics +1.0, Money +0.5', 'immediate', '["academics","money"]'::jsonb, '{"academics":1,"money":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-073', 'good', 'stat', 'Recharge Day', '🌿', 'You do less, breathe more, and still come out ahead because your brain and body finally stop fighting you.', 'Wellbeing +1.0, Academics +0.5', 'immediate', '["wellbeing","academics"]'::jsonb, '{"wellbeing":1,"academics":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-074', 'good', 'stat', 'Good Crowd', '🫶', 'You land in a room where everyone is easy to talk to and no one makes you regret leaving home.', 'Social +1.0, Money +0.5', 'immediate', '["social","money"]'::jsonb, '{"social":1,"money":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-075', 'good', 'stat', 'Paid Opportunity', '📑', 'Someone notices competence and turns it into a concrete chance to earn. It is one of those tiny lucky pivots.', 'Money +1.0, Academics +0.5', 'immediate', '["money","academics"]'::jsonb, '{"money":1,"academics":0.5}'::jsonb, NULL, '{}'::jsonb),
  ('WC-076', 'good', 'stat', 'Lucky Break', '🍀', 'Two or three small things line up in your favor and the whole day becomes much easier to live inside.', 'Academics +0.75, Wellbeing +0.75', 'immediate', '["academics","wellbeing"]'::jsonb, '{"academics":0.75,"wellbeing":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-077', 'good', 'stat', 'Confidence Surge', '🔥', 'You stop hesitating, stop second-guessing, and suddenly every choice feels easier to commit to.', 'Social +0.75, Wellbeing +0.75', 'immediate', '["social","wellbeing"]'::jsonb, '{"social":0.75,"wellbeing":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-078', 'good', 'stat', 'Free Groceries', '🛒', 'Someone moving out or cleaning house hands you a ridiculous amount of useful food and basic supplies.', 'Money +0.75, Wellbeing +0.75', 'immediate', '["money","wellbeing"]'::jsonb, '{"money":0.75,"wellbeing":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-079', 'good', 'stat', 'Research Assistant Lead', '🔬', 'A professor, TA, or grad student gives you the kind of opening that makes you feel smarter just for hearing it.', 'Academics +1.25', 'immediate', '["academics"]'::jsonb, '{"academics":1.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-080', 'good', 'stat', 'Great Gym Session', '🏋️', 'Your body cooperates, your lungs behave, and the endorphins actually show up on time.', 'Wellbeing +1.25', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":1.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-081', 'good', 'stat', 'Unexpected Venmo', '📲', 'Somebody finally pays you back for something ancient and you immediately stop believing in karma out of sheer surprise.', 'Money +1.25', 'immediate', '["money"]'::jsonb, '{"money":1.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-082', 'good', 'stat', 'Party Win', '🪩', 'You leave the night with new names, new confidence, and the rare sense that going out was absolutely the right choice.', 'Social +1.25', 'immediate', '["social"]'::jsonb, '{"social":1.25}'::jsonb, NULL, '{}'::jsonb),
  ('WC-083', 'good', 'gimmick', 'Next-Day Focus Buff', '🎯', 'Something clicks mentally and leaves behind just enough structure that your next study session starts stronger.', 'Your next Study gains +0.75 Academics', 'next_action', '["academics"]'::jsonb, '{}'::jsonb, '{"kind":"action_bonus","duration":"next_action","action":"study","stat":"academics","amount":0.75}'::jsonb, '{}'::jsonb),
  ('WC-084', 'good', 'gimmick', 'Next-Day Recovery Buff', '🛌', 'Your body is set up to recover better the next time you actually let it rest.', 'Your next Sleep or Rest gains +0.75 Wellbeing', 'next_action', '["wellbeing"]'::jsonb, '{}'::jsonb, '{"kind":"action_bonus","duration":"next_action","action":"rest_or_sleep","stat":"wellbeing","amount":0.75}'::jsonb, '{}'::jsonb),
  ('WC-085', 'good', 'gimmick', 'Next-Day Hustle Buff', '🚀', 'You find an easier route to money, and your next time working will benefit from that momentum.', 'Your next Work gains +0.75 Money', 'next_action', '["money"]'::jsonb, '{}'::jsonb, '{"kind":"action_bonus","duration":"next_action","action":"work","stat":"money","amount":0.75}'::jsonb, '{}'::jsonb),
  ('WC-086', 'good', 'gimmick', 'Social Momentum', '🗣️', 'You become easier to talk to for a little while, as if your charm has finally stopped buffering.', 'Your next Socialize gains +0.75 Social', 'next_action', '["social"]'::jsonb, '{}'::jsonb, '{"kind":"action_bonus","duration":"next_action","action":"socialize","stat":"social","amount":0.75}'::jsonb, '{}'::jsonb),
  ('WC-087', 'good', 'gimmick', 'Safety Net', '🛡️', 'You feel strangely protected, like the next disaster has already been politely asked to stay away.', 'Your next bad outcome becomes normal', 'until_triggered', '[]'::jsonb, '{}'::jsonb, '{"kind":"convert_bad_outcomes","duration":"until_triggered","count":1}'::jsonb, '{}'::jsonb),
  ('WC-088', 'good', 'gimmick', 'Calm Mind', '🌙', 'The static in your head clears just enough that tomorrow''s stress has less room to hurt you.', 'Tomorrow you ignore one wellbeing-related penalty', 'next_day', '["wellbeing"]'::jsonb, '{}'::jsonb, '{"kind":"ignore_penalty","duration":"next_day","penalty":"wellbeing","count":1}'::jsonb, '{}'::jsonb),
  ('WC-089', 'really_good', 'stat', 'Secret Answer Key', '🔑', 'You accidentally find exactly the clue, answer pattern, or hidden advantage you were never supposed to see. It is a little illegal and extremely useful.', 'Academics +2.0', 'immediate', '["academics"]'::jsonb, '{"academics":2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-090', 'really_good', 'stat', 'Scholarship Win', '🏆', 'Real money, no strings, no fake internship catch, and no follow-up email asking for your banking password.', 'Money +2.0', 'immediate', '["money"]'::jsonb, '{"money":2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-091', 'really_good', 'stat', 'Miracle Recovery', '🌈', 'Whatever was wrong with your brain, body, or spirit briefly gets patched by divine intervention.', 'Wellbeing +2.0', 'immediate', '["wellbeing"]'::jsonb, '{"wellbeing":2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-092', 'really_good', 'stat', 'Legendary Social Night', '🎉', 'You become the center of the room for all the right reasons and ride the high all the way home.', 'Social +2.0', 'immediate', '["social"]'::jsonb, '{"social":2}'::jsonb, NULL, '{}'::jsonb),
  ('WC-093', 'really_good', 'stat', 'Dream Internship Offer', '💼', 'A ridiculous opportunity lands in your lap and somehow turns out to be both real and useful.', 'Money +1.5, Academics +0.75', 'immediate', '["money","academics"]'::jsonb, '{"money":1.5,"academics":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-094', 'really_good', 'stat', 'Peak Flow State', '🧠', 'You become terrifyingly efficient for one stretch of time and tear through work that should have taken twice as long.', 'Academics +1.5, Wellbeing +0.75', 'immediate', '["academics","wellbeing"]'::jsonb, '{"academics":1.5,"wellbeing":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-095', 'really_good', 'stat', 'Perfect Reset Weekend', '🛏️', 'You sleep, eat, breathe, and recover like a person in a self-help book instead of a college student.', 'Wellbeing +1.5, Social +0.75', 'immediate', '["wellbeing","social"]'::jsonb, '{"wellbeing":1.5,"social":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-096', 'really_good', 'stat', 'Main Character Arc', '🌟', 'For one glorious moment, the universe remembers your name and decides to reward your existence.', 'Social +1.5, Money +0.75', 'immediate', '["social","money"]'::jsonb, '{"social":1.5,"money":0.75}'::jsonb, NULL, '{}'::jsonb),
  ('WC-097', 'really_good', 'stat', 'Double Lucky Break', '🍀🍀', 'Two unrelated good things happen back to back and you do not trust either of them, but both are real.', 'Academics +1.0, Money +1.0', 'immediate', '["academics","money"]'::jsonb, '{"academics":1,"money":1}'::jsonb, NULL, '{}'::jsonb),
  ('WC-098', 'really_good', 'gimmick', 'Guardian Angel', '😇', 'Something invisible steps between you and catastrophe, and the protection lingers just long enough to matter.', 'Your next two bad outcomes become normal', 'until_triggered', '[]'::jsonb, '{}'::jsonb, '{"kind":"convert_bad_outcomes","duration":"until_triggered","count":2}'::jsonb, '{}'::jsonb),
  ('WC-099', 'really_good', 'gimmick', 'Momentum Chain', '⚡', 'Success starts feeding itself, and the next couple of things you do inherit some of that spark.', 'Your next two actions each gain +0.5 to their main stat', 'next_two_actions', '["academics","social","wellbeing","money"]'::jsonb, '{}'::jsonb, '{"kind":"momentum_chain","duration":"next_two_actions","amount":0.5,"excludes":["wildcard"]}'::jsonb, '{}'::jsonb),
  ('WC-100', 'really_good', 'gimmick', 'Golden Ticket', '🎫', 'You pull the kind of luck people tell stories about later, and it keeps paying out after the first shock wears off.', 'Draw 1 additional wildcard immediately, then also gain Wellbeing +0.5', 'instant', '["wellbeing"]'::jsonb, '{"wellbeing":0.5}'::jsonb, '{"kind":"draw_extra","duration":"instant","count":1}'::jsonb, '{}'::jsonb)
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

-- Public and private event definitions
INSERT INTO public_event_defs (
  id,
  title,
  description,
  effect_type,
  flat_stat_changes,
  multipliers,
  metadata
) VALUES
  ('PUB-001', 'Heatwave', 'The campus turns into a brick oven, everyone is sticky, and physical activity becomes a much worse idea than usual.', 'action_multiplier', '{}'::jsonb, '{"exercise": 0.5}'::jsonb, '{"theme": "weather"}'::jsonb),
  ('PUB-002', 'Cram Season', 'Every table in the library is full, every laptop has thirty tabs open, and panic is somehow productive for once.', 'action_multiplier', '{}'::jsonb, '{"study": 1.5}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PUB-003', 'Frat Row Block Party', 'The bass is shaking the windows and nobody on campus is pretending to work after dark.', 'slot_multiplier', '{}'::jsonb, '{"night_socialize": 1.5}'::jsonb, '{"theme": "social"}'::jsonb),
  ('PUB-004', 'Campus Power Outage', 'Half the buildings lose power, half the students give up, and the rest try to study by phone flashlight.', 'slot_multiplier', '{}'::jsonb, '{"morning_study": 0.5}'::jsonb, '{"theme": "disruption"}'::jsonb),
  ('PUB-005', 'Hiring Spree', 'Every cafe and desk on campus suddenly has a help wanted sign taped to it.', 'action_multiplier', '{}'::jsonb, '{"work": 1.5}'::jsonb, '{"theme": "money"}'::jsonb),
  ('PUB-006', 'Wellness Week', 'The university spends a little money pretending to care and, surprisingly, some of it helps.', 'action_multiplier', '{}'::jsonb, '{"rest": 1.5, "sleep": 1.5}'::jsonb, '{"theme": "wellbeing"}'::jsonb),
  ('PUB-007', 'Snow Day', 'The sidewalks disappear under snow and enough professors give up that the whole day softens.', 'mixed', '{}'::jsonb, '{"class": 0.0, "rest": 1.25}'::jsonb, '{"theme": "weather", "classes_cancelled": true}'::jsonb),
  ('PUB-008', 'Flu Outbreak', 'Everyone on campus is coughing into their sleeves and pretending they are fine.', 'daily_decay', '{"wellbeing": -0.5}'::jsonb, '{}'::jsonb, '{"theme": "health"}'::jsonb),
  ('PUB-009', 'Career Fair', 'The student center fills with recruiters, lanyards, and overprepared upperclassmen trying to look calm.', 'mixed', '{"academics": 0.25}'::jsonb, '{"work": 1.25}'::jsonb, '{"theme": "career"}'::jsonb),
  ('PUB-010', 'Coffee Shop Promo', 'The campus cafe runs a study-night special and suddenly everyone is pretending caffeine counts as resilience.', 'mixed', '{"money": 0.25}'::jsonb, '{"study": 1.25}'::jsonb, '{"theme": "study"}'::jsonb),
  ('PUB-011', 'Open Mic Night', 'A lot of students who should not be brave tonight decide that they are.', 'action_multiplier', '{}'::jsonb, '{"socialize": 1.25}'::jsonb, '{"theme": "performance"}'::jsonb),
  ('PUB-012', 'Pop Quiz Panic', 'Every class rumor suddenly sounds possible and nobody feels safe.', 'daily_decay', '{"wellbeing": -0.25}'::jsonb, '{}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PUB-013', 'Free Breakfast', 'For one morning, the school accidentally solves a real problem for students.', 'mixed', '{"money": 0.5, "wellbeing": 0.25}'::jsonb, '{}'::jsonb, '{"theme": "food"}'::jsonb),
  ('PUB-014', 'Student Election Week', 'Everyone with a clipboard becomes intense and weirdly optimistic.', 'mixed', '{"social": 0.25}'::jsonb, '{"socialize": 1.25}'::jsonb, '{"theme": "campus politics"}'::jsonb),
  ('PUB-015', 'Library Flooding', 'A busted pipe knocks out part of the library and drags everyone''s focus down with it.', 'action_multiplier', '{}'::jsonb, '{"study": 0.75}'::jsonb, '{"theme": "disruption"}'::jsonb),
  ('PUB-016', 'Guest Lecture', 'A visiting speaker makes class weirdly worthwhile for one day.', 'mixed', '{"academics": 0.25, "social": 0.25}'::jsonb, '{"class": 1.25}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PUB-017', 'Campus Fun Run', 'The rec center guilts everyone into pretending movement is joy.', 'mixed', '{"social": 0.25}'::jsonb, '{"exercise": 1.25}'::jsonb, '{"theme": "fitness"}'::jsonb),
  ('PUB-018', 'Tuition Panic', 'Someone posts about fees, debt, and payment deadlines, and suddenly everyone remembers adulthood is real.', 'daily_decay', '{"money": -0.25}'::jsonb, '{}'::jsonb, '{"theme": "money"}'::jsonb),
  ('PUB-019', 'Volunteer Fair', 'Campus gets aggressively wholesome for a day and people feel a little better about themselves because of it.', 'mixed', '{"wellbeing": 0.25, "social": 0.25}'::jsonb, '{}'::jsonb, '{"theme": "community"}'::jsonb),
  ('PUB-020', 'Hackathon Weekend', 'Nobody sleeps, everybody claims to be building something meaningful, and the energy is contagious.', 'mixed', '{"academics": 0.25, "wellbeing": -0.25}'::jsonb, '{"study": 1.25, "work": 0.75}'::jsonb, '{"theme": "tech"}'::jsonb),
  ('PUB-021', 'Spring Sunshine', 'The weather is so unfairly nice that everyone becomes slightly easier to be around.', 'mixed', '{"social": 0.25, "wellbeing": 0.25}'::jsonb, '{}'::jsonb, '{"theme": "weather"}'::jsonb),
  ('PUB-022', 'Rainy Gloom', 'Grey skies settle over campus and motivation takes a visible hit.', 'mixed', '{"wellbeing": -0.25}'::jsonb, '{"exercise": 0.75, "socialize": 0.9}'::jsonb, '{"theme": "weather"}'::jsonb),
  ('PUB-023', 'Dining Hall Upgrade', 'The food is suspiciously edible today, which improves morale more than administration could ever understand.', 'mixed', '{"wellbeing": 0.5}'::jsonb, '{}'::jsonb, '{"theme": "food"}'::jsonb),
  ('PUB-024', 'Messy Renovation', 'Construction noise follows you from building to building and concentration loses badly.', 'mixed', '{"wellbeing": -0.25}'::jsonb, '{"study": 0.75, "rest": 0.9}'::jsonb, '{"theme": "construction"}'::jsonb),
  ('PUB-025', 'Campus Festival', 'Booths, music, and free nonsense fill the quad and make socializing much easier than normal.', 'mixed', '{"social": 0.25}'::jsonb, '{"socialize": 1.5}'::jsonb, '{"theme": "festival"}'::jsonb),
  ('PUB-026', 'Housing Email Scare', 'An alarming housing message hits every inbox and shaves a layer off everyone''s patience.', 'daily_decay', '{"wellbeing": -0.25, "money": -0.25}'::jsonb, '{}'::jsonb, '{"theme": "stress"}'::jsonb),
  ('PUB-027', 'Midnight Breakfast', 'The campus throws a cheerful late-night event and students reward it with chaos.', 'mixed', '{"wellbeing": 0.25, "money": 0.25}'::jsonb, '{"night_socialize": 1.25}'::jsonb, '{"theme": "food"}'::jsonb),
  ('PUB-028', 'Professor Office Hours Push', 'Professors suddenly insist everyone come talk to them, and some students actually benefit.', 'mixed', '{"academics": 0.25}'::jsonb, '{"class": 1.15, "study": 1.1}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PUB-029', 'Campus Gym Promo', 'The rec center starts giving out branded water bottles and students briefly buy into the illusion of balance.', 'mixed', '{"wellbeing": 0.25}'::jsonb, '{"exercise": 1.5}'::jsonb, '{"theme": "fitness"}'::jsonb),
  ('PUB-030', 'Slow Wi-Fi Day', 'Every page takes too long to load and everyone''s work rhythm turns ugly.', 'mixed', '{"academics": -0.25}'::jsonb, '{"study": 0.8, "work": 0.9}'::jsonb, '{"theme": "tech"}'::jsonb),
  ('PUB-031', 'Scholarship Deadline Buzz', 'Everybody remembers money can be won as well as lost, and ambition briefly spikes.', 'mixed', '{"academics": 0.25, "money": 0.25}'::jsonb, '{"study": 1.15}'::jsonb, '{"theme": "money"}'::jsonb),
  ('PUB-032', 'Student Protest', 'Campus gets loud, serious, and politically charged in a way that disrupts routine but energizes some people.', 'mixed', '{"social": 0.25, "wellbeing": -0.25}'::jsonb, '{"class": 0.8, "socialize": 1.15}'::jsonb, '{"theme": "activism"}'::jsonb),
  ('PUB-033', 'Merciless Humidity', 'Everything feels sticky, heavy, and one degree more exhausting than it should.', 'daily_decay', '{"wellbeing": -0.25}'::jsonb, '{"exercise": 0.75}'::jsonb, '{"theme": "weather"}'::jsonb),
  ('PUB-034', 'Bookstore Buyback Week', 'Suddenly old books have value again and students start hunting their shelves for forgotten treasure.', 'mixed', '{"money": 0.5}'::jsonb, '{"work": 1.1}'::jsonb, '{"theme": "money"}'::jsonb),
  ('PUB-035', 'Peer Tutoring Boom', 'Students help each other out more than usual, and that cooperation actually pays off.', 'mixed', '{"academics": 0.25, "social": 0.25}'::jsonb, '{"study": 1.2, "socialize": 1.1}'::jsonb, '{"theme": "community"}'::jsonb),
  ('PUB-036', 'Exam Rumor Mill', 'Everyone has heard a different version of the truth and all of them are making the mood worse.', 'mixed', '{"wellbeing": -0.25, "academics": 0.25}'::jsonb, '{"study": 1.1}'::jsonb, '{"theme": "exam"}'::jsonb),
  ('PUB-037', 'Late Bus Chaos', 'Transit starts failing in small, annoying ways that make every schedule feel less stable.', 'mixed', '{"wellbeing": -0.25}'::jsonb, '{"work": 0.9, "socialize": 0.9}'::jsonb, '{"theme": "transport"}'::jsonb),
  ('PUB-038', 'Club Recruitment Blitz', 'Every organization on campus suddenly wants your time, energy, and email address.', 'mixed', '{"social": 0.5}'::jsonb, '{"socialize": 1.25}'::jsonb, '{"theme": "clubs"}'::jsonb),
  ('PUB-039', 'Quiet Quad Day', 'Campus relaxes into a weirdly peaceful rhythm and people stop clenching their jaw for a few hours.', 'mixed', '{"wellbeing": 0.5}'::jsonb, '{"rest": 1.2}'::jsonb, '{"theme": "calm"}'::jsonb),
  ('PUB-040', 'Tech Career Night', 'Industry people descend on campus with lanyards, stress, and free tote bags.', 'mixed', '{"money": 0.25, "social": 0.25}'::jsonb, '{"work": 1.2, "socialize": 1.1}'::jsonb, '{"theme": "career"}'::jsonb),
  ('PUB-041', 'Gym Closed', 'The rec center shuts down for maintenance and everyone who relied on it is suddenly annoyed.', 'action_multiplier', '{}'::jsonb, '{"exercise": 0.0}'::jsonb, '{"theme": "fitness", "blocked": true}'::jsonb),
  ('PUB-042', 'Professor Curve Panic', 'Rumors of a class curve create hope, despair, and a lot of weird math in group chats.', 'mixed', '{"academics": 0.25, "wellbeing": -0.25}'::jsonb, '{"study": 1.1}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PUB-043', 'Night Market', 'Food stalls and student vendors make campus feel alive after dark in a way money somehow forgives.', 'mixed', '{"social": 0.25, "money": 0.25}'::jsonb, '{"night_socialize": 1.25}'::jsonb, '{"theme": "festival"}'::jsonb),
  ('PUB-044', 'Library Quiet Crackdown', 'The librarians are enforcing silence like a sacred oath, and studying benefits from the fear.', 'action_multiplier', '{}'::jsonb, '{"study": 1.25}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PUB-045', 'Campus Donation Drive', 'A feel-good event makes people unusually generous and slightly easier to connect with.', 'mixed', '{"social": 0.25, "wellbeing": 0.25}'::jsonb, '{}'::jsonb, '{"theme": "community"}'::jsonb),
  ('PUB-046', 'Frozen Pipes', 'Maintenance issues ripple through multiple dorms and the whole campus mood takes a cold hit.', 'mixed', '{"wellbeing": -0.5}'::jsonb, '{"rest": 0.85}'::jsonb, '{"theme": "weather"}'::jsonb),
  ('PUB-047', 'Exam Review Session', 'A surprisingly useful review session gets everyone a little more focused and a little less doomed.', 'mixed', '{"academics": 0.5}'::jsonb, '{"study": 1.2}'::jsonb, '{"theme": "exam"}'::jsonb),
  ('PUB-048', 'Side Hustle Craze', 'Students suddenly start selling, flipping, and freelancing everything that is not bolted down.', 'mixed', '{"money": 0.25}'::jsonb, '{"work": 1.25}'::jsonb, '{"theme": "money"}'::jsonb),
  ('PUB-049', 'Sunset Concert', 'A free outdoor show gives the evening a social boost and a brief illusion that campus life is magical.', 'mixed', '{"social": 0.25, "wellbeing": 0.25}'::jsonb, '{"night_socialize": 1.3}'::jsonb, '{"theme": "music"}'::jsonb),
  ('PUB-050', 'Deadline Compression', 'Several course deadlines seem to collapse toward the same point in time and everybody feels the squeeze.', 'mixed', '{"academics": 0.25, "wellbeing": -0.5}'::jsonb, '{"study": 1.15, "rest": 0.85}'::jsonb, '{"theme": "stress"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  effect_type = EXCLUDED.effect_type,
  flat_stat_changes = EXCLUDED.flat_stat_changes,
  multipliers = EXCLUDED.multipliers,
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
  ('PRIV-001', 'Secret Study Group', 'A grad student slips you an invite to a locked basement room where the most stressed people on campus quietly get ahead together.', 'risk_reward', 'STUDY', '{"wellbeing": -0.25}'::jsonb, '{"academics": 1.5}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PRIV-002', 'Underground Poker', 'A whispered invite, a cramped apartment, and a table full of students pretending they know probability better than they do.', 'risk_reward', 'POKER', '{"money": -1.0}'::jsonb, '{"money": 2.0}'::jsonb, '{"theme": "money"}'::jsonb),
  ('PRIV-003', 'VIP Concert', 'Someone with a wristband and bad judgment offers you a backstage pass and exactly one chance to be interesting.', 'risk_reward', 'VIP', '{"wellbeing": -0.25}'::jsonb, '{"social": 1.5, "wellbeing": 0.25}'::jsonb, '{"theme": "music"}'::jsonb),
  ('PRIV-004', 'Office Hours Invite', 'A professor emails you directly with the kind of subject line that could change your week for better or worse.', 'risk_reward', 'OFFICE', '{"wellbeing": -0.5}'::jsonb, '{"academics": 1.75}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PRIV-005', 'Greek Mixer', 'A handwritten invitation lands in your room and everything about it says this could go very well or very stupidly.', 'risk_reward', 'GREEK', '{"wellbeing": -0.25, "money": -0.25}'::jsonb, '{"social": 1.75}'::jsonb, '{"theme": "social"}'::jsonb),
  ('PRIV-006', 'Insider Internship', 'An advisor forwards you a job opening that does not look publicly listed anywhere, which is either excellent or suspicious.', 'risk_reward', 'INTERN', '{"academics": -0.25}'::jsonb, '{"money": 1.75, "academics": 0.5}'::jsonb, '{"theme": "career"}'::jsonb),
  ('PRIV-007', 'Dorm Rooftop Party', 'You climb somewhere you are not technically supposed to be and discover half the cool people on campus had the same idea.', 'risk_reward', 'ROOF', '{"wellbeing": -0.5}'::jsonb, '{"social": 1.5}'::jsonb, '{"theme": "social"}'::jsonb),
  ('PRIV-008', 'Questionably Legal Tutoring', 'A genius senior offers to teach you how to ace a class using methods that are academically adjacent to honest.', 'risk_reward', 'TUTOR', '{"wellbeing": -0.25, "social": -0.25}'::jsonb, '{"academics": 1.75}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PRIV-009', 'Late-Night Delivery Shift', 'A friend ropes you into a one-night cash gig that may or may not be worth the exhaustion.', 'risk_reward', 'DELIV', '{"wellbeing": -0.5}'::jsonb, '{"money": 1.75}'::jsonb, '{"theme": "money"}'::jsonb),
  ('PRIV-010', 'Secret Supper Club', 'An invite-only dinner hidden somewhere off campus promises food, conversation, and exactly the right level of mystery.', 'risk_reward', 'SUPPER', '{"money": -0.25}'::jsonb, '{"social": 1.0, "wellbeing": 1.0}'::jsonb, '{"theme": "food"}'::jsonb),
  ('PRIV-011', 'Black Market Textbooks', 'You get offered expensive books for cheap prices by somebody who definitely did not acquire them through normal channels.', 'risk_reward', 'BOOK', '{"money": -0.25, "social": -0.25}'::jsonb, '{"academics": 1.25, "money": 0.75}'::jsonb, '{"theme": "money"}'::jsonb),
  ('PRIV-012', 'After-Hours Lab Access', 'Somebody with keycard access lets you into equipment most students never get to touch.', 'risk_reward', 'LAB', '{"wellbeing": -0.25}'::jsonb, '{"academics": 1.5, "money": 0.25}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PRIV-013', 'Underground Comedy Night', 'A tiny room off campus hosts the funniest and most awkward people you have ever met in one place.', 'risk_reward', 'COMEDY', '{"social": -0.25}'::jsonb, '{"social": 1.5, "wellbeing": 0.5}'::jsonb, '{"theme": "social"}'::jsonb),
  ('PRIV-014', 'Rival Club Sabotage', 'Someone asks you to quietly help undermine another student group, and the moral math is not great.', 'risk_reward', 'RIVAL', '{"social": -0.5, "wellbeing": -0.25}'::jsonb, '{"money": 1.0, "social": 0.75}'::jsonb, '{"theme": "social"}'::jsonb),
  ('PRIV-015', 'Professor Dinner', 'A tiny dinner with faculty could become a career-defining conversation or a painfully formal waste of energy.', 'risk_reward', 'DINNER', '{"wellbeing": -0.25, "money": -0.25}'::jsonb, '{"academics": 1.0, "social": 0.75}'::jsonb, '{"theme": "career"}'::jsonb),
  ('PRIV-016', 'Hidden Art Show', 'An unmarked studio hosts an invite-only exhibit full of dramatic people, good snacks, and networking potential.', 'risk_reward', 'ART', '{"money": -0.25}'::jsonb, '{"social": 1.5, "wellbeing": 0.5}'::jsonb, '{"theme": "arts"}'::jsonb),
  ('PRIV-017', 'Finance Club Backroom', 'A small group of overconfident students claim they can teach you how to make money fast, which should concern you.', 'risk_reward', 'FIN', '{"money": -0.75}'::jsonb, '{"money": 2.0, "academics": 0.25}'::jsonb, '{"theme": "money"}'::jsonb),
  ('PRIV-018', 'Dorm Basement Cinema', 'A secret movie night turns into a low-stakes social miracle or an overlong mistake depending on your mood.', 'risk_reward', 'CINEMA', '{"academics": -0.25}'::jsonb, '{"social": 1.0, "wellbeing": 1.0}'::jsonb, '{"theme": "social"}'::jsonb),
  ('PRIV-019', 'Hidden Yoga Loft', 'A private class above an old storefront offers suspiciously effective calm if you can get there in time.', 'risk_reward', 'YOGA', '{"money": -0.25}'::jsonb, '{"wellbeing": 1.75}'::jsonb, '{"theme": "wellbeing"}'::jsonb),
  ('PRIV-020', 'Stolen Answer Rumor', 'You hear there may be leaked answers floating around, and even considering it feels like a gamble.', 'risk_reward', 'LEAK', '{"wellbeing": -0.5, "social": -0.25}'::jsonb, '{"academics": 2.0}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PRIV-021', 'Off-Campus Barista Trial', 'A cafe owner offers you a one-night paid trial shift and exactly zero patience.', 'risk_reward', 'BAR', '{"wellbeing": -0.5}'::jsonb, '{"money": 1.5, "social": 0.5}'::jsonb, '{"theme": "money"}'::jsonb),
  ('PRIV-022', 'Research Survey Farm', 'You get tipped off to a cluster of paid studies that are either easy money or deeply strange.', 'risk_reward', 'SURVEY', '{"wellbeing": -0.25}'::jsonb, '{"money": 1.25, "academics": 0.5}'::jsonb, '{"theme": "money"}'::jsonb),
  ('PRIV-023', 'Improvised Road Trip', 'A friend begs you to get in the car for one ridiculous night adventure that probably should not happen mid-semester.', 'risk_reward', 'TRIP', '{"academics": -0.5, "money": -0.25}'::jsonb, '{"social": 1.5, "wellbeing": 0.75}'::jsonb, '{"theme": "social"}'::jsonb),
  ('PRIV-024', 'Study Drug Offer', 'Somebody offers a shortcut to focus, and whether that sounds useful or alarming probably says a lot already.', 'risk_reward', 'FOCUS', '{"wellbeing": -0.75}'::jsonb, '{"academics": 1.75}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PRIV-025', 'Last-Minute House Show', 'You get invited to a tiny concert in somebody''s basement and the whole thing feels one bad speaker away from collapse.', 'risk_reward', 'SHOW', '{"wellbeing": -0.25}'::jsonb, '{"social": 1.5, "wellbeing": 0.5}'::jsonb, '{"theme": "music"}'::jsonb),
  ('PRIV-026', 'Advisor Recommendation', 'A trusted recommendation can open doors if you manage not to fumble the conversation attached to it.', 'risk_reward', 'REC', '{"social": -0.25}'::jsonb, '{"academics": 1.0, "money": 1.0}'::jsonb, '{"theme": "career"}'::jsonb),
  ('PRIV-027', 'Hidden Bookstore Buyback', 'A tiny off-campus shop quietly offers cash for books in a way the official store definitely would not.', 'risk_reward', 'BUYBACK', '{"academics": -0.25}'::jsonb, '{"money": 1.5}'::jsonb, '{"theme": "money"}'::jsonb),
  ('PRIV-028', 'Archive Room Access', 'You get shown a locked archive room with materials that make your coursework suddenly feel much more manageable.', 'risk_reward', 'ARCHIVE', '{"wellbeing": -0.25}'::jsonb, '{"academics": 1.5}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PRIV-029', 'Underground Dance Floor', 'A hidden party under a warehouse or old venue turns into either social gold or expensive dehydration.', 'risk_reward', 'DANCE', '{"wellbeing": -0.5, "money": -0.25}'::jsonb, '{"social": 1.75}'::jsonb, '{"theme": "social"}'::jsonb),
  ('PRIV-030', 'Quiet Meditation Circle', 'A tiny private mindfulness session looks cringe from the outside and suspiciously effective from the inside.', 'risk_reward', 'MEDITATE', '{"social": -0.25}'::jsonb, '{"wellbeing": 1.5, "academics": 0.25}'::jsonb, '{"theme": "wellbeing"}'::jsonb),
  ('PRIV-031', 'Risky Side Bet', 'A side wager on something stupid offers exactly the kind of odds that should make you back away, but might not.', 'risk_reward', 'BET', '{"money": -1.0}'::jsonb, '{"money": 2.0, "social": 0.25}'::jsonb, '{"theme": "money"}'::jsonb),
  ('PRIV-032', 'Illegal Parking Spot', 'A friend gives you a trick for getting somewhere faster, and the real question is whether it''s clever or cursed.', 'risk_reward', 'PARK', '{"money": -0.5}'::jsonb, '{"wellbeing": 0.5, "academics": 0.75}'::jsonb, '{"theme": "transport"}'::jsonb),
  ('PRIV-033', 'Dorm Chef Invitation', 'A self-declared culinary genius invites you to an off-menu dinner in a dorm kitchen that may or may not pass inspection.', 'risk_reward', 'CHEF', '{"money": -0.25}'::jsonb, '{"wellbeing": 1.25, "social": 0.75}'::jsonb, '{"theme": "food"}'::jsonb),
  ('PRIV-034', 'Mystery Donor Envelope', 'An anonymous envelope appears where it should not, and opening it feels morally unclear but financially tempting.', 'risk_reward', 'ENVELOPE', '{"wellbeing": -0.25}'::jsonb, '{"money": 1.75}'::jsonb, '{"theme": "money"}'::jsonb),
  ('PRIV-035', 'Basement Game Night', 'A hidden board game night promises friendship, snacks, and the possibility of spending four hours with deeply intense people.', 'risk_reward', 'GAME', '{"academics": -0.25}'::jsonb, '{"social": 1.25, "wellbeing": 0.5}'::jsonb, '{"theme": "social"}'::jsonb),
  ('PRIV-036', 'Stargazing Excursion', 'Someone talks you into driving out past the city lights and pretending existentialism counts as self-care.', 'risk_reward', 'STARS', '{"money": -0.25, "academics": -0.25}'::jsonb, '{"wellbeing": 1.5, "social": 0.5}'::jsonb, '{"theme": "wellbeing"}'::jsonb),
  ('PRIV-037', 'Short Film Shoot', 'A student filmmaker begs for help on set, and the line between glamorous and miserable is very thin tonight.', 'risk_reward', 'FILM', '{"wellbeing": -0.5}'::jsonb, '{"social": 1.0, "money": 0.75}'::jsonb, '{"theme": "arts"}'::jsonb),
  ('PRIV-038', 'Hidden Language Table', 'You find the one tiny language exchange group that is somehow both socially useful and academically relevant.', 'risk_reward', 'LANG', '{"social": -0.25}'::jsonb, '{"social": 1.0, "academics": 0.75}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PRIV-039', 'Night Lab Cleanup', 'A grad student offers you cash and access if you help with a task nobody else wants to do.', 'risk_reward', 'CLEANLAB', '{"wellbeing": -0.5}'::jsonb, '{"money": 1.25, "academics": 0.75}'::jsonb, '{"theme": "career"}'::jsonb),
  ('PRIV-040', 'Secret Donut Run', 'A late-night dessert mission offers sugar, bonding, and the chance to make tomorrow just a little harder on yourself.', 'risk_reward', 'DONUT', '{"wellbeing": -0.25}'::jsonb, '{"social": 1.0, "wellbeing": 0.75}'::jsonb, '{"theme": "food"}'::jsonb),
  ('PRIV-041', 'Shadow Interview', 'Someone arranges a private interview slot that could change your trajectory if you can hold yourself together.', 'risk_reward', 'INTERVIEW', '{"wellbeing": -0.5}'::jsonb, '{"money": 1.0, "social": 0.75}'::jsonb, '{"theme": "career"}'::jsonb),
  ('PRIV-042', 'Rooftop Study Date', 'A surprisingly romantic and productive invitation arrives with exactly enough ambiguity to be dangerous.', 'risk_reward', 'ROOFTOP', '{"social": -0.25}'::jsonb, '{"academics": 1.0, "social": 1.0}'::jsonb, '{"theme": "social"}'::jsonb),
  ('PRIV-043', 'Underground Debate Club', 'A room full of students who love hearing themselves talk may be exhausting, but it is also strangely useful.', 'risk_reward', 'DEBATE', '{"wellbeing": -0.25}'::jsonb, '{"social": 1.0, "academics": 0.75}'::jsonb, '{"theme": "academics"}'::jsonb),
  ('PRIV-044', 'Weekend Catering Gig', 'A friend-of-a-friend gets you onto an event crew for one night of chaos and cash.', 'risk_reward', 'CATER', '{"wellbeing": -0.5}'::jsonb, '{"money": 1.5, "social": 0.25}'::jsonb, '{"theme": "money"}'::jsonb),
  ('PRIV-045', 'Quiet Chapel Session', 'An invite to a silent private reflection session sounds boring until you realize your body has been begging for stillness.', 'risk_reward', 'CHAPEL', '{"social": -0.25}'::jsonb, '{"wellbeing": 1.5}'::jsonb, '{"theme": "wellbeing"}'::jsonb),
  ('PRIV-046', 'Unofficial Review Sheet', 'Someone offers a review sheet that is either heroic, unethical, or both, and you are too tired to draw the line cleanly.', 'risk_reward', 'REVIEW', '{"wellbeing": -0.5}'::jsonb, '{"academics": 1.75}'::jsonb, '{"theme": "exam"}'::jsonb),
  ('PRIV-047', 'Kitchen Hustle', 'A dorm kitchen pops up with a tiny black-market food operation and you get offered a role in it.', 'risk_reward', 'KITCHEN', '{"wellbeing": -0.25}'::jsonb, '{"money": 1.25, "social": 0.5}'::jsonb, '{"theme": "money"}'::jsonb),
  ('PRIV-048', 'Stolen Museum Pass', 'You get access to a beautiful quiet space that definitely was not intended for you tonight.', 'risk_reward', 'MUSEUM', '{"money": -0.25}'::jsonb, '{"wellbeing": 1.0, "academics": 0.75}'::jsonb, '{"theme": "arts"}'::jsonb),
  ('PRIV-049', 'Midnight Mentor Call', 'A former student offers private advice at an absurd hour, and you take it because ambition has no sleep schedule.', 'risk_reward', 'MENTOR', '{"wellbeing": -0.5}'::jsonb, '{"academics": 1.0, "money": 0.75}'::jsonb, '{"theme": "career"}'::jsonb),
  ('PRIV-050', 'Lucky Envelope Drop', 'Someone''s friend knows someone who knows someone, and suddenly a coded invitation falls right into your hands.', 'risk_reward', 'LUCKY', '{"social": -0.25, "money": -0.25}'::jsonb, '{"money": 1.0, "social": 1.0, "wellbeing": 0.5}'::jsonb, '{"theme": "mixed"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  effect_type = EXCLUDED.effect_type,
  code_prefix = EXCLUDED.code_prefix,
  risk_payload = EXCLUDED.risk_payload,
  reward_payload = EXCLUDED.reward_payload,
  metadata = EXCLUDED.metadata;
