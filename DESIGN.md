# College Life Simulator — Design Document

A 3-week multiplayer party game where 3–12 players secretly plan their college lives one slot at a time, balancing four stats — Academics, Social, Wellbeing, Money — while navigating events, hidden traits, and each other.

Inspired by Jackbox: everyone joins a room with a 4-letter code, plays on their own laptop, and the game runs ~30–45 minutes.

---

## Part 1 — Game Mechanics

### 1.0 Number Grid (hard rule)

**Every value in this game is a multiple of 0.25.** Allowed deltas: `0.25, 0.5, 0.75, 1` (and their negatives). After every modifier (outcome tier × repetition penalty × event/trait), the final delta is **rounded to the nearest 0.25** before being applied to a stat.

### 1.1 Calendar

- **3 weeks × 7 days × 3 slots = 63 actions per player**
- Slots: **Morning · Afternoon · Night**
- Players batch-submit one full day at a time → 21 day-submissions per player
- Class days: Monday–Thursday
- **Week 1:** no exam
- **Week 2 end:** Midterm
- **Week 3 end:** Final

### 1.2 Stats (4 total)

All stats use a **0–10 scale in 0.25 steps**.

| Stat | Start | Display | Daily decay |
|---|---|---|---|
| Academics | 2.0 *(design: 1.0; code uses 2.0)* | bar `0.0–10.0` | −0.5 |
| Social | 2.0 *(design: 1.0; code uses 2.0)* | bar `0.0–10.0` | −0.5 |
| Wellbeing | 5.0 | bar `0.0–10.0` | −0.5 |
| Money | 2.0 | bar `0.0–10.0` with `$25 / $50` spend labels | −0.5 *(design: −1; code uses −0.5)* |

- **Wellbeing 0 → eliminated** (final score 0).
- **Character creation:** each player gets **3 free points** to distribute. 1 point = +1 to any stat.
- **Warnings:** Academics ≤ 1, Social ≤ 1, or Money ≤ 0 triggers a warning. Each active warning costs **−1.5 Wellbeing** at day start.
- **No-sleep penalty:** Night slot ≠ Sleep → extra Wellbeing −1.5.

### 1.3 Relationships *(not implemented)*

Per-pair, hidden, range 0–3.

| Level | Multiplier on shared actions |
|---|---|
| 0 | 1.0× |
| 1 | 1.25× |
| 2 | 1.5× |
| 3 | 1.75× |

Each player only sees their own row. Multipliers chosen so that base × rel-mult lands cleanly on the 0.25 grid after rounding.

> **Current implementation:** Relationships are mocked in `DayView.tsx` via `hashString`. No `relationships` table is queried or updated.

### 1.4 Outcome System (Bad / Normal / Good)

Every action resolves into one of three tiers:

- **Bad** → base × **0.75** *(design: 0.5; code uses 0.75)*
- **Normal** → base × **1**
- **Good** → base × **1.25** *(design: 1.5; code uses 1.25)*

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
| 0 | 💀 eliminated, score 0 |

> **Current implementation:** Outcomes are hash-based deterministic (`hashString`). True RNG is planned.

Modifier order on each action: **outcome tier → relationship multiplier → event modifiers → trait modifiers → repetition penalty → round to nearest 0.25 → apply.**

### 1.5 Action Menu

**Actions never reduce stats.** Only daily decay, bad Wildcard cards, skipping class, missed homework quota, broke penalty, no-sleep penalty, and exam failures can reduce stats.

#### Morning slot

| Action | Base effect | Cost | Notes |
|---|---|---|---|
| Study (solo) | Academics +1 | — | |
| Study Together (target) | Academics +0.75, Social +0.5 | — | *(not implemented)* |
| Work | Money +1 | — | |
| Exercise | Wellbeing +1 | — | Morning/Afternoon only |
| Socialize Free (target) | Social +1 | $0 | Half if mismatched |
| Socialize Coffee (target) | Social +1.25 | $25 (0.25 Money) | Half if mismatched, money still spent |
| Socialize Food (target) | Social +1.5 | $50 (0.5 Money) | Half if mismatched, money still spent |
| Rest | Wellbeing +0.75 *(design: +0.5; code uses +0.75)* | — | Day recovery |
| Wildcard | random card OR redeem event code | — | 1/day cap |
| Class | Academics +0.75, Social +0.25 | — | Shown when a class is scheduled in that slot |

