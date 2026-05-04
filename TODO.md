# College Life Sim — What's Missing / TODO

> Last updated: 2026-05-04

---

## 🔴 CRITICAL — Game Balance / Backend Truth

---

## 🟠 MAJOR SYSTEMS — Stubbed or Missing

### Traits (~20 of 25 have code hooks; rest are flavor-only)
- [ ] **Resilient** — "First time Wellbeing hits 0, set to 1 instead" (no elimination-save hook)
- [ ] **Connected** — "Start with 1 free event code" (no code-dealing system)
- [ ] **Loose Lips** — "Codes auto-leak" (no code-dealing system)
- [ ] **Forgetful** — "1 class per week auto-skipped" (no auto-skip logic)
- [ ] **Burnout-Prone** — "Studying 2 days in a row → Wellbeing −1" (no consecutive-day tracking)
- [ ] **Influencer** — "At Social ≥ 7, gain +0.25 Social passive each day" (no daily passive hook)
- [ ] **Optimist** — "Wellbeing decay −0.25 instead of −0.75" (hardcoded decay; no trait hook)
- [ ] **Self Care** — "Rest and Sleep give +0.25 extra Wellbeing" (hardcoded rest/sleep values)
- [ ] **Professor's Favorite** — "Class gives +0.25 extra Social" (hardcoded class values)
- [ ] **Coupon Clipper** — "Free Socialize uses Coffee-tier effect" (no tier-swap logic)

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

---

## 🔵 DATA MODEL

| Table | Status |
|-------|--------|
| `relationships` | ✅ Queried and updated by backend; frontend displays real levels + progress |
| `wildcard_decks` | ✅ Backend draws real cards; frontend renders actual title/description/effects |
| `events` | Never used — events are client-side hardcoded arrays |
| `resolutions.highlights` | Only populated with generic fallback text |

---

## ✅ RECENTLY FIXED (this session)

- [x] Relationships — fully wired to real backend data with level/progress tracking
- [x] Relationship popup on player card click shows tier progress (0/1, 0/2, 0/3)
- [x] Wildcard ResolutionView renders real drawn card (title, emoji, description, effectSummary)
- [x] Wildcard/event initialization self-resilient to missing DB tables
- [x] Relationship bonus shown in DayView slot preview and ActionPicker target buttons
- [x] localStorage cleanup on Leave Room, browser close, and game end
- [x] Drowsy warning counts as real warning (−1.5 Wellbeing like others)
- [x] Skip-class frontend warning removed (backend handles weekly penalty)
- [x] End-of-week penalty text unbolded
- [x] Preview disclaimer removed

## ✅ RECENTLY FIXED (prior sessions)

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
