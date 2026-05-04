# College Life Sim — What's Missing / TODO

> Last updated: 2026-05-02

---

## 🔴 CRITICAL — Game Balance / Backend Truth

---

## 🟠 MAJOR SYSTEMS — Stubbed or Missing

### Traits (~20 of 25 have code hooks; rest are flavor-only)
- [ ] **Resilient** — "First time Wellbeing hits 0, set to 1 instead" (no elimination-save hook)
- [ ] **Connected** — "Start with 1 free event code" (no code-dealing system)
- [ ] **Loose Lips** — "Codes auto-leak" (no code-dealing system)
- [ ] **Hot-Headed** — "Mismatched actions cost relationship progress" (no relationship progress system)
- [ ] **Heartbreaker** — "Cannot reach Relationship Lvl 3" (no relationship levels)
- [ ] **Forgetful** — "1 class per week auto-skipped" (no auto-skip logic)
- [ ] **Phone Addict** — "Wildcard never pulls positive" (no wildcard deck)
- [ ] **Burnout-Prone** — "Studying 2 days in a row → Wellbeing −1" (no consecutive-day tracking)
- [ ] **Influencer** — "At Social ≥ 7, gain +0.25 Social passive each day" (no daily passive hook)
- [ ] **Optimist** — "Wellbeing decay −0.25 instead of −0.75" (hardcoded decay; no trait hook)
- [ ] **Self Care** — "Rest and Sleep give +0.25 extra Wellbeing" (hardcoded rest/sleep values)
- [ ] **Professor's Favorite** — "Class gives +0.25 extra Social" (hardcoded class values)
- [ ] **Coupon Clipper** — "Free Socialize uses Coffee-tier effect" (no tier-swap logic)

### Relationships
- [ ] **Completely mocked** — `DayView.tsx` generates fake `relationships` from `hashString(name + roomCode) % 4`. No `relationships` table is ever queried or updated.
- [ ] **Mutual-confirm bonuses** — Design says shared actions get relationship-level multipliers. Code only has "ditched" penalty, no positive scaling.

### Study Together
- [ ] **Not planned** — keeping only solo `study`; `Study Together` is not being implemented.

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

## 🟢 UI / POLISH — Frontend

- [ ] **Exam mechanics wrong** — Design uses outcome roll with Effective Exam Wellbeing = (Academics + Wellbeing) / 2. Code uses simple threshold scoring with no roll.
- [ ] **Daily highlights are placeholder** — `generateDailyHighlights()` uses a tiny hardcoded pool. Design's ~300-line flavor pool doesn't exist.
- [ ] **End-of-game screen** — `"end"` phase has no UI.
- [ ] **Calendar does not highlight class days** — Visual schedule exists but class days aren't marked.

### ✅ UI — Recently Fixed
- [x] Day preview disclaimer added ("Preview only — actual results depend on traits, events, wildcard rolls, and outcome multipliers")
- [x] ExamView wellbeing change is dynamic (was hardcoded `+1.00`)
- [x] Player stat popups use real server data (removed `mockStats` fallback)
- [x] Spectator mode built and wired (`SpectatorView` + polling logic)
- [x] Score multiplier labels in CharacterSetup and DayView info popups
- [x] Other players see stat buckets instead of exact scores
- [x] Trait compatibility rules expanded (20+ incompatible pairs)
- [x] ResolutionView warnings card with emoji boxes
- [x] Discrete bar widths for other players' stat buckets
- [x] "Goner" → "Spectator" label everywhere
- [x] Auto-fill warning banner in ResolutionView
- [x] ExamView animation runs once only; vertical list layout
- [x] Server RNG for day outcome rolls and timeout auto-fill actions

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
- [x] Server-side setup rolls (major, traits, class schedule assigned by backend)
- [x] Auto-fill on timeout — missing day actions auto-generated, flagged with `autoFilled`
- [x] Homework quota penalty — weekly Academics penalty now applied on missed study quota
- [x] Weekly missed-class penalty replaces per-slot skip penalty
- [x] Spectator mode for eliminated players
- [x] Score multiplier / trait effect labels in setup + day view
- [x] Other players' stats shown as buckets (Empty/Low/Average/High) not exact numbers
- [x] Trait compatibility rules prevent illogical pairings
- [x] ResolutionView warnings card (stat warnings + drowsy + wellbeing penalty)
- [x] DayView warnings with emoji tags + preview quantize to 0.25
- [x] ExamView animation deduped; vertical list instead of grid