#### Afternoon slot

Same as Morning.

#### Night slot

| Action | Base effect | Notes |
|---|---|---|
| Study (solo) | Academics +1 | |
| Study Together (target) | Academics +0.75, Social +0.5 | *(not implemented)* |
| Socialize Free (target) | Social +1 | |
| Socialize Coffee (target) | Social +1.25 | |
| Socialize Food (target) | Social +1.5 | |
| Sleep | Wellbeing +1 | Night-only |
| Wildcard | random card OR redeem event code | |

(No Class, Work, or Exercise at night.)

### 1.6 Class Schedule

Each player gets **3 random class sessions** placed across the **Mon–Thu morning/afternoon grid** (4 days × 2 slots = 8 candidate cells).

Generation rule:
- Pick **3 distinct days** from {Mon, Tue, Wed, Thu}
- For each chosen day, randomly assign **morning OR afternoon** as the class slot
- **Never two classes on the same day**
- Schedules are personalized → coordination friction for Study Together / Socialize

Effects:
- **Class**: Academics +0.75, Social +0.25
- **Skip Class**: Academics −0.5 (any non-Class action selected in a class slot counts as skipping)

> **Current implementation:** Server assigns schedules via `setup-roll.ts` using true `Math.random()`. Player sees class indicator in slot picker.

### 1.7 Sleep & No-Sleep Penalty

- Sleep is **night-only**, gives Wellbeing +1.
- **If your Night slot is NOT Sleep, end-of-day Wellbeing + −1.5 extra** (on top of the −0.5 daily decay).
- Net effect of an all-nighter day: Wellbeing −2.0 vs. a normal-sleep day's −0.5.

> **Current implementation:** No-sleep penalty is applied in `day-resolution.ts`. Drowsy warning shown in DayView and ResolutionView when no rest/sleep selected.

### 1.8 Mutual-Confirm Shared Actions

**Socialize (any tier) and Study Together** require picking a target player.

- Both must pick each other in the **same slot** to match
- **Match** → full effect, +1 relationship progress *(relationship system not implemented)*
- **Mismatch** → 50% effect, no relationship gain, money still spent

> **Current implementation:** Ditched penalty works for Socialize. Study Together action doesn't exist. No relationship progress tracked.

### 1.9 Same-Day Repetition Penalty

Per day, per action type:

| Use # that day | Effectiveness multiplier |
|---|---|
| 1st | × 1.0 |
| 2nd | × 0.5 |
| 3rd | × 0.25 |

Applied **after** the outcome tier multiplier. Final delta is rounded to the nearest 0.25 before apply. Counted per action type — the three Socialize tiers count as one type.

> **Current implementation:** Applied in `day-resolution.ts`. Displayed in ResolutionView.

### 1.10 Daily Decay

Applied at the end of each day, after action effects:

| Stat | Decay |
|---|---|
| Academics | −0.5 *(design doc says −0.75; code uses −0.5)* |
| Social | −0.5 *(design doc says −0.75; code uses −0.5)* |
| Wellbeing | −0.5 *(design doc says −0.75; code uses −0.5)* |
| Money | −0.5 *(design doc says −1; code uses −0.5)* |

**Broke penalty:** if Money clamps at 0, **additional Wellbeing −1.5 that day** (on top of base decay). Coffee/Food Socialize unavailable when Money < cost.

> **Current implementation:** Daily decay applied. Broke penalty **not yet implemented**.

### 1.11 Homework Quota *(not implemented)*

- **4 Studies required per week** (solo Study OR Study Together; Class does NOT count)
- Penalty applied at end of week:

| Studies completed | Penalty |
|---|---|
| 4+ | none |
| 3 | Academics −0.5 |
| 2 | Academics −1 |
| 1 | Academics −1.5 |
| 0 | Academics −2 |

> **Current implementation:** UI shows weekly study tracker but penalty is never applied.

### 1.12 Exams

Exam result reuses the Bad/Normal/Good roll, but on a different input:

**Effective Exam Wellbeing = (current Wellbeing + current Academics) / 2**

