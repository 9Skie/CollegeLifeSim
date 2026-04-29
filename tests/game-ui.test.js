const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createElement(tagName, options = {}) {
  const listeners = new Map();
  return {
    tagName: tagName.toUpperCase(),
    value: options.value ?? "",
    textContent: "",
    innerHTML: "",
    style: {},
    href: "",
    download: "",
    focused: false,
    selected: false,
    classList: {
      add() {},
      remove() {},
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    click() {
      if (options.throwOnClick) {
        throw new Error("blocked click");
      }
      const listener = listeners.get("click");
      if (listener) {
        listener({ preventDefault() {} });
      }
    },
    focus() {
      this.focused = true;
    },
    select() {
      this.selected = true;
    },
  };
}

function loadApp(overrides = {}) {
  const elements = new Map();
  const defaults = {
    "seed-input": "41021",
    "players-input": "6",
    "batch-input": "250",
  };

  const document = {
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, createElement("div", { value: defaults[id] ?? "" }));
      }
      return elements.get(id);
    },
    createElement(tagName) {
      return createElement(tagName, overrides.createdElementOptions ?? {});
    },
    execCommand(command) {
      if (command === "copy") {
        return overrides.execCopyResult ?? false;
      }
      return false;
    },
  };

  const context = {
    console,
    document,
    navigator: overrides.navigator ?? {},
    Blob: function Blob(parts, options) {
      this.parts = parts;
      this.options = options;
    },
    URL: {
      createObjectURL() {
        return "blob:mock";
      },
      revokeObjectURL() {},
    },
    setTimeout,
    clearTimeout,
  };

  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("game.js", "utf8"), context);

  return { context, elements };
}

function normalizeVmValue(value) {
  return JSON.parse(JSON.stringify(value));
}

test("simulate semester respects a 10-player UI input and updates the export payload", () => {
  const { elements } = loadApp();

  elements.get("players-input").value = "10";
  elements.get("simulate-once-btn").click();

  const exportPayload = JSON.parse(elements.get("json-export-output").value);
  const renderSummary = JSON.parse(elements.get("log-output").textContent.startsWith("Seed") ? JSON.stringify({
    log: elements.get("log-output").textContent,
  }) : "{}");

  assert.equal(exportPayload.playerCount, 10);
  assert.match(renderSummary.log, /Seed 41021\. 10 players entered the semester\./);
});

test("run batch refreshes the visible semester export to match the current inputs", () => {
  const { elements } = loadApp();

  elements.get("seed-input").value = "55555";
  elements.get("players-input").value = "10";
  elements.get("simulate-batch-btn").click();

  const exportPayload = JSON.parse(elements.get("json-export-output").value);

  assert.equal(exportPayload.seed, 55555);
  assert.equal(exportPayload.playerCount, 10);
  assert.match(elements.get("summary-subtitle").textContent, /Seed 55555 · 10 players/);
});

test("copy json falls back to selecting the export textarea when clipboard APIs are unavailable", async () => {
  const { elements } = loadApp({ execCopyResult: true });

  elements.get("copy-json-btn").click();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(elements.get("json-export-output").focused, true);
  assert.equal(elements.get("json-export-output").selected, true);
  assert.equal(elements.get("copy-json-btn").textContent, "Copied JSON");
});

test("wellbeing helpers use the new linear interpolation anchors", () => {
  const { context } = loadApp();
  const sim = context.window.__collegeLifeSim;

  assert.deepEqual(normalizeVmValue(sim.getOutcomeWeights(0)), { bad: 0.25, normal: 0.75, good: 0 });
  assert.deepEqual(normalizeVmValue(sim.getOutcomeWeights(5)), { bad: 0.125, normal: 0.75, good: 0.125 });
  assert.deepEqual(normalizeVmValue(sim.getOutcomeWeights(10)), { bad: 0, normal: 0.75, good: 0.25 });

  assert.deepEqual(normalizeVmValue(sim.getOutcomeMultipliers(0)), { bad: 2, normal: 1, good: 0.5 });
  assert.deepEqual(normalizeVmValue(sim.getOutcomeMultipliers(5)), { bad: 1.25, normal: 1, good: 1.25 });
  assert.deepEqual(normalizeVmValue(sim.getOutcomeMultipliers(10)), { bad: 0.5, normal: 1, good: 2 });
});

