# College Life Sim — What's Missing / TODO

> Last updated: 2026-04-28

---

## 🔴 CRITICAL — Game Balance is Wrong


- [ ] **No true randomness** — everything is hash-based deterministic. Outcome rolls, events, class schedules, dummy actions all use `hashString()`. Design calls for actual RNG.

- [ ] **Broke penalty missing** — Design says Money clamped at 0 → extra Wellbeing −1.5. Code clamps but never applies the penalty.

- [ ] **Homework quota tracker is UI-only** — 4 Studies/week goal is shown but the end-of-week penalty is never applied in resolution.

---

## 🟠 MAJOR SYSTEMS — Stubbed or Missing

### Traits (44 defined, ~half do nothing)
- [ ] **Resilient** — "First time Wellbeing hits 0, set to 1" (no code)
- [ ] **Connected** — "Start with 1 free event code" (no code-dealing system)
- [ ] **Loose Lips** — "Codes auto-leak" (no code-dealing system)
- [ ] **Hot-Headed** — "Mismatched actions cost relationship progress" (no relationship progress)
- [ ] **Heartbreaker** — "Cannot reach Relationship Lvl 3" (no relationship levels)
- [ ] **Forgetful** — "1 class per week auto-skipped" (no auto-skip logic)
- [ ] **Phone Addict** — "Wildcard never pulls positive" (no wildcard deck)
- [ ] **Burnout-Prone** — "Studying 2 days in a row → Wellbeing −1" (no consecutive-day tracking)
- [ ] Many others have flavor text but no resolution hook.

### Relationships
- [ ] **Completely mocked** — `DayView.tsx` generates fake `relationships` from `hashString(name + roomCode) % 4`. No `relationships` table is ever queried or updated.
- [ ] **Mutual-confirm bonuses** — Design says shared actions get relationship-level multipliers. Code only has "ditched" penalty, no positive scaling.

### Study Together
- [ ] **Missing entirely** — Design defines a targetable "Study Together" action (Academics +0.75, Social +0.5, requires mutual confirm). Only solo "study" exists.

### Wildcard Deck
- [ ] **21-card deck not implemented** — Design specifies 6 big-pos / 6 small-pos / 3 neutral / 3 small-neg / 3 big-neg. Code pulls from 6 hardcoded private events.
- [ ] **Code input does nothing** — `ActionPicker` lets you type a code, but `day-resolution.ts` ignores `selection.code`. No validation, no redemption.

### Public Events
- [ ] **Decorative only** — 10 hardcoded events show in banners but their modifiers are never applied in resolution. `day-resolution.ts` doesn't read public events at all.

### Private Events
- [ ] **Only 6 hardcoded** — Design calls for 20 with prerequisite checks and one-hop sharing. Codes are never dealt to players.

### Achievements & Endgame
- [ ] **Completely missing** — Design has 15 hidden achievements and major-weighted final scoring. No tracking, no end screen. `"end"` phase exists in types but has no render branch.

---

## 🟡 MULTIPLAYER / SYNC

- [ ] **No real-time** — 3-second polling only. Design planned Supabase Realtime channels.
- [ ] **Leave room doesn't notify server** — `// TODO: broadcast leave to server`. Players remain in DB forever.
- [ ] **Race condition on day resolution** — Last-submission trigger has no transaction lock. Double-resolve possible.
- [ ] **Host-only phase control** — If host leaves, the room is stuck. No host migration.
- [ ] **Dummy players inject fake data into real games** — `dummyPlayers.ts` auto-submits if names match. Should be debug-only or removed.

---

## 🟢 UI / POLISH

- [ ] **Day preview doesn't match server** — `DayView.tsx`'s `calculateDayGains` re-implements math client-side. It ignores traits, public events, relationships, outcome multipliers, and warning penalties. Players see wrong projections.
- [ ] **60-second timer is cosmetic** — Counts down but does nothing at 0. No auto-submit.
- [ ] **Exam day hardcoded to wrong days** — Design: Day 14 (Week 2 Friday) and Day 21 (Week 3 Friday). Code: Day 12 and Day 19.
- [ ] **Exam mechanics wrong** — Design uses outcome roll with Effective Exam Wellbeing = (Academics + Wellbeing) / 2. Code uses simple threshold scoring with no roll.
- [ ] **ExamView wellbeing change is hardcoded** — Shows `+1.00` in UI regardless of actual `wellbeingChange`.
- [ ] **Player stat popups show mock data** — When real stats missing, generates fake numbers from `name.charCodeAt()`.
- [ ] **Daily highlights are placeholder** — `generateDailyHighlights()` uses a tiny hardcoded pool. Design's ~300-line flavor pool doesn't exist.
- [ ] **Spectator mode for eliminated players** — They see "You're Out" but the full UI still renders. Should be a passive watch view.
- [ ] **End-of-game screen** — `"end"` phase has no UI.

---

## 🔵 DATA MODEL (Tables exist in schema but unused)

| Table | Status |
|-------|--------|
| `relationships` | Never queried or updated |
| `events` | Never used — events are client-side hardcoded arrays |
| `resolutions.highlights` | Only populated with generic fallback text |

---

## ✅ RECENTLY FIXED

- [x] Work available at night
- [x] Critical wellbeing warning no longer snowballs penalty
- [x] Outcome/repeat multipliers no longer affect money costs
- [x] Dinner → Food rename in socialize tiers
- [x] Debug build button on home page
- [x] Exam day system (midterm + finals)
- [x] Ditched penalty for unreciprocated socialize
- [x] Repetition decay display in ResolutionView
