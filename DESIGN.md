# College Life Simulator — Design Document

A 3-week multiplayer party game where 3–12 players secretly plan their college lives one slot at a time, balancing Grades, Social, Wellbeing, and Money while navigating events, hidden traits, and each other.

Inspired by Jackbox: everyone joins a room with a 4-letter code, plays on their own laptop, and the game runs ~30–45 minutes.

---

## Part 1 — Game Mechanics

### 1.1 Calendar

- **3 weeks × 7 days × 3 slots = 63 actions per player**
- Slots: **Morning · Afternoon · Night**
- Players batch-submit one full day at a time → 21 submissions per player
- Class days: Monday–Thursday
- **Midterm:** end of Week 2
- **Final:** end of Week 3

### 1.2 Stats

All stats use a 0–10 scale with 0.5 increments. Money uses dollars.

| Stat | Start | Notes |
|---|---|---|
| Grades | 1.0 | Academic performance, exam-driven |
| Social | 1.0 | Connectedness |
| Wellbeing | 5.0 | Long-term stability — drives outcome odds. **Hits 0 = eliminated** |
| Money | $100 | Separate currency |
| Energy | flat 3 actions/day | Not a tracked stat — fills the 3 daily slots |

**Character creation:** each player gets **3 free points** to distribute. 1 point = +1 stat, or +$50 if spent on Money. No cap on starting allocation.

### 1.3 Relationships

Per-pair, hidden, range 0–3.

| Level | Multiplier on shared actions |
|---|---|
| 0 | 1.0× |
| 1 | 1.1× |
| 2 | 1.2× |
| 3 | 1.3× |

Each player only sees their own row of relationships, not the full matrix. Not used in scoring directly (but achievements reward high relationship levels).

### 1.4 Outcome System (Bad / Normal / Good)

Every action resolves into one of three tiers:

- **Bad** → +0 (action did nothing, slot wasted)
- **Normal** → base effect
- **Good** → 2× base effect

**Outcome odds are linear in current Wellbeing:**

- Normal: always 60%
- Bad % = 40 × (1 − Wellbeing/10)
- Good % = 40 × (Wellbeing/10)

| Wellbeing | Bad | Normal | Good |
|---|---|---|---|
| 10 | 0% | 60% | 40% |
| 7.5 | 10% | 60% | 30% |
| 5 (start) | 20% | 60% | 20% |
| 2.5 | 30% | 60% | 10% |
| 0.5 | 38% | 60% | 2% |
| 0 | 💀 eliminated, score 0 |

Then apply: relationship multiplier · event modifiers · trait modifiers · same-day repetition penalty.

### 1.5 Action Menu

**Actions never reduce stats.** Only daily decay, bad Wildcard cards, skipping class, missing homework quota, and exam failures can reduce stats.

#### Morning slot

| Action | Base effect | Notes |
|---|---|---|
| Study | Grades +1 | Solo |
| Study Together (target) | Grades +1, Social +0.5 | Half if not matched, no relationship gain |
| Work | Money +$30 | Available in any non-class daytime slot, never at night |
| Exercise | Wellbeing +1 | Morning/Afternoon only |
| Socialize (target, $0/$10/$20) | Social +1 / +1.5 / +2 | Half if not matched, money still spent |
| Rest | Wellbeing +1 | Day recovery |
| Wildcard | Random card OR Event if code held | 1/day cap |

#### Afternoon slot

Same as Morning, plus:

| Action | Base effect | Notes |
|---|---|---|
| Class | Grades +1, Social +0.5 | Only when player has class this slot (auto-filled by schedule) |
| Skip Class | Grades −0.5 | Frees the slot for any other afternoon action |

(Work also available here on non-class days, or in afternoon if class was morning.)

#### Night slot

| Action | Base effect | Notes |
|---|---|---|
| Study | Grades +1 | |
| Study Together (target) | Grades +1, Social +0.5 | |
| Socialize (target, $0/$10/$20) | Social +1.5 / +2 / +2.5 | Higher upside than day |
| Sleep | Wellbeing +1.5 | **Mandatory most nights** — see No-Sleep penalty below |
| Wildcard | Random card OR Event | |

(No Class, Work, or Exercise at night.)

### 1.6 Class Schedule