That value sets the Bad/Normal/Good odds (same linear formula as actions in §1.4).

| Exam | Bad | Normal | Good |
|---|---|---|---|
| Midterm (end Wk2) | Academics −1.5 *(code uses −1.5 / −0.75 / 0 / +0.75 / +1.5)* | ±0 | Academics +1.5 |
| Final (end Wk3) | Academics −3 *(code uses −3 / −1.5 / 0 / +1.5 / +3)* | ±0 | Academics +3 |

Wellbeing always +1 after exam *(design doc intent; currently hardcoded in resolution)*.

> **Current implementation:** `ExamView.tsx` renders vertical ranked list with animated card reveals. `exam-resolution.ts` uses simple threshold scoring (not the wellbeing-roll design). Exam days are hardcoded to Day 12 (midterm) and Day 19 (final) instead of Day 14 and Day 21.

### 1.13 Wildcard Deck (21 cards) *(not implemented)*

If you hold no event code, Wildcard pulls a random card. If you hold a code, the slot becomes "Attend [Event Name]" instead.

**Distribution (intentional variance):** 6 big-positive, 6 small-positive, 3 neutral, 3 small-negative, 3 big-negative.

Wildcard pulls **bypass the Bad/Normal/Good roll** — the card *is* the outcome.

> **Current implementation:** Code pulls from 6 hardcoded private events. No 21-card deck, no code redemption.

### 1.14 Events *(not implemented)*

The full design has **20 public events + 20 private events**. **Each game session samples 10 of each** from the respective deck and distributes them across the 21 days.

#### 1.14a Public (Major) Events — 20 in deck, 10 sampled per session

Announced to the whole room at day start. Don't consume a slot — apply as multipliers / passives on specific action types for that one day.

> **Current implementation:** One mock event banner shown in DayView. No real event system, no modifiers applied in resolution.

#### 1.14b Private Events — 20 in deck, 10 sampled per session

Sampled events are dealt as **codes** to a small subset of players. Effects target ≈ **1.75× a normal action** on the relevant stat.

**One-hop sharing:** original holder may pass code to ONE other player; recipient cannot re-share. Redeeming costs a Wildcard slot.

> **Current implementation:** 6 hardcoded events in a flip card. No code-dealing, no prereq checks, no sharing.

### 1.15 Majors (5)

Each player is randomly assigned a major at character creation. Majors do two things:
1. Determine the **scoring weights** at end of game.
2. Determine **eligibility** for major-restricted private events.

Weights sum to 10:

| Major | wA | wS | wW | wM | Private event tag(s) |
|---|---|---|---|---|---|
| Computer Science | 4 | 1 | 2 | 3 | CS / Pre-Med |
| Business | 2 | 3 | 2 | 3 | Business / Arts |
| Pre-Med | 4 | 1 | 4 | 1 | CS / Pre-Med |
| Arts / Media | 1 | 4 | 3 | 2 | Business / Arts |
| Undecided | 2.5 | 2.5 | 2.5 | 2.5 | any |

> **Current implementation:** Server assigns major via `setup-roll.ts`. Labels shown in setup and day view. Scoring weights not yet used (no endgame screen).

### 1.16 Traits (1 positive + 1 negative per player, randomly dealt)

Visible only to the owner via the side panel.

> **Current implementation:** 25 positive traits and 20 negative traits defined. ~13 have actual code hooks in `day-resolution.ts`. Trait compatibility rules prevent illogical pairings (e.g., Disciplined + Distracted). Remaining traits are flavor-text only.

#### Positive (25 defined, ~9 hooked)

