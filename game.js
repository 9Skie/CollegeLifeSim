const CONFIG = {
  weeks: 4,
  daysPerWeek: 7,
  slots: ["Morning", "Afternoon", "Night"],
  studyQuota: 3,
  classDays: [0, 1, 3, 4],
  maxPlayers: 10,
  relationshipMax: 5,
  relationshipPerLevel: 2,
  sharedFailureMultiplier: 0.75,
  repetitionMultipliers: [1, 0.75, 0.55],
  baseDecay: {
    gpa: 0.04,
    expertise: 0.05,
    social: 0.18,
    wellbeing: 0.32,
    wallet: 10,
  },
  brokeWellbeingDecay: 1.6,
  outcomeBands: ["bad", "normal", "good"],
  tables: {
    study: {
      bad: { gpa: 0.008, expertise: 0.06 },
      normal: { gpa: 0.018, expertise: 0.12 },
      good: { gpa: 0.028, expertise: 0.18 },
    },
    studyTogether: {
      bad: { gpa: 0.014, expertise: 0.1 },
      normal: { gpa: 0.026, expertise: 0.16 },
      good: { gpa: 0.038, expertise: 0.22 },
    },
    class: {
      bad: { gpa: 0.012, social: 0.04 },
      normal: { gpa: 0.025, social: 0.1 },
      good: { gpa: 0.035, social: 0.14 },
    },
    work: {
      bad: { wallet: 24, wellbeing: -0.16 },
      normal: { wallet: 40, wellbeing: -0.08 },
      good: { wallet: 52, wellbeing: -0.03 },
    },
    exercise: {
      bad: { wellbeing: 0.18 },
      normal: { wellbeing: 0.42 },
      good: { wellbeing: 0.58 },
    },
    socialize: {
      day: {
        0: {
          bad: { social: 0.3, wellbeing: -0.14 },
          normal: { social: 0.72, wellbeing: -0.08 },
          good: { social: 0.98, wellbeing: -0.04 },
        },
        10: {
          bad: { social: 0.42, wellbeing: -0.12 },
          normal: { social: 0.9, wellbeing: -0.06 },
          good: { social: 1.16, wellbeing: -0.02 },
        },
        20: {
          bad: { social: 0.5, wellbeing: -0.1 },
          normal: { social: 1.04, wellbeing: -0.04 },
          good: { social: 1.34, wellbeing: -0.01 },
        },
      },
      night: {
        0: {
          bad: { social: 0.45, wellbeing: -0.26 },
          normal: { social: 1.0, wellbeing: -0.14 },
          good: { social: 1.34, wellbeing: -0.03 },
        },
        10: {
          bad: { social: 0.6, wellbeing: -0.18 },
          normal: { social: 1.22, wellbeing: -0.03 },
          good: { social: 1.56, wellbeing: 0.05 },
        },
        20: {
          bad: { social: 0.7, wellbeing: -0.18 },
          normal: { social: 1.38, wellbeing: -0.09 },
          good: { social: 1.72, wellbeing: 0.04 },
        },
      },
    },
  },
  examBands: {
    midterm: [
      {
        max: 1.9,
        outcomes: {
          bad: { chance: 0.68, gpa: -0.34, expertise: 0.02 },
          normal: { chance: 0.26, gpa: -0.1, expertise: 0.06 },
          good: { chance: 0.06, gpa: 0.08, expertise: 0.12 },
        },
      },
      {
        max: 3.9,
        outcomes: {
          bad: { chance: 0.42, gpa: -0.22, expertise: 0.03 },
          normal: { chance: 0.4, gpa: 0.02, expertise: 0.08 },
          good: { chance: 0.18, gpa: 0.14, expertise: 0.14 },
        },
      },
      {
        max: 5.9,
        outcomes: {
          bad: { chance: 0.24, gpa: -0.12, expertise: 0.04 },
          normal: { chance: 0.5, gpa: 0.08, expertise: 0.1 },
          good: { chance: 0.26, gpa: 0.2, expertise: 0.16 },
        },
      },
      {
        max: 7.9,
        outcomes: {
          bad: { chance: 0.16, gpa: -0.08, expertise: 0.05 },
          normal: { chance: 0.5, gpa: 0.1, expertise: 0.11 },
          good: { chance: 0.34, gpa: 0.24, expertise: 0.18 },
        },
      },
      {
        max: 10,
        outcomes: {
          bad: { chance: 0.1, gpa: -0.04, expertise: 0.06 },
          normal: { chance: 0.48, gpa: 0.12, expertise: 0.12 },
          good: { chance: 0.42, gpa: 0.28, expertise: 0.2 },
        },
      },
    ],
    final: [
      {
        max: 1.9,
        outcomes: {
          bad: { chance: 0.74, gpa: -0.72, expertise: 0.03 },
          normal: { chance: 0.21, gpa: -0.26, expertise: 0.08 },
          good: { chance: 0.05, gpa: 0.08, expertise: 0.15 },
        },
      },
      {
        max: 3.9,
        outcomes: {
          bad: { chance: 0.46, gpa: -0.48, expertise: 0.04 },
          normal: { chance: 0.36, gpa: -0.04, expertise: 0.1 },
          good: { chance: 0.18, gpa: 0.22, expertise: 0.17 },
        },
      },
      {
        max: 5.9,
        outcomes: {
          bad: { chance: 0.28, gpa: -0.28, expertise: 0.05 },
          normal: { chance: 0.42, gpa: 0.06, expertise: 0.12 },
          good: { chance: 0.3, gpa: 0.28, expertise: 0.2 },
        },
      },
      {
        max: 7.9,
        outcomes: {
          bad: { chance: 0.18, gpa: -0.18, expertise: 0.06 },
          normal: { chance: 0.44, gpa: 0.1, expertise: 0.13 },
          good: { chance: 0.38, gpa: 0.34, expertise: 0.22 },
        },
      },
      {
        max: 10,
        outcomes: {
          bad: { chance: 0.12, gpa: -0.08, expertise: 0.07 },
          normal: { chance: 0.42, gpa: 0.14, expertise: 0.14 },
          good: { chance: 0.46, gpa: 0.4, expertise: 0.24 },
        },
      },
    ],
  },
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHARED_ACTIONS = new Set(["StudyTogether", "Socialize"]);
const STRATEGIES = [
  { id: "Academic", label: "Academic" },
  { id: "Socialite", label: "Socialite" },
  { id: "Balanced", label: "Balanced" },
  { id: "Hustler", label: "Hustler" },
  { id: "Recovery", label: "Recovery" },
];
const FIRST_NAMES = [
  "Avery",
  "Jordan",
  "Riley",
  "Kai",
  "Morgan",
  "Sage",
  "Drew",
  "Quinn",
  "Noel",
  "Casey",
  "Milan",
  "Jules",
];

class RNG {
  constructor(seed) {
    this.seed = seed >>> 0;
  }

  next() {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  float(min = 0, max = 1) {
    return min + this.next() * (max - min);
  }

  int(min, max) {
    return Math.floor(this.float(min, max + 1));
  }

  pick(items) {
    return items[this.int(0, items.length - 1)];
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function formatMoney(value) {
  return `$${Math.round(value)}`;
}

function createPairKey(a, b) {
  return [a, b].sort((left, right) => left - right).join(":");
}

function normalizeWeights(weights) {
  const safe = weights.map((value) => Math.max(0.001, value));
  const total = safe.reduce((sum, value) => sum + value, 0);
  return safe.map((value) => value / total);
}

function sampleWeightedIndex(rng, weights) {
  const roll = rng.float();
  let cursor = 0;
  for (let index = 0; index < weights.length; index += 1) {
    cursor += weights[index];
    if (roll <= cursor) {
      return index;
    }
  }
  return weights.length - 1;
}

function interpolateDeltaBySpend(table, spend, band) {
  const anchors = Object.keys(table)
    .map(Number)
    .sort((left, right) => left - right);
  const clampedSpend = clamp(spend, anchors[0], anchors[anchors.length - 1]);
  const lowerAnchor = anchors.filter((anchor) => anchor <= clampedSpend).pop();
  const upperAnchor = anchors.find((anchor) => anchor >= clampedSpend);
  if (lowerAnchor === upperAnchor) {
    return table[lowerAnchor][band];
  }
  const ratio = (clampedSpend - lowerAnchor) / (upperAnchor - lowerAnchor);
  const lower = table[lowerAnchor][band];
  const upper = table[upperAnchor][band];
  return Object.fromEntries(
    Object.keys(lower).map((key) => [
      key,
      Number((lower[key] + (upper[key] - lower[key]) * ratio).toFixed(6)),
    ]),
  );
}

function getOutcomeWeights(wellbeing, bias = 0) {
  const ratio = clamp(wellbeing / 10, 0, 1);
  const amount = clamp(bias, -0.2, 0.2);
  let good = 0.25 * ratio;
  let bad = 0.25 * (1 - ratio);

  if (amount > 0) {
    const shift = Math.min(amount, bad);
    bad -= shift;
    good += shift;
  } else if (amount < 0) {
    const shift = Math.min(Math.abs(amount), good);
    good -= shift;
    bad += shift;
  }

  return { bad, normal: 0.75, good };
}

function getOutcomeMultipliers(wellbeing) {
  const ratio = clamp(wellbeing / 10, 0, 1);
  return {
    bad: 2 - 1.5 * ratio,
    normal: 1,
    good: 0.5 + 1.5 * ratio,
  };
}

function scaleDelta(delta, band, wellbeing, multiplier = 1) {
  const outcomeMultiplier = getOutcomeMultipliers(wellbeing)[band];
  return Object.fromEntries(
    Object.entries(delta).map(([key, value]) => [key, Number((value * outcomeMultiplier * multiplier).toFixed(6))]),
  );
}

function scaleFixedDelta(delta, wellbeing) {
  const multipliers = getOutcomeMultipliers(wellbeing);
  return Object.fromEntries(
    Object.entries(delta).map(([key, value]) => {
      if (value > 0) {
        return [key, Number((value * multipliers.good).toFixed(6))];
      }
      if (value < 0) {
        return [key, Number((value * multipliers.bad).toFixed(6))];
      }
      return [key, value];
    }),
  );
}

function applyDeltaToStats(player, delta) {
  Object.entries(delta).forEach(([key, value]) => {
    player.stats[key] += value;
  });
}

function formatBandLabel(band) {
  return band;
}

function calculateRepetitionMultiplier(player, actionType) {
  const count = player.trackers.dailyActionCounts[actionType] || 0;
  return CONFIG.repetitionMultipliers[Math.min(count, CONFIG.repetitionMultipliers.length - 1)];
}

function getRelationshipState(state, a, b) {
  const key = createPairKey(a, b);
  if (!state.relationships.has(key)) {
    const affinitySeed = ((a + 1) * 73856093) ^ ((b + 1) * 19349663) ^ state.seed;
    const affinityRng = new RNG(affinitySeed >>> 0);
    state.relationships.set(key, {
      level: 0,
      progress: 0,
      affinity: affinityRng.float(0.18, 0.94),
    });
  }
  return state.relationships.get(key);
}

function playerHasTrait(player, traitId) {
  return player.traits.some((trait) => trait.id === traitId);
}

function applyPlayerStats(player) {
  player.stats.gpa = clamp(player.stats.gpa, 0, 4);
  player.stats.social = clamp(player.stats.social, 0, 10);
  player.stats.expertise = clamp(player.stats.expertise, 0, 10);
  player.stats.wellbeing = clamp(player.stats.wellbeing, 0, 10);
  player.stats.wallet = Math.max(0, player.stats.wallet);
  player.stats.energyCeiling = clamp(player.stats.energyCeiling, 3, 5);
  player.stats.currentEnergy = clamp(player.stats.currentEnergy, 0, player.stats.energyCeiling);
}

function createPlayer(index, rng) {
  const strategy = rng.pick(STRATEGIES);

  const starting = {
    social: 1,
    expertise: 1,
    wallet: 50,
  };
  const priorities = {
    Academic: ["expertise", "expertise", "social", "wallet"],
    Socialite: ["social", "social", "wallet", "expertise"],
    Balanced: ["social", "expertise", "wallet", "social"],
    Hustler: ["wallet", "wallet", "expertise", "social"],
    Recovery: ["social", "expertise", "social", "wallet"],
  }[strategy.id];

  priorities.forEach((target) => {
    if (target === "wallet") {
      starting.wallet += 50;
      return;
    }
    if (starting[target] < 4) {
      starting[target] += 1;
    } else {
      starting.wallet += 50;
    }
  });

  return {
    id: index,
    name: FIRST_NAMES[index],
    strategy: strategy.id,
    traits: [],
    stats: {
      currentEnergy: 3,
      energyCeiling: 3,
      energyProgress: 0,
      wellbeing: 5,
      gpa: 3,
      social: starting.social,
      expertise: starting.expertise,
      wallet: starting.wallet,
    },
    weeklyStudy: 0,
    event: null,
    flags: {
      hitCriticalWellbeing: false,
      hitZeroWallet: false,
      turnedDownSocialOffer: false,
    },
    trackers: {
      dailyActionCounts: {},
      actionTypeCounts: {},
      studyCount: 0,
      nightStudyCount: 0,
      successfulSharedActions: 0,
      successfulSocials: 0,
      weeklyQuotaMisses: 0,
      socialFailures: 0,
      studyTogetherSuccesses: 0,
    },
    summary: [],
    history: [],
  };
}

function createSimulation(seed, playerCount) {
  const rng = new RNG(seed);
  const players = Array.from({ length: playerCount }, (_, index) => createPlayer(index, rng));
  return {
    seed,
    rng,
    players,
    relationships: new Map(),
    log: [],
    timeline: [],
  };
}

function createSnapshotRecord(player, label, phase, step, meta = {}) {
  return {
    label,
    phase,
    step,
    week: meta.week ?? null,
    day: meta.day ?? null,
    slot: meta.slot ?? null,
    stats: {
      wellbeing: player.stats.wellbeing,
      gpa: player.stats.gpa,
      social: player.stats.social,
      expertise: player.stats.expertise,
      wallet: player.stats.wallet,
    },
    weeklyStudy: player.weeklyStudy,
  };
}

function recordHistorySnapshot(state, label, phase, meta = {}) {
  const step = state.timeline.length;
  state.timeline.push({
    step,
    label,
    phase,
    week: meta.week ?? null,
    day: meta.day ?? null,
    slot: meta.slot ?? null,
  });

  for (const player of state.players) {
    player.history.push(createSnapshotRecord(player, label, phase, step, meta));
  }
}

function getAvailableActions(state, player, slot, dayIndex, weekIndex = 0) {
  return getAvailableActionsForWeek(state, player, slot, dayIndex, weekIndex);
}

function isPreMidtermStudyWindow(weekIndex, dayIndex, slot) {
  return weekIndex === 1 && dayIndex === 2 && slot === "Afternoon";
}

function getAvailableActionsForWeek(state, player, slot, dayIndex, weekIndex) {
  const actions = [];
  const isClassDay = CONFIG.classDays.includes(dayIndex);
  if (player.stats.currentEnergy <= 0) {
    return [{ type: "Sleep", forced: true }];
  }

  if (slot === "Morning") {
    actions.push({ type: "Work" }, { type: "Study" }, { type: "Socialize" }, { type: "Exercise" }, { type: "Sleep" });
  }
  if (slot === "Afternoon") {
    if (isClassDay) {
      actions.push({ type: "Class" }, { type: "SkipClass" });
    }
    actions.push({ type: "Study" }, { type: "Socialize" }, { type: "Exercise" }, { type: "Sleep" });
    if (isPreMidtermStudyWindow(weekIndex, dayIndex, slot)) {
      actions.push({ type: "StudyTogether" });
    }
  }
  if (slot === "Night") {
    actions.push({ type: "Sleep" }, { type: "Study" }, { type: "Socialize" });
  }

  return actions.filter((action) => {
    if (action.type === "Exercise" && slot === "Night") {
      return false;
    }
    if (action.type === "Work" && slot !== "Morning") {
      return false;
    }
    return true;
  });
}

function scoreOption({ state, player, action, slot, dayIndex, weekIndex }) {
  const studiesRemaining = Math.max(0, CONFIG.studyQuota - player.weeklyStudy);
  const remainingSlotsToday = CONFIG.slots.length - CONFIG.slots.indexOf(slot);
  const remainingDaysThisWeek = CONFIG.daysPerWeek - dayIndex - 1;
  const remainingStudyWindows = remainingSlotsToday + remainingDaysThisWeek * 3;
  const urgency = studiesRemaining > 0 ? studiesRemaining / Math.max(1, remainingStudyWindows) : 0;
  const lowMoney = player.stats.wallet < 35;
  const lowWellbeing = player.stats.wellbeing < 4.8;
  const lowEnergy = player.stats.currentEnergy <= 1;
  const exhausted = player.stats.currentEnergy <= 1 || player.stats.wellbeing < 4.2;
  const strategyBias = {
    Academic: { study: 1.15, social: 0.5, work: 0.6, exercise: 0.7, sleep: 0.7, class: 1.2 },
    Socialite: { study: 0.55, social: 1.25, work: 0.45, exercise: 0.75, sleep: 0.65, class: 0.85 },
    Balanced: { study: 0.82, social: 0.85, work: 0.7, exercise: 0.8, sleep: 0.75, class: 1.0 },
    Hustler: { study: 0.72, social: 0.55, work: 1.2, exercise: 0.6, sleep: 0.7, class: 0.95 },
    Recovery: { study: 0.6, social: 0.8, work: 0.5, exercise: 1.1, sleep: 1.05, class: 0.9 },
  }[player.strategy];
  const strategySkipBias = {
    Academic: -0.08,
    Socialite: 0.18,
    Balanced: 0.06,
    Hustler: 0.16,
    Recovery: 0.22,
  }[player.strategy];

  const socialNeed = clamp((5.8 - player.stats.social) * 0.25, 0, 1.2);
  const academicNeed = clamp((3.45 - player.stats.gpa) * 0.7 + urgency * 1.5 + (6 - player.stats.expertise) * 0.08, 0, 2.2);
  const healthNeed = clamp((6.8 - player.stats.wellbeing) * 0.38 + (5 - player.stats.energyCeiling) * 0.1, 0, 2.1);
  const walletNeed = clamp((70 - player.stats.wallet) / 80, 0, 1.5);
  const eventBias = player.event?.preferredAction === action.type ? 0.45 : 0;
  const skipPressure =
    (lowWellbeing ? 0.34 : 0) +
    (exhausted ? 0.22 : 0) +
    (lowMoney ? 0.12 : 0) +
    (player.stats.social > 6.5 ? 0.08 : 0) +
    strategySkipBias -
    academicNeed * 0.28;

  let score = 0;
  switch (action.type) {
    case "Study":
      score = academicNeed * strategyBias.study;
      if (slot === "Night" && playerHasTrait(player, "night_owl")) {
        score += 0.15;
      }
      break;
    case "StudyTogether":
      score = (academicNeed * 0.8 + socialNeed * 0.25) * strategyBias.study;
      break;
    case "Socialize":
      score = (socialNeed + player.stats.wellbeing * 0.03) * strategyBias.social;
      if (slot === "Night") {
        score += 0.1;
      }
      break;
    case "Exercise":
      score = healthNeed * strategyBias.exercise + (lowWellbeing ? 0.62 : 0.08) + (exhausted ? 0.18 : 0);
      break;
    case "Sleep":
      score = (lowEnergy ? 1.2 : 0.35) * strategyBias.sleep + (lowWellbeing ? 0.4 : 0);
      if (slot === "Night") {
        score += 0.28;
      }
      break;
    case "Work":
      score = walletNeed * strategyBias.work + (lowMoney ? 0.25 : 0);
      break;
    case "Class":
      score = (0.52 + academicNeed * 0.34) * strategyBias.class - (lowWellbeing ? 0.06 : 0);
      break;
    case "SkipClass":
      score = skipPressure;
      break;
    default:
      score = 0;
  }

  if (player.stats.currentEnergy === 1 && action.type !== "Sleep" && slot === "Night") {
    score -= 0.22;
  }
  if (weekIndex === 3 && academicNeed > 1.1 && action.type === "Study") {
    score += 0.18;
  }
  if (weekIndex >= 2 && action.type === "SkipClass" && lowWellbeing) {
    score += 0.08;
  }

  return score + eventBias;
}

function chooseSpend(player) {
  if (player.stats.wallet < 10) {
    return 0;
  }
  if (player.strategy === "Hustler") {
    return player.stats.wallet >= 70 ? 10 : 0;
  }
  if (player.strategy === "Socialite") {
    return player.stats.wallet >= 90 ? 20 : 10;
  }
  if (player.strategy === "Balanced") {
    return player.stats.wallet >= 100 && player.stats.wellbeing > 6 ? 20 : 10;
  }
  return player.stats.wallet >= 80 ? 10 : 0;
}

function chooseBestActionOption(state, player, slot, dayIndex, weekIndex, predicate = () => true) {
  const available = getAvailableActionsForWeek(state, player, slot, dayIndex, weekIndex).filter(predicate);
  if (available.length === 1 && available[0].type === "Sleep" && available[0].forced) {
    return { action: { type: "Sleep", forced: true }, score: 0 };
  }
  if (available.length === 0) {
    return { action: { type: "Sleep", forced: true }, score: 0 };
  }

  let best = null;
  for (const option of available) {
    const score = scoreOption({ state, player, action: option, slot, dayIndex, weekIndex }) + state.rng.float(-0.12, 0.12);
    if (!best || score > best.score) {
      best = { option, score };
    }
  }

  return { action: { ...best.option }, score: best.score };
}

function chooseSoloAction(state, player, slot, dayIndex, weekIndex) {
  const best = chooseBestActionOption(
    state,
    player,
    slot,
    dayIndex,
    weekIndex,
    (option) => !SHARED_ACTIONS.has(option.type),
  );
  const action = { ...best.action };
  if (action.type === "Class") {
    const burnoutPressure =
      (player.stats.wellbeing < 5 ? 1 : 0) +
      (player.stats.wallet < 30 ? 1 : 0) +
      (player.stats.currentEnergy <= 1 ? 1 : 0) +
      (weekIndex >= 2 ? 1 : 0);
    const emergencySkipChance =
      burnoutPressure >= 2 ? clamp(0.24 + (burnoutPressure - 2) * 0.12, 0, 0.6) : 0;
    if (emergencySkipChance > 0 && state.rng.float() < emergencySkipChance) {
      return { action: { type: "SkipClass" }, score: best.score };
    }
  }
  if (action.type === "Socialize" && slot === "Night" && player.stats.currentEnergy <= 1 && player.stats.wellbeing < 5) {
    return { action: { type: "Sleep" }, score: best.score - 0.1 };
  }

  return { action, score: best.score };
}

function buildSharedInviteCandidates(state, player, slot, dayIndex, weekIndex) {
  const sharedOptions = getAvailableActionsForWeek(state, player, slot, dayIndex, weekIndex).filter((option) =>
    SHARED_ACTIONS.has(option.type),
  );
  const candidates = [];

  for (const option of sharedOptions) {
    for (const target of state.players) {
      if (target.id === player.id) {
        continue;
      }
      const relationship = getRelationshipState(state, player.id, target.id);
      const senderAction = { type: option.type };
      const receiverAction = { type: option.type };
      if (option.type === "Socialize") {
        senderAction.spend = chooseSpend(player);
        receiverAction.spend = chooseSpend(target);
      }
      const senderScore =
        scoreOption({ state, player, action: senderAction, slot, dayIndex, weekIndex }) +
        relationship.affinity * 0.18 +
        relationship.level * 0.08;
      const receiverScore =
        scoreOption({ state, player: target, action: receiverAction, slot, dayIndex, weekIndex }) +
        relationship.affinity * 0.2 +
        relationship.level * 0.1;

      candidates.push({
        type: option.type,
        targetId: target.id,
        senderScore,
        receiverScore,
        pairScore: senderScore + receiverScore + relationship.level * 0.05,
        spend: senderAction.spend,
      });
    }
  }

  candidates.sort((left, right) => right.senderScore - left.senderScore);
  return candidates;
}

function chooseOutgoingInvite(state, player, slot, dayIndex, weekIndex, soloScore) {
  const candidate = buildSharedInviteCandidates(state, player, slot, dayIndex, weekIndex)[0];
  if (!candidate || candidate.senderScore <= soloScore) {
    return null;
  }
  const action = { type: candidate.type, targetId: candidate.targetId };
  if (candidate.type === "Socialize") {
    action.spend = candidate.spend;
  }
  return { ...candidate, action };
}

function validateAction(state, player, action, slot, dayIndex) {
  const available = getAvailableActions(state, player, slot, dayIndex, state.currentWeekIndex ?? 0).map((option) => option.type);
  let validated = action;
  if (!available.includes(action.type)) {
    validated = { type: "Sleep", forced: true };
  }
  if (validated.type === "Socialize") {
    const rawCost = validated.spend || 0;
    const discount = playerHasTrait(player, "saver") && !player.flags.usedSaverToday ? 5 : 0;
    validated.cost = Math.max(0, rawCost - discount);
    validated.discountApplied = discount > 0 && rawCost > 0 && validated.cost < rawCost;
    if (validated.cost > player.stats.wallet) {
      validated.spend = 0;
      validated.cost = 0;
      validated.discountApplied = false;
    }
  }
  return validated;
}

function resolveSharedInvites(plans) {
  const planByPlayer = new Map(plans.map((plan) => [plan.playerId, plan]));
  const incomingByTarget = new Map();

  for (const plan of plans) {
    if (!plan.outgoingInvite) {
      continue;
    }
    const targetInvites = incomingByTarget.get(plan.outgoingInvite.targetId) || [];
    targetInvites.push({ ...plan.outgoingInvite, fromPlayerId: plan.playerId });
    incomingByTarget.set(plan.outgoingInvite.targetId, targetInvites);
  }

  const acceptedIncoming = new Map();
  for (const [targetId, invites] of incomingByTarget.entries()) {
    const receiverPlan = planByPlayer.get(targetId);
    invites.sort((left, right) => right.receiverScore - left.receiverScore);
    const bestInvite = invites[0];
    if (bestInvite && bestInvite.receiverScore > receiverPlan.soloScore) {
      acceptedIncoming.set(targetId, bestInvite);
    }
  }

  const finalPlans = new Map();
  for (const plan of plans) {
    const acceptedInvite = acceptedIncoming.get(plan.playerId);
    let finalPlan = {
      kind: "solo",
      playerId: plan.playerId,
      action: plan.soloAction,
      score: plan.soloScore,
    };

    if (plan.outgoingInvite && plan.outgoingInvite.senderScore > finalPlan.score) {
      finalPlan = {
        kind: "outgoing",
        playerId: plan.playerId,
        action: plan.outgoingInvite.action,
        targetId: plan.outgoingInvite.targetId,
        actionType: plan.outgoingInvite.type,
        score: plan.outgoingInvite.senderScore,
      };
    }
    if (acceptedInvite && acceptedInvite.receiverScore > finalPlan.score) {
      finalPlan = {
        kind: "incoming",
        playerId: plan.playerId,
        fromPlayerId: acceptedInvite.fromPlayerId,
        actionType: acceptedInvite.type,
        targetId: acceptedInvite.fromPlayerId,
        score: acceptedInvite.receiverScore,
      };
    }

    finalPlans.set(plan.playerId, finalPlan);
  }

  const lockedPairs = [];
  const lockedPlayers = new Set();
  for (const plan of plans) {
    const outgoing = plan.outgoingInvite;
    if (!outgoing) {
      continue;
    }
    const senderPlan = finalPlans.get(plan.playerId);
    const receiverPlan = finalPlans.get(outgoing.targetId);
    if (
      senderPlan.kind === "outgoing" &&
      senderPlan.targetId === outgoing.targetId &&
      receiverPlan.kind === "incoming" &&
      receiverPlan.fromPlayerId === plan.playerId &&
      !lockedPlayers.has(plan.playerId) &&
      !lockedPlayers.has(outgoing.targetId)
    ) {
      lockedPlayers.add(plan.playerId);
      lockedPlayers.add(outgoing.targetId);
      lockedPairs.push({
        actorA: plan.playerId,
        actorB: outgoing.targetId,
        type: outgoing.type,
      });
    }
  }

  for (const [playerId, finalPlan] of finalPlans.entries()) {
    if (lockedPlayers.has(playerId)) {
      continue;
    }
    if (finalPlan.kind === "incoming") {
      const fallback = planByPlayer.get(playerId);
      finalPlans.set(playerId, {
        kind: "solo",
        playerId,
        action: fallback.soloAction,
        score: fallback.soloScore,
      });
      continue;
    }
    if (finalPlan.kind === "outgoing") {
      finalPlans.set(playerId, {
        ...finalPlan,
        kind: "failed-shared",
      });
    }
  }

  return { lockedPairs, finalPlans };
}

function planSlotActions(state, slot, dayIndex, weekIndex) {
  const plans = state.players.map((player) => {
    const soloChoice = chooseSoloAction(state, player, slot, dayIndex, weekIndex);
    const soloAction = validateAction(state, player, soloChoice.action, slot, dayIndex);
    const outgoingInviteChoice = chooseOutgoingInvite(state, player, slot, dayIndex, weekIndex, soloChoice.score);
    const outgoingInvite = outgoingInviteChoice
      ? {
          ...outgoingInviteChoice,
          action: validateAction(state, player, outgoingInviteChoice.action, slot, dayIndex),
        }
      : null;

    return {
      playerId: player.id,
      soloAction,
      soloScore: soloChoice.score,
      outgoingInvite,
    };
  });

  const resolution = resolveSharedInvites(plans);
  const lockedLookup = new Map(
    resolution.lockedPairs.flatMap((pair) => [
      [
        pair.actorA,
        {
          kind: "paired",
          playerId: pair.actorA,
          partnerId: pair.actorB,
          action: plans[pair.actorA].outgoingInvite.action,
          actionType: pair.type,
        },
      ],
      [
        pair.actorB,
        {
          kind: "paired",
          playerId: pair.actorB,
          partnerId: pair.actorA,
          action: validateAction(
            state,
            state.players[pair.actorB],
            pair.type === "Socialize"
              ? { type: pair.type, targetId: pair.actorA, spend: chooseSpend(state.players[pair.actorB]) }
              : { type: pair.type, targetId: pair.actorA },
            slot,
            dayIndex,
          ),
          actionType: pair.type,
        },
      ],
    ]),
  );

  const finalPlans = state.players.map((player) => {
    if (lockedLookup.has(player.id)) {
      return lockedLookup.get(player.id);
    }
    const unresolved = resolution.finalPlans.get(player.id);
    return {
      kind: unresolved.kind,
      playerId: player.id,
      action: unresolved.action,
      targetId: unresolved.targetId,
      actionType: unresolved.actionType,
    };
  });

  return { lockedPairs: resolution.lockedPairs, finalPlans };
}

function buildContext({ state, player, action, slot, relationLevel, sharedAverageSpend = 0 }) {
  return {
    state,
    player,
    action,
    slot,
    relationLevel,
    sharedAverageSpend,
    rng: state.rng,
  };
}

function computeBias(ctx, targetPlayer = null) {
  let bias = 0;
  const player = ctx.player;
  if (player.stats.currentEnergy === 2) {
    bias -= 0.025;
  } else if (player.stats.currentEnergy === 1) {
    bias -= 0.07;
  }
  if (ctx.relationLevel) {
    bias += ctx.relationLevel * 0.02;
  }
  if (ctx.action.type === "Socialize" && ctx.sharedAverageSpend > 0) {
    const multiplier = player.traits.find((trait) => trait.paidSocialBonusMultiplier)?.paidSocialBonusMultiplier ?? 1;
    bias += (ctx.sharedAverageSpend / 20) * 0.06 * multiplier;
  }
  if (ctx.action.type === "StudyTogether") {
    bias += 0.03;
  }
  for (const trait of player.traits) {
    if (trait.modifyBias) {
      bias = trait.modifyBias(ctx, bias);
    }
  }
  if (targetPlayer && Math.min(player.stats.wellbeing, targetPlayer.stats.wellbeing) < 2.5) {
    bias -= 0.04;
  }
  if (player.event?.preferredAction === ctx.action.type) {
    bias += player.event.bias;
  }
  return bias;
}

function resolveBand(ctx, wellbeing) {
  const weights = getOutcomeWeights(wellbeing, computeBias(ctx));
  let bandIndex = sampleWeightedIndex(ctx.rng, [weights.bad, weights.normal, weights.good]);
  for (const trait of ctx.player.traits) {
    if (trait.onTierResolved) {
      bandIndex = trait.onTierResolved(ctx, bandIndex);
    }
  }
  return CONFIG.outcomeBands[clamp(bandIndex, 0, CONFIG.outcomeBands.length - 1)];
}

function gainRelationship(state, playerA, playerB, amount = 1) {
  const relationship = getRelationshipState(state, playerA.id, playerB.id);
  const multiplierA = playerA.traits.find((trait) => trait.relationshipGainMultiplier)?.relationshipGainMultiplier ?? 1;
  const multiplierB = playerB.traits.find((trait) => trait.relationshipGainMultiplier)?.relationshipGainMultiplier ?? 1;
  relationship.progress += amount * ((multiplierA + multiplierB) / 2);
  while (relationship.progress >= CONFIG.relationshipPerLevel && relationship.level < CONFIG.relationshipMax) {
    relationship.progress -= CONFIG.relationshipPerLevel;
    relationship.level += 1;
  }
}

function applyRepetition(player, actionType, delta) {
  const multiplier = calculateRepetitionMultiplier(player, actionType);
  return delta * multiplier;
}

function registerActionUsage(player, actionType) {
  player.trackers.dailyActionCounts[actionType] = (player.trackers.dailyActionCounts[actionType] || 0) + 1;
  player.trackers.actionTypeCounts[actionType] = (player.trackers.actionTypeCounts[actionType] || 0) + 1;
}

function spendEnergyIfNeeded(player, actionType) {
  if (actionType !== "Sleep") {
    player.stats.currentEnergy -= 1;
  }
}

function applyStudy(player, band, actionType, extraMultiplier = 1) {
  const source = actionType === "StudyTogether" ? CONFIG.tables.studyTogether[band] : CONFIG.tables.study[band];
  const repeated = {
    gpa: applyRepetition(player, actionType, source.gpa),
    expertise: applyRepetition(player, actionType, source.expertise),
  };
  applyDeltaToStats(player, scaleDelta(repeated, band, player.stats.wellbeing, extraMultiplier));
  player.weeklyStudy += 1;
  player.trackers.studyCount += 1;
}

function applyClass(player, band) {
  const delta = CONFIG.tables.class[band];
  applyDeltaToStats(
    player,
    scaleDelta(
      {
        gpa: applyRepetition(player, "Class", delta.gpa),
        social: applyRepetition(player, "Class", delta.social),
      },
      band,
      player.stats.wellbeing,
    ),
  );
}

function applyWork(player, band) {
  const delta = CONFIG.tables.work[band];
  applyDeltaToStats(
    player,
    scaleDelta(
      {
        wallet: applyRepetition(player, "Work", delta.wallet),
        wellbeing: applyRepetition(player, "Work", delta.wellbeing),
      },
      band,
      player.stats.wellbeing,
    ),
  );
}

function applyExercise(player, band) {
  const delta = CONFIG.tables.exercise[band];
  applyDeltaToStats(
    player,
    scaleDelta(
      { wellbeing: applyRepetition(player, "Exercise", delta.wellbeing) },
      band,
      player.stats.wellbeing,
    ),
  );
}

function applySleep(player, slot) {
  if (slot === "Night") {
    player.stats.currentEnergy = player.stats.energyCeiling;
    applyDeltaToStats(player, scaleFixedDelta({ wellbeing: 0.2 }, player.stats.wellbeing));
  } else {
    player.stats.currentEnergy = Math.min(player.stats.energyCeiling, player.stats.currentEnergy + 2);
    applyDeltaToStats(player, scaleFixedDelta({ wellbeing: 0.05 }, player.stats.wellbeing));
  }
}

function applySocialize(player, band, slot, spend, extraMultiplier = 1) {
  const table = CONFIG.tables.socialize[slot === "Night" ? "night" : "day"][spend];
  const delta = interpolateDeltaBySpend(CONFIG.tables.socialize[slot === "Night" ? "night" : "day"], spend, band);
  applyDeltaToStats(
    player,
    scaleDelta(
      {
        social: applyRepetition(player, "Socialize", delta.social),
        wellbeing: applyRepetition(player, "Socialize", delta.wellbeing),
      },
      band,
      player.stats.wellbeing,
      extraMultiplier,
    ),
  );
}

function consumeEvent(player, actionType) {
  if (player.event?.preferredAction === actionType) {
    player.event = null;
  }
}

function resolveFailedSharedAction(state, player, action, slot) {
  const relation = action.targetId !== undefined ? getRelationshipState(state, player.id, action.targetId).level : 0;
  const ctx = buildContext({ state, player, action, slot, relationLevel: relation, sharedAverageSpend: action.spend || 0 });
  const band = resolveBand(ctx, player.stats.wellbeing);
  const multiplier = CONFIG.sharedFailureMultiplier;

  if (action.type === "StudyTogether") {
    applyStudy(player, band, "StudyTogether", multiplier);
    player.trackers.socialFailures += 1;
  } else if (action.type === "Socialize") {
    const spend = action.spend || 0;
    player.stats.wallet -= action.cost || spend;
    applySocialize(player, band, slot, spend, multiplier);
    if (action.discountApplied) {
      player.flags.usedSaverToday = true;
    }
    player.trackers.socialFailures += 1;
  }

  if (action.type === "Socialize" && action.targetId !== undefined) {
    state.players[action.targetId].flags.turnedDownSocialOffer = true;
  }

  spendEnergyIfNeeded(player, action.type);
  registerActionUsage(player, action.type);
  consumeEvent(player, action.type);
  applyPlayerStats(player);

  return `${player.name} could not sync ${action.type === "Socialize" ? "a hangout" : "study"} with ${state.players[action.targetId].name} and settled for a ${formatBandLabel(band)} turn at 75% value.`;
}

function resolvePairedAction(state, actorA, actorB, actionType, actionA, actionB, slot) {
  const relationship = getRelationshipState(state, actorA.id, actorB.id);
  const sharedWellbeing = (actorA.stats.wellbeing + actorB.stats.wellbeing) / 2;
  const averageSpend = ((actionA.spend || 0) + (actionB.spend || 0)) / 2;
  const ctxA = buildContext({ state, player: actorA, action: actionA, slot, relationLevel: relationship.level, sharedAverageSpend: averageSpend });
  const band = resolveBand(ctxA, sharedWellbeing + relationship.level * 0.12);
  const relationMultiplier = 1 + relationship.level * 0.05;

  if (actionType === "StudyTogether") {
    applyStudy(actorA, band, "StudyTogether");
    applyStudy(actorB, band, "StudyTogether");
    applyDeltaToStats(actorA, scaleFixedDelta({ gpa: 0.005 * relationship.level, expertise: 0.02 * relationship.level }, actorA.stats.wellbeing));
    applyDeltaToStats(actorB, scaleFixedDelta({ gpa: 0.005 * relationship.level, expertise: 0.02 * relationship.level }, actorB.stats.wellbeing));
    actorA.trackers.studyTogetherSuccesses += 1;
    actorB.trackers.studyTogetherSuccesses += 1;
  } else {
    const spendA = actionA.spend || 0;
    const spendB = actionB.spend || 0;
    actorA.stats.wallet -= actionA.cost || spendA;
    actorB.stats.wallet -= actionB.cost || spendB;
    if (actionA.discountApplied) {
      actorA.flags.usedSaverToday = true;
    }
    if (actionB.discountApplied) {
      actorB.flags.usedSaverToday = true;
    }
    applySocialize(actorA, band, slot, spendA);
    applySocialize(actorB, band, slot, spendB);
    applyDeltaToStats(actorA, scaleFixedDelta({ social: 0.05 * relationship.level * relationMultiplier }, actorA.stats.wellbeing));
    applyDeltaToStats(actorB, scaleFixedDelta({ social: 0.05 * relationship.level * relationMultiplier }, actorB.stats.wellbeing));
    actorA.trackers.successfulSocials += 1;
    actorB.trackers.successfulSocials += 1;
  }

  gainRelationship(state, actorA, actorB, band === "good" ? 1 : 0.8);
  actorA.trackers.successfulSharedActions += 1;
  actorB.trackers.successfulSharedActions += 1;

  spendEnergyIfNeeded(actorA, actionType);
  spendEnergyIfNeeded(actorB, actionType);
  registerActionUsage(actorA, actionType);
  registerActionUsage(actorB, actionType);
  consumeEvent(actorA, actionType);
  consumeEvent(actorB, actionType);
  applyPlayerStats(actorA);
  applyPlayerStats(actorB);

  return `${actorA.name} and ${actorB.name} landed a ${formatBandLabel(band)} ${actionType === "Socialize" ? "social" : "study"} sync. Relationship ${relationship.level}/${CONFIG.relationshipMax}.`;
}

function resolveSoloAction(state, player, action, slot) {
  const ctx = buildContext({ state, player, action, slot, relationLevel: 0 });
  const band = resolveBand(ctx, player.stats.wellbeing);
  let message = "";

  switch (action.type) {
    case "Study":
      applyStudy(player, band, "Study");
      message = `${player.name} studied with a ${formatBandLabel(band)} result.`;
      if (slot === "Night") {
        player.trackers.nightStudyCount += 1;
      }
      break;
    case "Class":
      applyClass(player, band);
      message = `${player.name} went to class and got a ${formatBandLabel(band)} lecture return.`;
      break;
    case "SkipClass":
      applyDeltaToStats(player, scaleFixedDelta({ gpa: -0.1 }, player.stats.wellbeing));
      message = `${player.name} skipped class and ate a GPA hit.`;
      break;
    case "Work":
      applyWork(player, band);
      message = `${player.name} worked a ${formatBandLabel(band)} shift.`;
      break;
    case "Exercise":
      applyExercise(player, band);
      message = `${player.name} exercised and got a ${formatBandLabel(band)} health return.`;
      break;
    case "Sleep":
      applySleep(player, slot);
      message = `${player.name} slept during ${slot.toLowerCase()}.`;
      break;
    default:
      message = `${player.name} idled.`;
      break;
  }

  if (action.type !== "Sleep") {
    spendEnergyIfNeeded(player, action.type);
  }
  registerActionUsage(player, action.type);
  consumeEvent(player, action.type);
  applyPlayerStats(player);
  return message;
}

function grantWeeklyEvent(state, player, weekNumber) {
  if (state.rng.float() >= 0.42) {
    player.event = null;
    return;
  }
  const events = [
    { name: "Extra Credit", preferredAction: "Study", bias: 0.08 },
    { name: "Club Buzz", preferredAction: "Socialize", bias: 0.07 },
    { name: "Wellness Push", preferredAction: "Exercise", bias: 0.08 },
  ];
  const event = { ...state.rng.pick(events), week: weekNumber };
  player.event = event;
  state.log.push(`Week ${weekNumber}: ${player.name} drew a private event: ${event.name}.`);
  if (event.name === "Extra Credit" && state.rng.float() < 0.12) {
    player.stats.wallet += 20;
  }
}

function applyEndOfDay(state, dayLabel) {
  for (const player of state.players) {
    for (const trait of player.traits) {
      if (trait.onDayEnd) {
        trait.onDayEnd(player);
      }
    }

    applyDeltaToStats(
      player,
      scaleFixedDelta(
        {
          gpa: -CONFIG.baseDecay.gpa,
          expertise: -CONFIG.baseDecay.expertise,
          social: -CONFIG.baseDecay.social,
          wallet: -CONFIG.baseDecay.wallet,
          wellbeing: -(player.stats.wallet <= 0 ? CONFIG.brokeWellbeingDecay : CONFIG.baseDecay.wellbeing),
        },
        player.stats.wellbeing,
      ),
    );
    player.flags.usedSaverToday = false;
    player.flags.turnedDownSocialOffer = false;
    player.trackers.dailyActionCounts = {};

    if (player.stats.wallet <= 0) {
      player.flags.hitZeroWallet = true;
    }
    if (player.stats.wellbeing < 2) {
      player.flags.hitCriticalWellbeing = true;
    }
    applyPlayerStats(player);
  }
  state.log.push(`${dayLabel}: daily decay applied.`);
}

function applyWeeklyChecks(state, weekNumber) {
  for (const player of state.players) {
    const missing = Math.max(0, CONFIG.studyQuota - player.weeklyStudy);
    if (missing === 0) {
      applyDeltaToStats(player, scaleFixedDelta({ gpa: 0.18 }, player.stats.wellbeing));
      state.log.push(`Week ${weekNumber}: ${player.name} cleared the homework quota and gained 0.18 GPA.`);
    } else if (missing === 1) {
      applyDeltaToStats(player, scaleFixedDelta({ gpa: -0.08 }, player.stats.wellbeing));
      player.trackers.weeklyQuotaMisses += 1;
      state.log.push(`Week ${weekNumber}: ${player.name} missed 1 study requirement and lost 0.08 GPA.`);
    } else if (missing === 2) {
      applyDeltaToStats(player, scaleFixedDelta({ gpa: -0.18 }, player.stats.wellbeing));
      player.trackers.weeklyQuotaMisses += 1;
      state.log.push(`Week ${weekNumber}: ${player.name} missed 2 study requirements and lost 0.18 GPA.`);
    } else if (missing >= 3) {
      applyDeltaToStats(player, scaleFixedDelta({ gpa: -0.32 }, player.stats.wellbeing));
      player.trackers.weeklyQuotaMisses += 1;
      state.log.push(`Week ${weekNumber}: ${player.name} missed the whole quota and lost 0.32 GPA.`);
    }
    player.weeklyStudy = 0;
    applyPlayerStats(player);
  }
}

function resolveExam(state, examType, weekNumber) {
  const bandTable = CONFIG.examBands[examType];
  for (const player of state.players) {
    const expertiseBand = bandTable.find((entry) => player.stats.expertise <= entry.max);
    const examWeights = {
      bad: expertiseBand.outcomes.bad.chance,
      normal: expertiseBand.outcomes.normal.chance,
      good: expertiseBand.outcomes.good.chance,
    };
    const wellbeingWeights = getOutcomeWeights(player.stats.wellbeing);
    const adjustedWeights = normalizeWeights([
      examWeights.bad * (0.7 + wellbeingWeights.bad),
      examWeights.normal * (0.7 + wellbeingWeights.normal),
      examWeights.good * (0.7 + wellbeingWeights.good),
    ]);
    const outcomeBand = CONFIG.outcomeBands[sampleWeightedIndex(state.rng, adjustedWeights)];
    const outcome = expertiseBand.outcomes[outcomeBand];
    applyDeltaToStats(
      player,
      scaleDelta(
        { gpa: outcome.gpa, expertise: outcome.expertise },
        outcomeBand,
        player.stats.wellbeing,
      ),
    );
    player.summary.push(`${examType} ${outcomeBand}`);
    applyPlayerStats(player);
    state.log.push(
      `Week ${weekNumber}: ${player.name} hit a ${outcomeBand} ${examType}, GPA ${outcome.gpa >= 0 ? "+" : ""}${formatNumber(outcome.gpa)}, expertise ${outcome.expertise >= 0 ? "+" : ""}${formatNumber(outcome.expertise)}.`,
    );
  }
}

function computeScore(player) {
  return player.stats.gpa * 16 + player.stats.expertise * 8 + player.stats.social * 4 + player.stats.wellbeing * 5 + player.stats.wallet * 0.03;
}

function buildNarrative(player) {
  if (player.trackers.studyCount >= 15) {
    return "leaned heavily into solo study";
  }
  if (player.trackers.successfulSocials >= 8) {
    return "built a strong campus social loop";
  }
  if (player.flags.hitCriticalWellbeing) {
    return "ran a fragile semester";
  }
  return "played a mixed semester";
}

function simulateSemester(seed, playerCount) {
  const state = createSimulation(seed, playerCount);
  state.log.push(`Seed ${seed}. ${playerCount} players entered the semester.`);
  recordHistorySnapshot(state, "Start", "start");

  for (let weekIndex = 0; weekIndex < CONFIG.weeks; weekIndex += 1) {
    const weekNumber = weekIndex + 1;
    state.log.push(`\n=== WEEK ${weekNumber} ===`);

    for (const player of state.players) {
      grantWeeklyEvent(state, player, weekNumber);
    }

    for (let dayIndex = 0; dayIndex < CONFIG.daysPerWeek; dayIndex += 1) {
      const dayLabel = `W${weekNumber}-${DAY_NAMES[dayIndex]}`;
      state.log.push(`\n${dayLabel}`);

      for (const player of state.players) {
        player.trackers.dailyActionCounts = {};
        player.flags.usedSaverToday = false;
      }

      for (const slot of CONFIG.slots) {
        state.currentWeekIndex = weekIndex;
        const plannedSlot = planSlotActions(state, slot, dayIndex, weekIndex);
        const resolvedPlayers = new Set();
        state.log.push(`  ${slot}`);

        for (const pair of plannedSlot.lockedPairs) {
          if (resolvedPlayers.has(pair.actorA) || resolvedPlayers.has(pair.actorB)) {
            continue;
          }
          const planA = plannedSlot.finalPlans[pair.actorA];
          const planB = plannedSlot.finalPlans[pair.actorB];
          state.log.push(
            `    ${resolvePairedAction(
              state,
              state.players[pair.actorA],
              state.players[pair.actorB],
              pair.type,
              planA.action,
              planB.action,
              slot,
            )}`,
          );
          resolvedPlayers.add(pair.actorA);
          resolvedPlayers.add(pair.actorB);
        }

        for (let index = 0; index < state.players.length; index += 1) {
          const player = state.players[index];
          if (resolvedPlayers.has(player.id)) {
            continue;
          }
          const plan = plannedSlot.finalPlans[index];

          if (plan.kind === "failed-shared") {
            state.log.push(`    ${resolveFailedSharedAction(state, player, plan.action, slot)}`);
            resolvedPlayers.add(player.id);
            continue;
          }

          state.log.push(`    ${resolveSoloAction(state, player, plan.action, slot)}`);
          resolvedPlayers.add(player.id);
        }

        recordHistorySnapshot(
          state,
          `W${weekNumber} ${DAY_NAMES[dayIndex]} ${slot}`,
          "slot",
          { week: weekNumber, day: DAY_NAMES[dayIndex], slot },
        );
      }

      applyEndOfDay(state, dayLabel);
      recordHistorySnapshot(
        state,
        `W${weekNumber} ${DAY_NAMES[dayIndex]} Decay`,
        "day-end",
        { week: weekNumber, day: DAY_NAMES[dayIndex] },
      );
    }

    applyWeeklyChecks(state, weekNumber);
    if (weekNumber === 2) {
      resolveExam(state, "midterm", weekNumber);
      recordHistorySnapshot(state, "Midterm", "exam", { week: weekNumber });
    }
    if (weekNumber === 4) {
      resolveExam(state, "final", weekNumber);
      recordHistorySnapshot(state, "Final", "exam", { week: weekNumber });
    }
  }

  state.players.forEach((player) => {
    applyPlayerStats(player);
    player.finalScore = computeScore(player);
    player.narrative = buildNarrative(player);
  });

  state.players.sort((left, right) => right.finalScore - left.finalScore);
  state.winner = state.players[0];
  state.log.push(`\nWinner: ${state.winner.name} with ${formatNumber(state.winner.finalScore)} points.`);
  recordHistorySnapshot(state, "Final Standings", "final");
  return state;
}

function runBatch(baseSeed, playerCount, runs) {
  const winnersByStrategy = new Map();
  const averageScores = new Map();
  const strategySamples = new Map();
  const statAverages = {
    gpa: 0,
    expertise: 0,
    social: 0,
    wellbeing: 0,
    wallet: 0,
  };
  const relationshipAverages = [];
  let successfulSharedActions = 0;
  let criticalWellbeingHits = 0;
  let quotaMisses = 0;

  for (let offset = 0; offset < runs; offset += 1) {
    const result = simulateSemester(baseSeed + offset, playerCount);
    const winner = result.winner;
    winnersByStrategy.set(winner.strategy, (winnersByStrategy.get(winner.strategy) || 0) + 1);

    result.players.forEach((player) => {
      averageScores.set(player.strategy, (averageScores.get(player.strategy) || 0) + player.finalScore);
      strategySamples.set(player.strategy, (strategySamples.get(player.strategy) || 0) + 1);
      statAverages.gpa += player.stats.gpa;
      statAverages.expertise += player.stats.expertise;
      statAverages.social += player.stats.social;
      statAverages.wellbeing += player.stats.wellbeing;
      statAverages.wallet += player.stats.wallet;
      successfulSharedActions += player.trackers.successfulSharedActions;
      criticalWellbeingHits += player.flags.hitCriticalWellbeing ? 1 : 0;
      quotaMisses += player.trackers.weeklyQuotaMisses;
    });

    const averageRelationship =
      [...result.relationships.values()].reduce((sum, relation) => sum + relation.level, 0) /
      Math.max(1, result.relationships.size);
    relationshipAverages.push(averageRelationship);
  }

  const playerSamples = runs * playerCount;
  return {
    runs,
    winnersByStrategy: [...winnersByStrategy.entries()].sort((a, b) => b[1] - a[1]),
    averageScores: [...averageScores.entries()]
      .map(([strategy, score]) => [strategy, score / strategySamples.get(strategy)])
      .sort((a, b) => b[1] - a[1]),
    statAverages: {
      gpa: statAverages.gpa / playerSamples,
      expertise: statAverages.expertise / playerSamples,
      social: statAverages.social / playerSamples,
      wellbeing: statAverages.wellbeing / playerSamples,
      wallet: statAverages.wallet / playerSamples,
      relationship: relationshipAverages.reduce((sum, value) => sum + value, 0) / relationshipAverages.length,
      sharedActionsPerSemester: successfulSharedActions / (2 * runs),
      criticalShare: criticalWellbeingHits / playerSamples,
      quotaMissesPerPlayer: quotaMisses / playerSamples,
    },
  };
}

function renderStandings(players) {
  const rows = players
    .map((player, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${player.name}</strong></td>
        <td>${player.strategy}</td>
        <td>${formatNumber(player.finalScore)}</td>
        <td>${formatNumber(player.stats.gpa)}</td>
        <td>${formatNumber(player.stats.expertise)}</td>
        <td>${formatNumber(player.stats.social)}</td>
        <td>${formatNumber(player.stats.wellbeing)}</td>
        <td>${formatMoney(player.stats.wallet)}</td>
      </tr>
    `)
    .join("");

  return `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Player</th>
          <th>Style</th>
          <th>Score</th>
          <th>GPA</th>
          <th>Expertise</th>
          <th>Social</th>
          <th>Wellbeing</th>
          <th>Wallet</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function computeMetricSummary(history, key) {
  const values = history.map((entry) => entry.stats[key]);
  const first = values[0];
  const last = values[values.length - 1];
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    change: last - first,
    final: last,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getMetricConfigs(result) {
  const walletMax = Math.max(
    200,
    ...result.players.flatMap((player) => player.history.map((entry) => entry.stats.wallet)),
  );

  return [
    { key: "gpa", label: "GPA", color: "#2a5caa", max: 4, formatter: (value) => formatNumber(value) },
    { key: "expertise", label: "Expertise", color: "#8f4f20", max: 10, formatter: (value) => formatNumber(value) },
    { key: "social", label: "Social", color: "#1d7a63", max: 10, formatter: (value) => formatNumber(value) },
    { key: "wellbeing", label: "Wellbeing", color: "#b27a15", max: 10, formatter: (value) => formatNumber(value) },
    { key: "wallet", label: "Wallet", color: "#5d3ea8", max: walletMax, formatter: (value) => formatMoney(value) },
  ];
}

function renderTimelineChart(history, metricConfigs) {
  const width = 920;
  const height = 280;
  const padding = { top: 16, right: 18, bottom: 42, left: 42 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxIndex = Math.max(1, history.length - 1);
  const toX = (index) => padding.left + (index / maxIndex) * plotWidth;
  const toY = (value, max) => padding.top + plotHeight - (clamp(value, 0, max) / max) * plotHeight;

  const dayMarkers = history
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.phase === "day-end")
    .map(({ index }) => {
      const x = toX(index);
      return `<line x1="${x}" y1="${padding.top}" x2="${x}" y2="${padding.top + plotHeight}" class="chart-guide" />`;
    })
    .join("");

  const strongMarkers = history
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.phase === "exam")
    .map(({ entry, index }) => {
      const x = toX(index);
      const bandWidth = 16;
      const bandClass = "chart-event-band chart-event-band-exam";
      return `
        <rect x="${x - bandWidth / 2}" y="${padding.top}" width="${bandWidth}" height="${plotHeight}" class="${bandClass}" rx="4" />
        <line x1="${x}" y1="${padding.top}" x2="${x}" y2="${padding.top + plotHeight}" class="chart-guide chart-guide-strong" />
        <text x="${x}" y="${padding.top + 14}" text-anchor="middle" class="chart-annotation">${escapeHtml(entry.label)}</text>
      `;
    })
    .join("");

  const series = metricConfigs
    .map((metric) => {
      const points = history
        .map((entry, index) => `${toX(index)},${toY(entry.stats[metric.key], metric.max)}`)
        .join(" ");
      const finalPoint = history[history.length - 1];
      return `
        <polyline points="${points}" fill="none" stroke="${metric.color}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="${toX(history.length - 1)}" cy="${toY(finalPoint.stats[metric.key], metric.max)}" r="3.2" fill="${metric.color}" />
      `;
    })
    .join("");

  const xTicks = [
    { index: 0, label: "Start" },
    { index: Math.floor(maxIndex * 0.25), label: "W1" },
    { index: Math.floor(maxIndex * 0.5), label: "W2" },
    { index: Math.floor(maxIndex * 0.75), label: "W3" },
    { index: maxIndex, label: "Final" },
  ]
    .map(
      (tick) => `
        <text x="${toX(tick.index)}" y="${height - 12}" text-anchor="middle" class="chart-axis-label">${tick.label}</text>
      `,
    )
    .join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" class="timeline-chart" role="img" aria-label="Player stat timeline chart">
      <rect x="${padding.left}" y="${padding.top}" width="${plotWidth}" height="${plotHeight}" class="chart-frame" />
      ${dayMarkers}
      ${strongMarkers}
      ${series}
      ${xTicks}
    </svg>
  `;
}

function renderMetricLegend(metricConfigs) {
  return metricConfigs
    .map(
      (metric) => `
        <span class="timeline-legend-item">
          <span class="timeline-swatch" style="background:${metric.color}"></span>
          ${metric.label}
        </span>
      `,
    )
    .join("");
}

function renderStatComparisonBars(player, metricConfigs) {
  const start = player.history[0];
  const end = player.history[player.history.length - 1];

  return metricConfigs
    .map((metric) => {
      const summary = computeMetricSummary(player.history, metric.key);
      const startValue = start.stats[metric.key];
      const endValue = end.stats[metric.key];
      const startHeight = Math.max(6, (clamp(startValue, 0, metric.max) / metric.max) * 100);
      const endHeight = Math.max(6, (clamp(endValue, 0, metric.max) / metric.max) * 100);
      const changePrefix = summary.change > 0.001 ? "+" : "";
      const changeClass = summary.change > 0.001 ? "stat-trend-up" : summary.change < -0.001 ? "stat-trend-down" : "";

      return `
        <article class="bar-card">
          <div class="bar-card-header">
            <span class="metric-label">${metric.label}</span>
            <span class="metric-meta ${changeClass}">${changePrefix}${metric.formatter(summary.change)}</span>
          </div>
          <div class="bar-vertical-chart">
            <p class="bar-vertical-caption">Initial allocation and final value</p>
            <div class="bar-vertical-pair" aria-label="${metric.label} start and final values">
              <div class="bar-vertical-column">
                <span class="bar-vertical-value">${metric.formatter(startValue)}</span>
                <div class="bar-vertical-track" aria-hidden="true">
                  <span class="bar-vertical-fill bar-vertical-fill-muted" style="height:${startHeight}%; background:${metric.color}"></span>
                </div>
                <span class="bar-vertical-label">Start</span>
              </div>
              <div class="bar-vertical-column">
                <span class="bar-vertical-value">${metric.formatter(endValue)}</span>
                <div class="bar-vertical-track" aria-hidden="true">
                  <span class="bar-vertical-fill" style="height:${endHeight}%; background:${metric.color}"></span>
                </div>
                <span class="bar-vertical-label">Final</span>
              </div>
            </div>
            <p class="bar-vertical-note">The left bar shows the player's initial stat allocation.</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderActionCountBars(player) {
  const baseOrder = ["Study", "StudyTogether", "Socialize", "Class", "SkipClass", "Work", "Exercise", "Sleep"];
  const counts = baseOrder
    .map((action) => ({
      action,
      count: player.trackers.actionTypeCounts[action] || 0,
    }))
    .filter((entry) => entry.count > 0 || entry.action !== "StudyTogether");
  const maxCount = Math.max(1, ...counts.map((entry) => entry.count));

  return counts
    .map(
      (entry) => `
        <div class="bar-row">
          <span class="bar-row-label">${entry.action}</span>
          <div class="bar-track"><span class="bar-fill bar-fill-action" style="width:${(entry.count / maxCount) * 100}%"></span></div>
          <span class="bar-row-value">${entry.count}</span>
        </div>
      `,
    )
    .join("");
}

function renderPlayerTimelines(result) {
  const metricConfigs = getMetricConfigs(result);
  const legend = renderMetricLegend(metricConfigs);

  return result.players
    .map((player, index) => {
      const strongestBond = [...result.relationships.entries()]
        .filter(([key]) => key.split(":").map(Number).includes(player.id))
        .map(([key, relation]) => {
          const [leftId, rightId] = key.split(":").map(Number);
          const partnerId = leftId === player.id ? rightId : leftId;
          const partner = result.players.find((candidate) => candidate.id === partnerId);
          return {
            partner: partner?.name ?? "?",
            level: relation.level,
            progress: relation.progress,
          };
        })
        .sort((left, right) => right.level - left.level || right.progress - left.progress)[0];

      return `
        <section class="timeline-player-card">
          <div class="timeline-player-header">
            <div>
              <p class="timeline-rank">#${index + 1}</p>
              <h3>${player.name}</h3>
              <p class="timeline-player-meta">${player.strategy} · ${formatNumber(player.finalScore)} final score</p>
            </div>
            <div class="timeline-player-side">
              <p class="timeline-player-meta">
                ${strongestBond ? `Top bond: ${strongestBond.partner} (${strongestBond.level}/${CONFIG.relationshipMax})` : "Top bond: none"}
              </p>
            </div>
          </div>
          <div class="timeline-chart-shell">
            <div class="timeline-legend">${legend}</div>
            ${renderTimelineChart(player.history, metricConfigs)}
          </div>
          <div class="analytics-grid">
            <section class="bar-section">
              <div class="bar-section-header">
                <h4>Initial vs Final Stats</h4>
                <p>Compact vertical comparisons keep the starting allocation visible.</p>
              </div>
              <div class="bar-grid">
                ${renderStatComparisonBars(player, metricConfigs)}
              </div>
            </section>
            <section class="bar-section">
              <div class="bar-section-header">
                <h4>Action Mix</h4>
                <p>How many resolved turns this player spent on each action.</p>
              </div>
              <div class="action-bars">
                ${renderActionCountBars(player)}
              </div>
            </section>
          </div>
        </section>
      `;
    })
    .join("");
}

function renderRelationships(state) {
  const pairs = [...state.relationships.entries()]
    .map(([key, relation]) => {
      const [aId, bId] = key.split(":").map(Number);
      return {
        names: `${state.players.find((player) => player.id === aId)?.name ?? "?"} / ${state.players.find((player) => player.id === bId)?.name ?? "?"}`,
        level: relation.level,
        progress: relation.progress,
        affinity: relation.affinity,
      };
    })
    .sort((a, b) => b.level - a.level || b.affinity - a.affinity)
    .slice(0, 8);

  if (!pairs.length) {
    return `<div class="empty-state">No meaningful relationships formed yet.</div>`;
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Pair</th>
          <th>Level</th>
          <th>Progress</th>
          <th>Affinity</th>
        </tr>
      </thead>
      <tbody>
        ${pairs
          .map(
            (pair) => `
              <tr>
                <td>${pair.names}</td>
                <td>${pair.level}</td>
                <td>${formatNumber(pair.progress)}</td>
                <td>${formatNumber(pair.affinity)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderSummaryCards(state) {
  const winner = state.winner;
  return [
    {
      label: "Winner",
      value: winner.name,
      detail: `${winner.strategy} · ${formatNumber(winner.finalScore)} score`,
    },
    {
      label: "Shared Actions",
      value: state.players.reduce((sum, player) => sum + player.trackers.successfulSharedActions, 0) / 2,
      detail: "Successful coordinated social/study actions",
    },
    {
      label: "Burnout Risk",
      value: `${state.players.filter((player) => player.flags.hitCriticalWellbeing).length}/${state.players.length}`,
      detail: "Players who touched critical wellbeing",
    },
  ]
    .map(
      (card) => `
        <article class="summary-card">
          <span class="label">${card.label}</span>
          <span class="value">${card.value}</span>
          <span class="detail">${card.detail}</span>
        </article>
      `,
    )
    .join("");
}

function renderBatchSummary(batch) {
  const formatEntries = (entries, formatter = (value) => `${value}`) =>
    entries
      .slice(0, 5)
      .map(([label, value]) => `<li><strong>${label}</strong>: ${formatter(value)}</li>`)
      .join("");

  return `
    <div class="batch-grid">
      <div class="mini-card">
        <h3>Win Rate by Strategy</h3>
        <ul>${formatEntries(batch.winnersByStrategy, (value) => `${formatNumber((value / batch.runs) * 100)}%`)}</ul>
      </div>
      <div class="mini-card">
        <h3>Average Strategy Score</h3>
        <ul>${formatEntries(batch.averageScores, (value) => formatNumber(value))}</ul>
      </div>
    </div>
    <div class="mini-card">
      <h3>Average End-State Stats</h3>
      <ul>
        <li><strong>GPA</strong>: ${formatNumber(batch.statAverages.gpa)}</li>
        <li><strong>Expertise</strong>: ${formatNumber(batch.statAverages.expertise)}</li>
        <li><strong>Social</strong>: ${formatNumber(batch.statAverages.social)}</li>
        <li><strong>Wellbeing</strong>: ${formatNumber(batch.statAverages.wellbeing)}</li>
        <li><strong>Wallet</strong>: ${formatMoney(batch.statAverages.wallet)}</li>
        <li><strong>Relationship Level</strong>: ${formatNumber(batch.statAverages.relationship)}</li>
        <li><strong>Shared Syncs / Semester</strong>: ${formatNumber(batch.statAverages.sharedActionsPerSemester)}</li>
        <li><strong>Critical Wellbeing Rate</strong>: ${formatNumber(batch.statAverages.criticalShare * 100)}%</li>
        <li><strong>Quota Misses / Player</strong>: ${formatNumber(batch.statAverages.quotaMissesPerPlayer)}</li>
      </ul>
    </div>
  `;
}

function buildTimelineExport(result) {
  return {
    seed: result.seed,
    playerCount: result.players.length,
    winner: {
      id: result.winner.id,
      name: result.winner.name,
      strategy: result.winner.strategy,
      finalScore: Number(formatNumber(result.winner.finalScore)),
    },
    timeline: result.timeline,
    players: result.players.map((player) => ({
      id: player.id,
      name: player.name,
      strategy: player.strategy,
      finalScore: Number(formatNumber(player.finalScore)),
      history: player.history.map((entry, index) => {
        const previous = index > 0 ? player.history[index - 1] : null;
        return {
          step: entry.step,
          label: entry.label,
          phase: entry.phase,
          week: entry.week,
          day: entry.day,
          slot: entry.slot,
          stats: {
            wellbeing: Number(formatNumber(entry.stats.wellbeing)),
            gpa: Number(formatNumber(entry.stats.gpa)),
            social: Number(formatNumber(entry.stats.social)),
            expertise: Number(formatNumber(entry.stats.expertise)),
            wallet: Number(formatNumber(entry.stats.wallet)),
          },
          deltas: previous
            ? {
                wellbeing: Number(formatNumber(entry.stats.wellbeing - previous.stats.wellbeing)),
                gpa: Number(formatNumber(entry.stats.gpa - previous.stats.gpa)),
                social: Number(formatNumber(entry.stats.social - previous.stats.social)),
                expertise: Number(formatNumber(entry.stats.expertise - previous.stats.expertise)),
                wallet: Number(formatNumber(entry.stats.wallet - previous.stats.wallet)),
              }
            : null,
          weeklyStudy: entry.weeklyStudy,
        };
      }),
    })),
  };
}

function escapeCsv(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value);
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }
  return text;
}

function buildTimelineCsv(result) {
  const header = [
    "seed",
    "step",
    "label",
    "phase",
    "week",
    "day",
    "slot",
    "playerId",
    "playerName",
    "strategy",
    "finalScore",
    "wellbeing",
    "deltaWellbeing",
    "gpa",
    "deltaGpa",
    "social",
    "deltaSocial",
    "expertise",
    "deltaExpertise",
    "wallet",
    "deltaWallet",
    "weeklyStudy",
  ];

  const rows = [];
  for (const player of result.players) {
    for (let index = 0; index < player.history.length; index += 1) {
      const entry = player.history[index];
      const previous = index > 0 ? player.history[index - 1] : null;
      rows.push([
        result.seed,
        entry.step,
        entry.label,
        entry.phase,
        entry.week ?? "",
        entry.day ?? "",
        entry.slot ?? "",
        player.id,
        player.name,
        player.strategy,
        formatNumber(player.finalScore),
        formatNumber(entry.stats.wellbeing),
        previous ? formatNumber(entry.stats.wellbeing - previous.stats.wellbeing) : "",
        formatNumber(entry.stats.gpa),
        previous ? formatNumber(entry.stats.gpa - previous.stats.gpa) : "",
        formatNumber(entry.stats.social),
        previous ? formatNumber(entry.stats.social - previous.stats.social) : "",
        formatNumber(entry.stats.expertise),
        previous ? formatNumber(entry.stats.expertise - previous.stats.expertise) : "",
        formatNumber(entry.stats.wallet),
        previous ? formatNumber(entry.stats.wallet - previous.stats.wallet) : "",
        entry.weeklyStudy,
      ]);
    }
  }

  return [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
}

function downloadTextFile(filename, content, mimeType) {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Download failed", error);
    return false;
  }
}

function focusExportField(textarea, value) {
  textarea.value = value;
  if (typeof textarea.focus === "function") {
    textarea.focus();
  }
  if (typeof textarea.select === "function") {
    textarea.select();
  }
}

async function copyText(value, textarea) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      console.error("Clipboard write failed", error);
    }
  }
  if (textarea) {
    focusExportField(textarea, value);
  }
  if (typeof document.execCommand === "function") {
    return document.execCommand("copy");
  }
  return false;
}

const elements = {
  seedInput: document.getElementById("seed-input"),
  playersInput: document.getElementById("players-input"),
  batchInput: document.getElementById("batch-input"),
  simulateOnceBtn: document.getElementById("simulate-once-btn"),
  simulateBatchBtn: document.getElementById("simulate-batch-btn"),
  rerollBtn: document.getElementById("reroll-btn"),
  summaryCards: document.getElementById("summary-cards"),
  standingsTable: document.getElementById("standings-table"),
  relationshipTable: document.getElementById("relationship-table"),
  playerTimelines: document.getElementById("player-timelines"),
  downloadJsonBtn: document.getElementById("download-json-btn"),
  downloadCsvBtn: document.getElementById("download-csv-btn"),
  copyJsonBtn: document.getElementById("copy-json-btn"),
  jsonExportOutput: document.getElementById("json-export-output"),
  csvExportOutput: document.getElementById("csv-export-output"),
  summarySubtitle: document.getElementById("summary-subtitle"),
  batchSummary: document.getElementById("batch-summary"),
  logOutput: document.getElementById("log-output"),
};

const uiState = {
  latestRun: null,
  latestBatch: null,
  latestExportJson: "",
  latestExportCsv: "",
};

function syncExportOutputs(result = uiState.latestRun) {
  if (!result) {
    uiState.latestExportJson = "";
    uiState.latestExportCsv = "";
    elements.jsonExportOutput.value = "";
    elements.csvExportOutput.value = "";
    return;
  }
  const exportPayload = buildTimelineExport(result);
  uiState.latestExportJson = JSON.stringify(exportPayload, null, 2);
  uiState.latestExportCsv = buildTimelineCsv(result);
  elements.jsonExportOutput.value = uiState.latestExportJson;
  elements.csvExportOutput.value = uiState.latestExportCsv;
}

function rerender() {
  if (!uiState.latestRun) {
    return;
  }
  const result = uiState.latestRun;
  elements.summarySubtitle.textContent = `Seed ${result.seed} · ${result.players.length} players · winner ${result.winner.name}`;
  elements.summaryCards.innerHTML = renderSummaryCards(result);
  elements.standingsTable.innerHTML = renderStandings(result.players);
  elements.relationshipTable.innerHTML = renderRelationships(result);
  elements.playerTimelines.classList.remove("empty-state");
  elements.playerTimelines.innerHTML = renderPlayerTimelines(result);
  syncExportOutputs(result);
  elements.logOutput.textContent = result.log.join("\n");

  if (uiState.latestBatch) {
    elements.batchSummary.classList.remove("empty-state");
    elements.batchSummary.innerHTML = renderBatchSummary(uiState.latestBatch);
  }
}

function getInputs() {
  const seed = Number(elements.seedInput.value) || 41021;
  const playerCount = clamp(Number(elements.playersInput.value) || 6, 4, CONFIG.maxPlayers);
  const batchRuns = clamp(Number(elements.batchInput.value) || 250, 10, 5000);
  return { seed, playerCount, batchRuns };
}

function runSingle() {
  const { seed, playerCount } = getInputs();
  uiState.latestRun = simulateSemester(seed, playerCount);
  rerender();
}

function runBatchClicked() {
  const { seed, playerCount, batchRuns } = getInputs();
  uiState.latestBatch = runBatch(seed, playerCount, batchRuns);
  uiState.latestRun = simulateSemester(seed, playerCount);
  rerender();
}

function downloadCurrentExport(kind) {
  if (!uiState.latestRun) {
    return;
  }
  syncExportOutputs(uiState.latestRun);
  if (kind === "json") {
    const downloaded = downloadTextFile(
      `college-life-sim-${uiState.latestRun.seed}.json`,
      uiState.latestExportJson,
      "application/json",
    );
    if (!downloaded) {
      focusExportField(elements.jsonExportOutput, uiState.latestExportJson);
    }
    return;
  }

  const downloaded = downloadTextFile(
    `college-life-sim-${uiState.latestRun.seed}.csv`,
    uiState.latestExportCsv,
    "text/csv;charset=utf-8",
  );
  if (!downloaded) {
    focusExportField(elements.csvExportOutput, uiState.latestExportCsv);
  }
}

elements.simulateOnceBtn.addEventListener("click", runSingle);
elements.simulateBatchBtn.addEventListener("click", runBatchClicked);
elements.downloadJsonBtn.addEventListener("click", () => {
  downloadCurrentExport("json");
});
elements.downloadCsvBtn.addEventListener("click", () => {
  downloadCurrentExport("csv");
});
elements.copyJsonBtn.addEventListener("click", async () => {
  if (!uiState.latestRun) {
    return;
  }
  syncExportOutputs(uiState.latestRun);
  const copied = await copyText(uiState.latestExportJson, elements.jsonExportOutput);
  elements.copyJsonBtn.textContent = copied ? "Copied JSON" : "Copy Failed";
  setTimeout(() => {
    elements.copyJsonBtn.textContent = "Copy JSON";
  }, 1400);
});
elements.rerollBtn.addEventListener("click", () => {
  elements.seedInput.value = `${Date.now() % 1000000}`;
  runSingle();
});

runSingle();

window.render_game_to_text = () =>
  JSON.stringify(
    {
      mode: "semester-sim",
      seed: uiState.latestRun?.seed ?? null,
      winner: uiState.latestRun
        ? {
            name: uiState.latestRun.winner.name,
            score: Number(formatNumber(uiState.latestRun.winner.finalScore)),
          }
        : null,
      players: uiState.latestRun
        ? uiState.latestRun.players.map((player) => ({
            name: player.name,
            strategy: player.strategy,
            gpa: Number(formatNumber(player.stats.gpa)),
            expertise: Number(formatNumber(player.stats.expertise)),
            social: Number(formatNumber(player.stats.social)),
            wellbeing: Number(formatNumber(player.stats.wellbeing)),
            wallet: Math.round(player.stats.wallet),
            historyPoints: player.history.length,
          }))
        : [],
      timelineLength: uiState.latestRun?.timeline.length ?? 0,
      batch: uiState.latestBatch
        ? {
            runs: uiState.latestBatch.runs,
            strategyWins: uiState.latestBatch.winnersByStrategy.slice(0, 3),
          }
        : null,
      coords: "No world coordinates; this is a deterministic management sim dashboard.",
    },
    null,
    2,
  );

window.advanceTime = () => {
  rerender();
};

window.__collegeLifeSim = {
  CONFIG,
  getOutcomeWeights,
  getOutcomeMultipliers,
  scaleDelta,
  resolveSharedInvites,
  getAvailableActionsForTest(dayIndex, slot, weekIndex = 1) {
    const state = createSimulation(41021, 4);
    return getAvailableActionsForWeek(state, state.players[0], slot, dayIndex, weekIndex).map((action) => action.type);
  },
  isStudyTogetherWindow(weekIndex, dayIndex, slot) {
    return isPreMidtermStudyWindow(weekIndex, dayIndex, slot);
  },
  getActionTable(actionType) {
    const key = actionType.charAt(0).toLowerCase() + actionType.slice(1);
    return CONFIG.tables[key];
  },
  getExamBandForTest(examType, index) {
    return CONFIG.examBands[examType][index].outcomes;
  },
  simulateSemester,
  runBatch,
};