Each player gets **3 randomly-assigned class slots** placed across the Mon–Thu morning/afternoon grid (8 possible positions). Schedules are **personalized** — your class times differ from other players', creating real coordination friction for Study Together / Socialize.

- **Class:** Grades +1, Social +0.5
- **Skip Class:** Grades −0.5 (frees slot)

### 1.7 Sleep & the No-Sleep Penalty

- Sleep is night-only, gives Wellbeing +1.5
- **If your Night slot is NOT Sleep, end-of-day Wellbeing −1 extra** (on top of normal decay)
- Functionally mandatory most nights — skipping Sleep = "I'm pulling an all-nighter for this party/study/event and paying for it"

### 1.8 Mutual-Confirm Shared Actions

**Socialize and Study Together** require picking a target player.

- Both must pick each other in the **same slot** to match
- Match → full effect, +1 relationship progress (every 2 progress = +1 relationship level, max 3)
- Mismatch → 50% effect, no relationship gain, money still spent

With 10+ players, mutual confirms become a *negotiation* mechanic — players talk before submitting.

### 1.9 Same-Day Repetition Penalty

Per day, per action type:

- 1st use: full effect
- 2nd use same day: half effect
- 3rd use same day: no effect

Applied after outcome tier resolution.

### 1.10 Daily Decay

Applied at the end of each day:

| Stat | Decay |
|---|---|
| Grades | −1 |
| Social | −1 |
| Wellbeing | −1 |
| Money | −$10 |

**Broke penalty:** if Money = $0 at end of day, Wellbeing decay becomes **−3** that day instead of −1. $10/$20 Socialize unavailable while broke.

### 1.11 Homework Quota

- **3 Studies required per week** (solo Study or Study Together; Class does not count)
- **Each missed Study: −0.5 Grades** at end of week
- Max weekly homework penalty: −1.5

### 1.12 Exams

Exam result reuses the outcome system.

**Effective Exam Wellbeing = (current Wellbeing + current Grades) / 2**

That value sets the Bad/Normal/Good odds (same linear formula as actions).

| Exam | Bad | Normal | Good |
|---|---|---|---|
| Midterm (end Wk2) | Grades −1 | ±0 | Grades +1 |
| Final (end Wk3) | Grades −2 | ±0 | Grades +2 |

Higher Grades + higher Wellbeing → better odds. Grades is both the input *and* the thing exams move.

### 1.13 Wildcard Deck (20 cards)

If you hold no event code, Wildcard pulls a random card. If you hold a code, the slot becomes "Attend [Event Name]" instead.

| # | Name | Effect |
|---|---|---|
| 1 | Found Cash | Money +$20 |
| 2 | Great Convo | Social +1 |
| 3 | Productive Walk | Wellbeing +1 |
| 4 | Cracked the Concept | Grades +1 |
| 5 | Free Meal | Money +$10, Wellbeing +0.5 |
| 6 | Surprise Gift | Money +$30 |
| 7 | Inspiration Strikes | Next Study slot auto-Good |
| 8 | New Friend | Pick a player, Relationship +1 progress |
| 9 | Library Lockdown | All Studies tomorrow: Bad → Normal |
| 10 | Caffeine High | Next 2 actions auto-Normal minimum |
| 11 | Doomscrolled | Nothing happens |
| 12 | Free Pizza | Social +0.5 if Social ≥4, else nothing |
| 13 | Mixed Day | +1 to a random stat, −0.5 to another |
| 14 | Phone Call Home | Wellbeing +0.5 OR −0.5 (50/50) |
| 15 | Caught a Cold | Wellbeing −1 |
| 16 | Pickpocketed | Money −$15 |
| 17 | Ghosted | Social −1 |
| 18 | Hangover | Skip next slot (auto-Bad) |
| 19 | Lost Notes | Grades −0.5 |
| 20 | Awkward Drama | Social −0.5, lose 1 Rel progress with random player |

### 1.14 Events (40 total — 20 public, 20 private)

Events last **1 day only**.

**Public events** are visible to everyone. Some are passive modifiers, some require a Wildcard slot to attend.

**Private events** are dealt as codes to 3–5 players. Some are major-restricted. **Code sharing:** the original holder may pass the code to ONE other player (one hop only). Recipient cannot re-share.

#### Public events (20)

Passive (10):