| # | Name | Effect | Status |
|---|---|---|---|
| 1 | Night Owl | Night-slot actions: outcome ×1.25 | 🔧 |
| 2 | Disciplined | Study never rolls Bad | ✅ |
| 3 | Charismatic | Successful Socialize: +0.25 extra Social | 🔧 |
| 4 | Athletic | Exercise: outcome ×1.5 | ✅ |
| 5 | Penny-Pincher | Daily Money decay −0.5 instead of −1 | 🔧 |
| 6 | Early Bird | Morning-slot actions: outcome ×1.25 | 🔧 |
| 7 | Quick Study | Good Study outcomes give +0.25 extra Academics | 🔧 |
| 8 | Lucky | Once per day, re-roll one Bad outcome | 🔧 |
| 9 | Networker | Study Together: +0.25 extra Social on success | 🔧 *(Study Together missing)* |
| 10 | Trust Fund Kid | +1 starting Money | ✅ |
| 11 | Resilient | First time Wellbeing hits 0, set to 1 instead | ❌ |
| 12 | Influencer | At Social ≥ 7, gain +0.25 Social passive each day | ❌ |
| 13 | Bookworm | Solo Study: +0.25 extra Academics | 🔧 |
| 14 | Gym Rat | Exercise also gives +0.25 Social | 🔧 |
| 15 | Study Buddy | Study Together never rolls Bad | 🔧 *(Study Together missing)* |
| 16 | Optimist | Wellbeing decay −0.25 instead of −0.75 | ❌ |
| 17 | Adaptable | Same-day repetition penalty does not apply | ✅ |
| 18 | Hustler | Work: outcome ×1.25 | ✅ |
| 19 | Connected | Start Wk1 with 1 free private event code | ❌ |
| 20 | Charmer | Free Socialize match treated as Coffee-tier effect | 🔧 |
| 21 | Self Care | Rest and Sleep give +0.25 extra Wellbeing | ❌ |
| 22 | Coupon Clipper | Free Socialize uses Coffee-tier effect; $25 uses Food-tier | ❌ |
| 23 | Calm Sleeper | Sleep gives +0.5 extra Wellbeing | ❌ |
| 24 | Professor's Favorite | Class gives +0.25 extra Social | ❌ |
| 25 | — | — | — |

#### Negative (20 defined, ~7 hooked)

| # | Name | Effect | Status |
|---|---|---|---|
| 1 | FOMO | If anyone Socializes and you don't: Wellbeing −0.5 | 🔧 |
| 2 | Anxious | Mismatched shared actions: Wellbeing −0.5 | ✅ |
| 3 | Couch Potato | Exercise rolls Bad 50% regardless of Wellbeing | ✅ |
| 4 | Broke Family | Start with Money 0 | ✅ |
| 5 | Sickly | Wellbeing decay −1.25 instead of −0.75 | ✅ |
| 6 | Procrastinator | First Study each week is auto-Bad | 🔧 |
| 7 | Loose Lips | Event codes you receive auto-leak | ❌ |
| 8 | Penny-Wise | Coffee/Food Socialize give Free-tier effect (money still spent) | 🔧 |
| 9 | Loner | Successful shared actions: outcome ×0.75 | ✅ |
| 10 | Insomniac | Sleep: outcome ×0.5 | ✅ |
| 11 | Hot-Headed | Mismatched shared actions cost 1 Relationship progress | ❌ |
| 12 | Distracted | Class gives only Academics +0.25 (not +0.75) | ✅ |
| 13 | Spendthrift | Daily Money decay −1.5 instead of −1 | ✅ |
| 14 | Pessimist | Your Good rolls become Normal | ✅ |
| 15 | Hypochondriac | At Wellbeing ≤ 4, +10% Bad chance on all actions | ✅ |
| 16 | Heartbreaker | Cannot reach Relationship Lvl 3 | ❌ |
| 17 | Forgetful | 1 random class per week is auto-skipped | ❌ |
| 18 | Phone Addict | Wildcard never pulls a positive-tier card | ❌ |
| 19 | Burnout-Prone | Studying 2 days in a row → Wellbeing −1 second day | ❌ |
| 20 | Allergic | Exercise Wellbeing gain halved | ✅ |

*Legend: ✅ = fully hooked in resolution · 🔧 = partially hooked or edge cases · ❌ = flavor text only*

### 1.17 Achievements (15, hidden until end) *(not implemented)*

Hidden during play. Revealed at end ceremony with flat score bonus.

