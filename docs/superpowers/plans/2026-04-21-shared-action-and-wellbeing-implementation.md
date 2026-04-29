# Shared Action And Wellbeing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace blind shared-action matching with invite acceptance, simplify outcomes to bad/normal/good, and make wellbeing linearly drive probabilities and effect size.

**Architecture:** Keep the simulation in `game.js`, but split slot resolution into planning and lock-in phases. Add focused tests in `tests/game-ui.test.js` by exposing the small engine helpers needed for deterministic assertions in the existing VM harness.

**Tech Stack:** Plain browser JavaScript, Node test runner, VM-based UI harness

---

### Task 1: Add Failing Engine Regression Tests

**Files:**
- Modify: `tests/game-ui.test.js`
- Test: `tests/game-ui.test.js`

- [ ] **Step 1: Write the failing tests**

```js
test("wellbeing helpers use linear interpolation anchors", () => {
  const { context } = loadApp();

  assert.deepEqual(context.window.__COLLEGE_LIFE_SIM__.getOutcomeWeights(0), { bad: 0.25, normal: 0.75, good: 0 });
  assert.deepEqual(context.window.__COLLEGE_LIFE_SIM__.getOutcomeWeights(5), { bad: 0.125, normal: 0.75, good: 0.125 });
  assert.deepEqual(context.window.__COLLEGE_LIFE_SIM__.getOutcomeWeights(10), { bad: 0, normal: 0.75, good: 0.25 });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/game-ui.test.js`
Expected: FAIL because `__COLLEGE_LIFE_SIM__` and helper coverage do not exist yet

- [ ] **Step 3: Extend the test file with invite-resolution and failed-shared-action assertions**

```js
test("shared invite resolution accepts only the best incoming invite", () => {
  // build a tiny state, call exposed planning helper, assert one locked pair
});

test("failed study together resolves at a flat 25 percent deduction", () => {
  // compare failed shared study delta against normal solo study delta
});
```

- [ ] **Step 4: Re-run the test file and keep it red**

Run: `node --test tests/game-ui.test.js`
Expected: FAIL on the newly-added assertions

### Task 2: Implement Shared Invite Locking And Three-Band Outcomes

**Files:**
- Modify: `game.js`
- Test: `tests/game-ui.test.js`

- [ ] **Step 1: Add wellbeing interpolation helpers and expose them for tests**

```js
function getOutcomeWeights(wellbeing) {
  const ratio = clamp(wellbeing / 10, 0, 1);
  return { bad: 0.25 * (1 - ratio), normal: 0.75, good: 0.25 * ratio };
}
```

- [ ] **Step 2: Replace four-tier sampling and labels with bad/normal/good**

```js
const OUTCOME_BANDS = ["Bad", "Normal", "Good"];
```

- [ ] **Step 3: Rework slot planning into invite, accept, and lock phases**

```js
function planSlotActions(state, slot, dayIndex, weekIndex) {
  // choose best solo per player
  // choose at most one outgoing invite
  // accept best incoming invite per player
  // return locked pairs plus solo actions
}
```

- [ ] **Step 4: Replace failed shared-action resolution with a flat 25 percent deduction**

```js
const FAILED_SHARED_MULTIPLIER = 0.75;
```

- [ ] **Step 5: Clamp stats to zero and initialize wellbeing to five**

```js
wellbeing: 5
```

- [ ] **Step 6: Expose minimal helpers for deterministic tests**

```js
window.__COLLEGE_LIFE_SIM__ = { getOutcomeWeights, getOutcomeMultipliers, resolveSharedInvites };
```

### Task 3: Verify

**Files:**
- Test: `tests/game-ui.test.js`

- [ ] **Step 1: Run the focused regression suite**

Run: `node --test tests/game-ui.test.js`
Expected: PASS

- [ ] **Step 2: Review the output for the specific new assertions**

Expected:
- shared invite tests pass
- wellbeing interpolation tests pass
- existing export/copy tests remain green
