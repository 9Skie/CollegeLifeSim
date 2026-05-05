# College Life Sim — What's Missing / TODO

> Last updated: 2026-05-05

---

## 🔴 CRITICAL — Game Balance / Backend Truth

---

## 🟡 MULTIPLAYER / SYNC

- [ ] **No real-time** — 3-second polling only. Design planned Supabase Realtime channels.
- [ ] **Race condition on day resolution** — Last-submission trigger has no transaction lock. Double-resolve possible.
- [ ] **Host-only phase control** — If host leaves, the room is stuck. No host migration.

---

## 🟢 UI / POLISH — Frontend

- [ ] **Exam mechanics wrong** — Design uses outcome roll with Effective Exam Wellbeing = (Academics + Wellbeing) / 2. Code uses simple threshold scoring with no roll.
- [ ] **Daily highlights are placeholder** — `extractInterestingEvents` picks real events but all text is simple templates (e.g. "X had a great study session"). No rich flavor-text generator or design's ~300-line pool.
- [ ] **End-of-game screen** — `"end"` phase has no UI.

---

## 🔵 DATA MODEL

| Table | Status |
|-------|--------|
| `relationships` | ✅ Queried and updated by backend; frontend displays real levels + progress |
| `wildcard_decks` | ✅ Backend draws real cards; frontend renders actual title/description/effects |
| `events` | Never used — events are client-side hardcoded arrays |
| `resolutions.highlights` | `extractInterestingEvents` parses resolution data but generates simple template text from a pool of 20 messages |

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