test("shared invite resolution accepts only the best incoming invite per player", () => {
  const { context } = loadApp();
  const sim = context.window.__collegeLifeSim;

  const resolution = sim.resolveSharedInvites([
    {
      playerId: 0,
      soloAction: { type: "Sleep" },
      soloScore: 0.4,
      outgoingInvite: { type: "StudyTogether", targetId: 1, senderScore: 0.8, receiverScore: 0.75 },
    },
    {
      playerId: 1,
      soloAction: { type: "Study" },
      soloScore: 0.65,
      outgoingInvite: null,
    },
    {
      playerId: 2,
      soloAction: { type: "Sleep" },
      soloScore: 0.35,
      outgoingInvite: { type: "StudyTogether", targetId: 1, senderScore: 0.78, receiverScore: 1.1 },
    },
  ]);

  assert.deepEqual(normalizeVmValue(resolution.lockedPairs), [{ actorA: 2, actorB: 1, type: "StudyTogether" }]);
  assert.equal(resolution.finalPlans.get(1).kind, "incoming");
  assert.equal(resolution.finalPlans.get(1).fromPlayerId, 2);
  assert.equal(resolution.finalPlans.get(0).kind, "failed-shared");
  assert.equal(resolution.finalPlans.get(0).targetId, 1);
});

test("scaled delta helper applies the flat 25 percent failed-shared deduction", () => {
  const { context } = loadApp();
  const sim = context.window.__collegeLifeSim;

  assert.deepEqual(
    normalizeVmValue(sim.scaleDelta({ gpa: 0.01, expertise: 0.4 }, "normal", 5, 0.75)),
    { gpa: 0.0075, expertise: 0.3 },
  );
});

test("semester logs only use bad normal good wording for action and exam outcomes", () => {
  const { elements } = loadApp();

  elements.get("seed-input").value = "55555";
  elements.get("players-input").value = "10";
  elements.get("simulate-once-btn").click();

  const log = elements.get("log-output").textContent.toLowerCase();

  assert.doesNotMatch(log, /\b(strong|weak|flop|partial|stable|solid|excellent|rough|collapse|crash)\b/);
  assert.match(log, /\b(midterm|final)\b/);
});

test("study together is only offered in the week 2 pre-midterm window and hobby is removed", () => {
  const { context } = loadApp();
  const sim = context.window.__collegeLifeSim;

  assert.equal(sim.getAvailableActionsForTest(0, "Morning").includes("StudyTogether"), false);
  assert.equal(sim.getAvailableActionsForTest(2, "Afternoon", 1).includes("StudyTogether"), true);
  assert.equal(sim.getAvailableActionsForTest(2, "Morning", 1).includes("StudyTogether"), false);
  assert.equal(sim.getAvailableActionsForTest(0, "Morning").includes("Hobby"), false);
  assert.equal(sim.getActionTable("Hobby"), undefined);
});

test("exercise is simplified to wellbeing only and exams expose bad normal good outcomes with expertise", () => {
  const { context } = loadApp();
  const sim = context.window.__collegeLifeSim;

  assert.deepEqual(normalizeVmValue(sim.getActionTable("Exercise")), {
    bad: { wellbeing: 0.18 },
    normal: { wellbeing: 0.42 },
    good: { wellbeing: 0.58 },
  });

  assert.deepEqual(normalizeVmValue(sim.getExamBandForTest("midterm", 0)), {
    bad: { chance: 0.68, gpa: -0.34, expertise: 0.02 },
    normal: { chance: 0.26, gpa: -0.1, expertise: 0.06 },
    good: { chance: 0.06, gpa: 0.08, expertise: 0.12 },
  });
});

test("timeline player cards render vertical start and final comparisons without narratives", () => {
  const { elements } = loadApp();

  elements.get("simulate-once-btn").click();

  const timelineMarkup = elements.get("player-timelines").innerHTML;

  assert.match(timelineMarkup, /Initial vs Final Stats/);
  assert.match(timelineMarkup, /bar-vertical-pair/);
  assert.match(timelineMarkup, /Initial allocation and final value/);
  assert.doesNotMatch(timelineMarkup, /timeline-narrative/);
  assert.doesNotMatch(timelineMarkup, /Start vs Final Stats/);
});

test("export and render text no longer include majors and scores are generic", () => {
  const { elements, context } = loadApp();

  elements.get("batch-input").value = "10";
  elements.get("simulate-batch-btn").click();
  elements.get("simulate-once-btn").click();

  const exportPayload = JSON.parse(elements.get("json-export-output").value);
  const renderPayload = JSON.parse(context.window.render_game_to_text());

  assert.equal("major" in exportPayload.winner, false);
  assert.equal("major" in exportPayload.players[0], false);
  assert.equal("major" in renderPayload.winner, false);
  assert.equal("major" in renderPayload.players[0], false);
  assert.equal("majorWins" in renderPayload.batch, false);
});

test("timeline records exams without week-check phases", () => {
  const { elements } = loadApp();

  elements.get("simulate-once-btn").click();

  const exportPayload = JSON.parse(elements.get("json-export-output").value);
  const phases = new Set(exportPayload.timeline.map((entry) => entry.phase));

  assert.equal(phases.has("week-check"), false);
  assert.equal(phases.has("exam"), true);
});