| # | Name | Effect |
|---|---|---|
| 1 | Midterm Cram Week | All Study: +0.5 extra Grades (Wk2 only) |
| 2 | Sunny Day | Exercise: +0.5 extra Wellbeing |
| 3 | Cafeteria Sale | Daily food cost $2 today |
| 4 | Group Project Mode | Study Together: +0.5 extra to both |
| 5 | Quiet Library | All solo Studies: Bad → Normal |
| 6 | Cold Snap | Exercise unavailable today |
| 7 | Frat Party Night | Night Socialize: +1 extra Social |
| 8 | Power Outage | Morning Study unavailable; Socialize +0.5 |
| 9 | Surprise Quiz | Grades <5 → −0.5 Grades; ≥7 → +0.5 Grades |
| 10 | Wellness Day | Rest gives +1 extra Wellbeing |

Active — consume Wildcard slot to attend (10):

| # | Name | Slot | Effect |
|---|---|---|---|
| 11 | Career Fair | Afternoon | Grades +1, Social +1, Internship eligibility |
| 12 | Music Festival | Night | Social +2, Wellbeing +1, costs $20 |
| 13 | Hackathon | Night | Grades +2 |
| 14 | Job Interview | Morning | Money +$50, Social +0.5 |
| 15 | Open Mic Night | Night | Social +1.5, Wellbeing +1 |
| 16 | Charity 5K | Morning | Wellbeing +2 |
| 17 | Guest Lecture | Afternoon | Grades +1.5 |
| 18 | Study Workshop | Afternoon | Grades +1, +1 Rel with each attendee |
| 19 | Tailgate | Afternoon | Social +1.5, costs $10 |
| 20 | Volunteer Day | Morning | Wellbeing +1, Social +0.5, Good Samaritan eligibility |

#### Private events (20)

| # | Name | Restriction | Effect |
|---|---|---|---|
| 1 | Secret Study Group | none | Grades +2, +1 Rel with each attendee |
| 2 | Underground Poker | none | Money +$50 OR −$30 (Wellbeing roll) |
| 3 | VIP Concert | none | Social +3, Wellbeing +1 |
| 4 | Office Hours | CS / Pre-Med | Grades +2.5 |
| 5 | Frat/Sorority Mixer | Business / Arts | Social +2, +1 Rel with attendees |
| 6 | Late-Night Diner | none | Social +1.5, Wellbeing +1, costs $10 |
| 7 | Insider Internship | Business / CS | Money +$80 |
| 8 | Sketchy Deal | none | Money +$60 OR Wellbeing −3 (roll) |
| 9 | Underground Art Show | Arts | Social +2, Wellbeing +1.5 |
| 10 | Research Lab Invite | CS / Pre-Med | Grades +2, Researcher eligibility |
| 11 | House Party | none | Social +2.5, Wellbeing +0.5 |
| 12 | Anonymous Tutoring Gig | none | Money +$50, Grades +0.5 |
| 13 | Date Night | none, target req | Both: Social +1.5, Wellbeing +1.5, +1 Rel |
| 14 | Cult Meeting | none | Social +1, then Wellbeing −1 OR +2 (roll) |
| 15 | Black Market | none | Money +$100, Wellbeing −1 |
| 16 | Frat Pledge | Business | Social +3, Wellbeing −2 |
| 17 | Senior Mentor | none | Grades +1, Social +1, Wellbeing +0.5 |
| 18 | Brand Deal | needs Social ≥6 | Money +$60 |
| 19 | Unsanctioned Rave | none | Social +2, Wellbeing −1, Grades −0.5 |
| 20 | Family Emergency | none | Money −$30, Wellbeing +0.5 (perspective) |

### 1.15 Majors (5)

Majors are randomly assigned at character creation. Each has scoring weights and event eligibility — no other gameplay effect.

| Major | wG | wS | wW | wM | Event access |
|---|---|---|---|---|---|
| Computer Science | 4 | 1 | 2 | 3 | Tech private events |
| Business | 2 | 3 | 2 | 3 | Business private events |
| Pre-Med | 5 | 1 | 3 | 1 | Med private events |
| Arts/Media | 1 | 4 | 3 | 2 | Arts private events |
| Undecided | 2.5 | 2.5 | 2.5 | 2.5 | Any major's private events |

### 1.16 Traits (1 positive + 1 negative, randomly dealt)