| # | Name | Condition | Bonus |
|---|---|---|---|
| 1 | Dean's List | Academics ≥ 9 at end | +5 |
| 2 | Famous | Social ≥ 9 at end | +5 |
| 3 | Drop-Out Rich | Money ≥ 9 at end | +5 |
| 4 | Zen Master | Wellbeing ≥ 9 at end | +5 |
| 5 | Best Friends Forever | Reach Rel 3 with any player | +3 |
| 6 | Survivor | Wellbeing dipped < 2 then recovered to ≥ 6 | +5 |
| 7 | Broke But Alive | Hit Money 0, finish alive | +3 |
| 8 | Internship Landed | Insider Internship redeemed + Academics ≥ 7 | +4 |
| 9 | Locked In | Never skipped a class | +3 |
| 10 | Networker | Successful Socialize with 4+ different players | +4 |
| 11 | Researcher | Research Lab Invite redeemed + Academics ≥ 8 | +5 |
| 12 | Heartthrob | Reach Rel 2 with 3+ players | +3 |
| 13 | Renaissance Student | All four stats ≥ 6 at end | +6 |
| 14 | Master of One | Any single stat = 10 | +5 |
| 15 | Hustler King | Money = 10 at end | +6 |

### 1.18 Final Score Formula *(not implemented)*

```
Score = (Academics  × wA)
      + (Social     × wS)
      + (Wellbeing  × wW)
      + (Money      × wM)
      + (Best Relationship Level × 2)
      + Σ Achievement Bonuses
```

Eliminated players (Wellbeing 0): final score = 0.

### 1.19 Day Resolution Pipeline

Once all players submit a day:

1. **Validate** each submitted action (slot legal, work-vs-class, money sufficient, target exists, etc.)
2. **Resolve mutual-confirm** matches for Socialize / Study Together / Date Night
3. **Roll outcome tiers** per action using current Wellbeing
4. **Apply modifiers in order:** outcome × relationship × event × trait × repetition penalty → **round to nearest 0.25** → apply
5. **Apply paid Socialize money cost** (cost is paid even on mismatch / Bad)
6. **Apply daily decay** (−0.5 to all stats)
7. **No-sleep penalty:** if Night ≠ Sleep, Wellbeing −1.5 extra *(design: −0.75; code: −0.5)*
8. **Broke penalty:** if Money clamped to 0, additional Wellbeing −1.5 *(not yet implemented)*
9. **Check elimination** (Wellbeing ≤ 0 → out, score locked at 0)
10. **End-of-week checks:** homework quota → Academics penalty *(not yet implemented)*
11. **Exam check:** end of Wk2 → Midterm; end of Wk3 → Final
12. **Pick 5 highlights** from the day's eligible events
13. **Broadcast resolution animation** to all players

> **Current implementation:** Server-authoritative via `day-resolution.ts`. Steps 8, 10 not yet hooked. Step 3 uses hash-based deterministic rolls, not true RNG.

### 1.21 Flavor Text Pool *(not implemented)*

End of each day, the server picks **5 highlights** from the day's notable events. **Only Bad and Good outcomes are eligible for highlights** — Normal outcomes are silent.

Each entry in the pool has **3–6 hand-written variants** with `{name}`, `{target}`, `{location}` placeholders.

> **Current implementation:** `generateDailyHighlights()` uses a tiny hardcoded pool (~10 lines). Design target is ~300 lines.

---

## Part 2 — Web Design

### 2.1 Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI primitives | Custom components |
| Realtime + DB | Supabase (Postgres + Realtime channels) — polling only for now |
| Hosting | Vercel (frontend) + Supabase (DB) |
| Auth | None — name + 4-letter room code, identity persisted in `localStorage` |

Project lives at `/web` inside this repo.

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

### 2.3 Screens

| # | Route | Status | Description |
|---|---|---|---|
| 1 | `/` | ✅ **Built** | Home — Create / Join |
| 2 | `/room/[code]` (lobby) | ✅ **Built** | Lobby — players gather, copy code, host starts game |
| 3 | `/room/[code]` (setup) | ✅ **Built** | Character setup — server-rolled major+traits, distribute 3 stat points |
| 4 | `/room/[code]` (day) | ✅ **Built** | Day View — fill 3 slots, inspect sidebar, submit the day |
| 5 | `/room/[code]` (resolution) | ✅ **Built** | Day Resolution — per-slot roulette, wildcard flip, stat animation, warnings card |
| 6 | `/room/[code]` (exam) | ✅ **Built** | Exam screen — Midterm / Final reveal, vertical ranked list |
| 7 | `/room/[code]` (end) | ⏳ **Not built** | End reveal — achievements, scores, narrative phase |
| 8 | Spectator view | ✅ **Built** | Eliminated players see passive roster / resolution grid / exam cards |
| — | play sidebar | ✅ **Built** | Character info, stats, calendar, warnings, relationships (mock data) |

