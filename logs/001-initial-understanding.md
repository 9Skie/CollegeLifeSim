# Log 001 — Initial Understanding

## What this is
A browser-based **College Life Simulator** — a single-player simulation prototype (future party game). Players get a semester of stat management (GPA/Expertise/Social/Wellbeing/Wallet) across 4 weeks with daily Morning/Afternoon/Night slots. Actions resolve simultaneously with shared-action invites. Tests pass clean.

## What's working
- Core simulation engine (`game.js`, ~2287 lines): semester lifecycle, stat decay, action tables (study, class, work, exercise, socialize), outcome tiers (bad/normal/good), shared invite resolution, exams (midterm/final), batch runs
- Full UI: controls panel, summary cards, standings, relationship table, batch diagnostics, player timelines, export (JSON/CSV), semester log
- Export: structured JSON + CSV downloads, copy-to-clipboard
- Debug hooks: `window.__collegeLifeSim` exposes internal helpers, `window.render_game_to_text()` for rendering
- Test suite: 11 tests in `tests/game-ui.test.js` using `node:test` + VM DOM stub — all pass
- Docs: `DESIGN.md` (777 lines) describes full game design, `BALANCE_ANALYSIS.md` for economy tuning

## What's 3-week multiplayer party game (design intent)
The `DESIGN.md` describes a 3-week **multiplayer party game** (Jackbox-style) with:
- 3–12 players, each on their own laptop, same room
- 4 stats (Academics, Social, Wellbeing, Money) on a 0–10 scale
- Hidden simultaneous day planning, traits, events
- 63 actions per player (3 weeks × 7 days × 3 slots)
- Relationship system (per-pair hidden, 0–3 levels)
- Character creation with 3 free points

But the **current prototype** (`game.js`) is a single-player batch sim — all decisions are AI-driven, no real-time multiplayer, no room/lobby code, no per-player input system. The web prototype in `web/` and `supabase/` directories may be partial multiplayer scaffolding.

## What needs development
- **Multiplayer infrastructure**: room creation, lobby, WebSocket/polling sync, player join flow
- **Player input system**: replace AI planning with real UI for choosing actions each slot
- **Hidden trait/event system**: described in DESIGN.md but missing from `game.js`
- **Relationship UI**: hidden values per pair, need a reveal mechanism
- **Number grid enforcement**: all deltas must be multiples of 0.25 (currently raw floats in `game.js`)
- **Styling polish**: `styles.css` is minimal, no responsive/mobile layout yet
- **Full 3-week calendar**: current sim runs 4 weeks (midterm + final), DESIGN says 3 weeks
- **Elimination mechanic**: Wellbeing 0 → eliminated (final score 0), not fully wired
- **Tests need coverage for**: batch runs, CSV export, elimination edge cases, timeline rendering