#### Positive traits (20)

| # | Name | Effect |
|---|---|---|
| 1 | Night Owl | Night actions: 20% Bad → Normal |
| 2 | Disciplined | Study never rolls Bad |
| 3 | Charismatic | Successful Socialize gives +0.5 extra Social |
| 4 | Athletic | Exercise gives +1.5 instead of +1 |
| 5 | Saver | Daily Money decay is $3 instead of $10 |
| 6 | Charmer | Free Socialize matches → effect of $10 Socialize |
| 7 | Quick Study | Good Study outcomes give +0.5 extra Grades |
| 8 | Lucky | Once per day, re-roll a Bad Wildcard |
| 9 | Networker | Study Together also gives +0.5 Social on success |
| 10 | Early Riser | Morning actions: 10% Normal → Good |
| 11 | Resilient | First time Wellbeing would hit 0, set to 1 instead |
| 12 | Trust Fund | +$100 starting Money |
| 13 | Influencer | At Social ≥7, gain +0.5 Social passive each day |
| 14 | Bookworm | Solo Study gives +0.5 extra Grades |
| 15 | Gym Rat | Exercise also gives +0.5 Social |
| 16 | Study Buddy | Study Together never rolls Bad |
| 17 | Optimist | Wellbeing decay is −0.5/day instead of −1 |
| 18 | Adaptable | Same-day repetition penalty doesn't apply |
| 19 | Hustler | Work gives +$40 instead of +$30 |
| 20 | Connected | Start Week 1 with 1 free private event code |

#### Negative traits (20)

| # | Name | Effect |
|---|---|---|
| 1 | FOMO | If anyone Socializes and you don't that day, Wellbeing −0.5 |
| 2 | Anxious | Mismatched shared actions cost extra Wellbeing −0.5 |
| 3 | Lazy | Exercise has 50% Bad rate regardless of Wellbeing |
| 4 | Broke Family | Start with $0 |
| 5 | Sickly | Wellbeing decay is −1.5/day instead of −1 |
| 6 | Procrastinator | First Study each week is auto-Bad |
| 7 | Gossip | Event codes you receive auto-leak to 1 random player |
| 8 | Cheap | $10/$20 spend gives only $0/$10 effect |
| 9 | Loner | Successful shared actions give only 75% effect |
| 10 | Insomniac | Sleep gives only +0.5 Wellbeing |
| 11 | Hot-headed | Mismatched shared actions cost 1 Relationship progress |
| 12 | Distracted | Class gives only +0.5 Grades |
| 13 | Spendthrift | Daily Money decay is $15 instead of $10 |
| 14 | Pessimist | Your Good rolls become Normal |
| 15 | Hypochondriac | At Wellbeing ≤4, +10% Bad chance on all actions |
| 16 | Heartbreaker | Cannot reach Relationship Level 3 with anyone |
| 17 | Forgetful | 1 random class per week is auto-skipped |
| 18 | Phone Addict | Wildcard never pulls a Good card |
| 19 | Burnout-Prone | Study 2 days in a row → Wellbeing −1 |
| 20 | Allergic | Exercise gives +0.5 Wellbeing instead of +1 |

### 1.17 Achievements (15, hidden until end)

Flat score bonuses revealed during end-of-game ceremony.

| # | Name | Condition | Bonus |
|---|---|---|---|
| 1 | Dean's List | Grades ≥ 9 at end | +5 |
| 2 | Famous | Social ≥ 9 at end | +5 |
| 3 | Drop-Out Rich | Money ≥ $300 at end | +5 |
| 4 | Zen Master | Wellbeing ≥ 9 at end | +5 |
| 5 | Best Friends Forever | Reach Rel 3 with any player | +3 |
| 6 | Survivor | Wellbeing dipped <2, recovered to ≥6 | +5 |
| 7 | Broke But Alive | Hit $0, finish alive | +3 |
| 8 | Internship Landed | Career Fair attended + Grades ≥7 | +4 |
| 9 | Locked In | Never skipped a class day | +3 |
| 10 | Networker | Successful Socialize with 4+ different players | +4 |
| 11 | Researcher | Research Lab event + Grades ≥8 | +5 |
| 12 | Heartthrob | Reach Rel 2 with 3+ players | +3 |
| 13 | Renaissance Student | Grades, Social, Wellbeing, Money/20 all ≥6 | +6 |
| 14 | Master of One | Any single stat = 10 | +5 |
| 15 | Hustler King | Money ≥ $500 at end | +6 |