### 2.4 Built So Far

**`/` (Home)** — `app/page.tsx`
- Title with subtle wobble animation
- Create Game / Join Game cards
- Identity persisted to `localStorage`

**`/room/[code]` (client room shell)** — `app/room/[code]/page.tsx`
- Server-backed phase state: `lobby` → `setup` → `day` → `resolution` → `exam` → `end`
- 3-second polling for room sync
- Lobby: giant monospace room code, player roster, host controls
- Player identity via `localStorage` (`cls.playerId`, `cls.name`)

**Character Setup** — `app/room/[code]/CharacterSetup.tsx`
- Three roulette cards reveal Major, Positive Trait, Negative Trait
- Server owns the roll via `setup-roll.ts` (no client-side randomization)
- "Final Score Multipliers" label on major. "Trait Effect" labels on traits.
- Players distribute exactly 3 stat points

**Day View** — `app/room/[code]/DayView.tsx` + `ActionPicker.tsx`
- Left sidebar: character summary, current stats, calendar, warning tags, preview disclaimer
- Main area: slot cards, action picker modal with target selection + spend tiers
- Stat preview quantizes to 0.25 increments
- Warnings shown as red emoji boxes (Anxiety, Depression, Starvation, Drowsy)
- Other players' stats shown as buckets (Empty / Low / Average / High) not exact numbers
- Other players' traits are hidden

**Resolution Screen** — `app/room/[code]/ResolutionView.tsx`
- Sequential fade-in: morning → afternoon → night action cards + roulette
- Result badge (Bad / Normal / Good) with color-coded multipliers
- 3D wildcard card flip
- Animated stat bars with warning emojis
- **Warnings card:** red emoji boxes for warned stats + Drowsy, with wellbeing penalty
- Auto-fill warning banner when actions were randomized
- "Next Day" button

**Exam Screen** — `app/room/[code]/ExamView.tsx`
- Hero card for your result, vertical ranked list for full class
- Animated card reveals (runs once only)
- Dynamic wellbeing change display

**Spectator View** — `app/room/[code]/SpectatorView.tsx`
- Day phase: static roster + standings
- Resolution phase: grid of all players' slot results
- Exam phase: ranked exam cards
- No polling during day phase; updates on phase change

### 2.5 Identity & Room Codes

- Room code: 4 letters from `ABCDEFGHJKLMNPQRSTUVWXYZ` (skip I, O)
- No accounts. Identity = `(roomCode, playerId, name)` stored in `localStorage`
- Refresh-safe
- Player count cap: 12

### 2.6 State Model

**Server-authoritative flow (current):**

```
Client → POST action → Server validates → Server resolves day →
Client polls every 3s → Receives updated room state
```

- Public state (room roster, current day, phase, public events) returned via GET `/api/room/[code]`
- Private state (your traits, your action plans, your resolution) included in same response
- Day actions stored in `day_actions` table
- Resolutions stored in `resolutions` table
- Player stats updated in `players` table after each day

### 2.7 Database Schema (implemented)

```
rooms        (code PK, status, host_id, current_day, current_phase, created_at)
players      (id PK, room_code FK, name, major, pos_trait, neg_trait,
              academics, social, wellbeing, money,
              class_schedule jsonb, eliminated bool, created_at)
day_actions  (room_code, day, slot, player_id, action, target_id, money_spent, outcome_tier)
resolutions  (room_code, day, player_id, old_stats, new_stats, changes, highlights, autoFilled)
```

Unused tables: `relationships`, `events`

### 2.8 Realtime Channels *(planned)*

- `room:{code}` — public state changes (player joined, day started, day resolved)
- `player:{playerId}` — private state changes (traits revealed, event code received)

> **Current:** 3-second HTTP polling only.

### 2.9 Day Resolution Animation

- Cherry-picks ~5 events from across all players' resolved actions
- Eligible: Bad rolls, Good rolls, mismatches, Wildcard pulls, eliminations
- Sequential reveal with lightweight motion

