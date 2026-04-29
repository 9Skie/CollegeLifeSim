# Repository Notes

## Structure
- This repo is a plain static browser app. There is no package manifest, lockfile, CI workflow, lint config, or typecheck config in the root.
- `index.html` is the only page entrypoint and owns the DOM IDs that `game.js` binds to.
- `game.js` contains nearly all app logic: simulation engine, UI rendering, export helpers, button handlers, and test/debug globals. It calls `runSingle()` on load, so loading the script immediately runs a semester.
- `styles.css` is the only stylesheet.
- `tests/game-ui.test.js` is the only automated test file. It uses `node:test` plus a VM DOM stub and reads `game.js` with `fs.readFileSync("game.js", "utf8")`, so run tests from the repo root.

## Commands
- Full verification: `node --test tests/game-ui.test.js`
- Single test by name: `node --test --test-name-pattern="copy json falls back" tests/game-ui.test.js`

## Editing Gotchas
- Keep `index.html`, `game.js`, and `tests/game-ui.test.js` in sync when changing UI element IDs, default inputs, or button behavior. The test harness stubs the same IDs and clicks the real listeners.
- Preserve and extend `window.__collegeLifeSim` and `window.render_game_to_text` when adding test coverage or debug hooks. The existing tests rely on those surfaces instead of imports.
- If you change `game.js` or `styles.css`, also update the cache-busting `?v=...` query strings in `index.html`; otherwise manual browser checks can look stale.

## Docs
- `docs/superpowers/specs/` and `docs/superpowers/plans/` contain design and implementation history. Use them for intent, but trust `game.js` and `tests/game-ui.test.js` if they diverge.