### 1.18 Final Score Formula

```
Score = (Grades × wG)
      + (Social × wS)
      + (Wellbeing × wW)
      + (Money / 20 × wM)
      + (Best Relationship Level × 2)
      + Σ Achievement Bonuses
```

(Money/20 normalizes $200 → 10 to match stat scale.)

Eliminated players (Wellbeing 0): final score = 0.

### 1.19 Day Resolution Pipeline

Once all players submit a day:

1. **Validate** each submitted action (slot legal, money sufficient, target exists, etc.)
2. **Resolve mutual-confirm** matches for Socialize / Study Together
3. **Roll outcome tiers** per action using current Wellbeing
4. **Apply modifiers**: relationship multiplier · event modifiers · trait modifiers · same-day repetition · paid social tiers
5. **Apply stat changes** to each player
6. **Apply daily decay** (Grades −1, Social −1, Wellbeing −1, Money −$10)
7. **Check no-sleep penalty** (extra −1 Wellbeing if Night ≠ Sleep)
8. **Check elimination** (Wellbeing 0 → out, score locked at 0)
9. **End-of-week checks** (homework quota → Grades penalty)
10. **Exam check** (end of Wk2 → Midterm; end of Wk3 → Final)
11. **Generate flavor lines** (~7 per day, picked from a pool of 200+ keyed to outcomes/events/wildcards)
12. **Broadcast resolution animation** to all players

---

## Part 2 — Web Design

### 2.1 Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI primitives | Custom components (shadcn/ui added as needed) |
| Realtime + DB | Supabase (Postgres + Realtime channels) — to be wired in next |
| Hosting | Vercel (frontend) + Supabase (DB) |
| Auth | None — name + 4-letter room code, identity in `localStorage` cookie |

Project lives at `/web` inside this repo. Old prototype (`game.js`, `index.html`) preserved at root for reference.

### 2.2 Design Tokens

Mood: dorm-room poster vibes — dark, warm, tactile. Not corporate SaaS.

| Token | Value | Use |
|---|---|---|
| `--background` | `#0e1014` | Page bg |
| `--foreground` | `#f4ead5` | Default text (paper) |
| `--paper` | `#f4ead5` | Bright text |
| `--ink` | `#1a1d23` | Text on light buttons |
| `--accent` | `#d94f4f` | Primary action (red) |
| `--accent-soft` | `#f0a868` | Secondary action (warm orange) |
| `--muted` | `#8a8579` | Secondary text |
| `--card` | `#181b21` | Card surface |
| `--card-border` | `#2a2e36` | Card outline |

Effects:
- Subtle SVG noise grain overlay on body (4% opacity)
- Radial gradient hints in corners (red top-left, orange bottom-right)
- Title `wobble` keyframe (6s ease-in-out)
- Buttons: `active:translate-y-0.5` for tactile press
- Code input: monospace, 0.5rem letter-spacing

### 2.3 Screens (8 total)

| # | Route | Status | Description |
|---|---|---|---|
| 1 | `/` | ✅ **Built** | Home — Create / Join |
| 2 | `/room/[code]` (lobby state) | 🟡 placeholder | Lobby — players gather, host starts game |
| 3 | `/room/[code]` (setup state) | ⏳ | Character setup — name, random major+traits, distribute 3 stat points |
| 4 | `/room/[code]` (day state) | ⏳ | Day View — fill 3 slots, see calendar, side panel with stats |
| 5 | `/room/[code]` (resolution state) | ⏳ | Day Resolution — animated reveal of ~7 flavor lines |
| 6 | `/room/[code]` (exam state) | ⏳ | Exam screen — Midterm / Final reveal |
| 7 | `/room/[code]` (end state) | ⏳ | End reveal — achievements unveiled, scores, narrative phase |
| — | side panel (always visible during play) | ⏳ | Stats, schedule, hidden info, relationships |

The room route is a single page that switches sub-views by game state. Game state lives on the server (Supabase row), broadcast via Realtime.

### 2.4 Built So Far