> **Current:** `generateDailyHighlights()` uses a tiny hardcoded pool. Target is 200+ lines.

### 2.10 Side Panel

Current day view sidebar shows:
- Current stats with bars + warning emojis
- Day / week indicator
- Character identity (major, traits) with clickable info popups
- Weekly class and study progress trackers
- Warning tags when stats are critical or no rest/sleep selected
- Preview disclaimer

### 2.11 Frontend Gaps (Delta from Design)

| System | Design Intent | Current State |
|---|---|---|
| **Outcome randomness** | Wellbeing-scaled odds, true random per-action | Hash-based deterministic; backend person will switch to RNG |
| **Trait effects** | 25 positive + 20 negative traits with mechanical impact | ~13 hooked, rest flavor-only |
| **Relationship system** | Per-pair hidden 0–3 levels with multipliers | Mocked in sidebar; no real tracking |
| **Study Together** | Targetable mutual-confirm action | Missing entirely |
| **Mutual-confirm actions** | Both players must pick each other in same slot | Socialize ditched penalty works; no relationship gain |
| **Same-day repetition penalty** | 2nd use ×0.5, 3rd ×0.25 | ✅ Implemented |
| **No-sleep penalty** | Night ≠ Sleep → Wellbeing −1.5 | ✅ Implemented |
| **Broke penalty** | Money clamps at 0 → Wellbeing −1.5 | ❌ Not implemented |
| **Homework quota** | 4 Studies/week or Academics penalty | ❌ Not implemented |
| **Exams** | Midterm (Wk2) and Final (Wk3) with rolls | ✅ Built but uses threshold scoring, not wellbeing-roll |
| **Achievements + final score** | 15 hidden achievements, weighted scoring | ❌ No end-of-game screen |
| **Public events** | 20-event deck, 10 sampled per session | ❌ One mock banner only |
| **Private events** | 20-event deck, dealt as codes | ❌ 6 hardcoded flip cards only |
| **Wildcard deck** | 21 cards with defined distribution | ❌ Pulls from 6 private events |
| **Flavor text / highlights** | ~300 lines, 5 highlights per day | ❌ Tiny hardcoded pool |
| **Day-to-day persistence** | Stats carry over; history accumulates | ✅ Server-persisted |
| **Calendar / class visualization** | Visual schedule showing class days | ✅ Present |
| **Elimination** | Wellbeing ≤ 0 → out | ✅ Implemented |
| **Major scoring weights** | wA/wS/wW/wM multipliers at endgame | ❌ Not used |
| **Money labels** | Displayed as `$25 / $50` spend tiers | ❌ Shows raw 0–10 numbers |
| **Day counter** | "Day X of 21" with week indicators | ✅ Shows week + day name |
| **Spectator mode** | Eliminated players watch passively | ✅ Built |
| **Tutorial / onboarding** | First-time overlay | ❌ No tutorial |

### 2.12 Out of Scope for v1

- Mobile-first layout (laptop-primary; mobile is best-effort)
- Sound effects / music
- Public room browser
- Replay / save game
- Profanity filter on names
- Animation polish beyond the basics

---

## Part 3 — Build Status

| Task | Status |
|---|---|
| Design doc (this file) | ✅ |
| Logic spec — core loop | ✅ |
| Logic spec — wildcards/events/majors/traits | ⏳ rebalance pending |
| Next.js project scaffolded | ✅ |
| Home screen built | ✅ |
| Dev server running on `localhost:3000` | ✅ |
| Room route shell | ✅ |
| Lobby screen | ✅ |
| Character setup | ✅ |
| Day view | ✅ |
| Day resolution | ✅ |
| Exam screen | ✅ |
| End reveal | ⏳ |
| Side panel | ✅ |
| Supabase backend wired | ✅ |
| Server-authoritative resolution | ✅ |
| Auto-fill on timeout | ✅ |
| Spectator mode | ✅ |
| 200+ flavor lines written | ⏳ |
| Vercel deployment | ⏳ |

## Part 4 — How to Run

```bash
cd web
npm run dev
# open http://localhost:3000
```

To stop: kill the running `next dev` process.