**`/` (Home)** — `app/page.tsx`
- Title with subtle wobble animation
- Two card buttons: Create Game / Join Game
- Inline form expansion (no modals) — clicking a card swaps content
- Create flow: name input → generates 4-letter code → navigates to `/room/[CODE]`
- Join flow: code input (auto-uppercase, A–Z only, 4 chars) + name → navigates
- Validation: name 1–20 chars, code exactly 4 letters
- Identity persisted to `localStorage` (`cls.name`, `cls.role`)

**`/room/[code]` (placeholder)** — `app/room/[code]/page.tsx`
- Renders the room code in giant monospace
- "Lobby coming next" message
- Currently a server component using `PageProps<'/room/[code]'>` with awaited params (Next 16 API)

### 2.5 Identity & Room Codes

- Room code: 4 letters from `ABCDEFGHJKLMNPQRSTUVWXYZ` (skip I, O for visual clarity)
- No accounts. Identity = `(roomCode, playerId, name)` stored in `localStorage`
- Refresh-safe: rejoin auto-detects from cookie/localStorage
- Player count cap: 12 (UI scales to that)

### 2.6 State Model (planned, not yet built)

Server-authoritative. Flow:

```
Client → POST action → Server validates → Server resolves day →
Server broadcasts public state to room channel →
Server broadcasts private state to each player's private channel
```

Hidden info (your traits, your event codes, your action plans before submit) only sent to that player's private channel. Public state (room roster, current day, who has submitted, public events, resolution flavor lines) goes to the room channel.

### 2.7 Database Schema (planned)

```
rooms        (code PK, status, host_id, current_day, current_phase, created_at)
players      (id PK, room_code FK, name, major, pos_trait, neg_trait,
              grades, social, wellbeing, money,
              class_schedule jsonb, eliminated bool)
relationships (room_code, player_a, player_b, level, progress)
day_actions  (room_code, day, slot, player_id, action, target_id, money_spent, submitted_at)
events       (room_code, day, event_id, public bool, holders jsonb)
resolutions  (room_code, day, log jsonb)
```

### 2.8 Realtime Channels (planned)

- `room:{code}` — public state changes (player joined, day started, day resolved)
- `player:{playerId}` — private state changes (your traits revealed, event code received, action validated)

### 2.9 Day Resolution Animation

- Cherry-picks ~7 events from across all players' resolved actions
- Eligible events: Good rolls, Bad rolls, mismatched shared actions, Wildcard pulls, event attendance, eliminations, achievements unlocked (silent — surfaced at end)
- Pool of 200+ flavor lines, keyed by action + outcome + context
- Examples:
  - "Maya went studying but got absolutely demolished by a band partying nearby"
  - "Jake hit gold chatting up a stranger at Starbucks — instant connection"
  - "Sam tried to study together with Riley, but Riley was already at the gym. Awkward."
- Sequential reveal, ~3 seconds per line, with lightweight motion

### 2.10 Side Panel (always visible during play)

Each player sees their own panel showing:

- Current stats (Grades, Social, Wellbeing, Money) with bars
- Day / week indicator
- Class schedule (the 3 randomly-placed slots)
- Hidden info: positive trait, negative trait, held event codes
- Relationship row: your relationship level with each other player
- Compact: takes ~25–30% of screen on the right side

### 2.11 Out of Scope for v1

- Mobile-first layout (laptop-primary; mobile is best-effort)
- Spectator mode (eliminated players watch passively)
- Sound effects / music
- Public room browser
- Replay / save game
- Profanity filter on names
- Tutorial / how-to-play overlay
- Animation polish beyond the basics

---

## Part 3 — Build Status

| Task | Status |
|---|---|
| Design doc (this file) | ✅ |
| Logic spec complete | ✅ |
| Next.js project scaffolded | ✅ |
| Home screen built | ✅ |
| Dev server running on `localhost:3000` | ✅ |
| Room placeholder route | ✅ |
| Lobby screen | ⏳ next |
| Character setup | ⏳ |
| Day view | ⏳ |
| Day resolution | ⏳ |
| Exam screen | ⏳ |
| End reveal | ⏳ |
| Side panel | ⏳ |
| Supabase backend wired | ⏳ |
| 200+ flavor lines written | ⏳ |
| Vercel deployment | ⏳ |

## Part 4 — How to Run

```bash
cd web
npm run dev
# open http://localhost:3000
```

To stop: kill the running `next dev` process.
