import {
  DAY_SLOTS,
  buildSelectionRecordFromRows,
  type DaySlot,
} from "@/utils/day-actions";

export type Stats = {
  academics: number;
  social: number;
  wellbeing: number;
  money: number;
};

export type ResolutionHighlight = {
  text: string;
  icon: string;
  color: string;
};

export type SlotResolution = {
  slot: DaySlot;
  actionId: string | null;
  targetId: string | null;
  targetName: string | null;
  hasClass: boolean;
  outcomeTier: "bad" | "normal" | "good" | null;
  multiplier: number;
  baseGain: Stats;
  finalGain: Stats;
  ditched: boolean;
};

export type StoredResolution = {
  room_code: string;
  day: number;
  player_id: string;
  old_stats: Stats;
  new_stats: Stats;
  changes: {
    dailyDecay: Stats;
    totalGain: Stats;
    netChange: Stats;
    slotResults: SlotResolution[];
  };
  highlights: ResolutionHighlight[];
};

type RoomPlayerForResolution = {
  id: string;
  name: string;
  pos_trait?: string | null;
  neg_trait?: string | null;
  academics?: number | string | null;
  social?: number | string | null;
  wellbeing?: number | string | null;
  money?: number | string | null;
  class_schedule?: Array<{ day: number; slot: "morning" | "afternoon" }> | null;
  eliminated?: boolean | null;
};

type DayActionRow = {
  id: string;
  player_id: string;
  slot: string;
  action: string;
  target_id: string | null;
  money_spent: number | string | null;
};

const DAILY_DECAY: Stats = {
  academics: -0.5,
  social: -0.5,
  wellbeing: -0.5,
  money: -0.5,
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function toNumber(value: number | string | null | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function quantizeQuarter(value: number) {
  const quantized = Math.round(Math.abs(value) * 4) / 4;
  return Math.sign(value) * quantized;
}

function roundStats(stats: Stats): Stats {
  return {
    academics: quantizeQuarter(stats.academics),
    social: quantizeQuarter(stats.social),
    wellbeing: quantizeQuarter(stats.wellbeing),
    money: quantizeQuarter(stats.money),
  };
}

function normalizeStats(stats: Stats): Stats {
  return {
    academics: quantizeQuarter(Math.min(10, Math.max(0, stats.academics))),
    social: quantizeQuarter(Math.min(10, Math.max(0, stats.social))),
    wellbeing: quantizeQuarter(Math.min(10, Math.max(0, stats.wellbeing))),
    money: quantizeQuarter(Math.min(10, Math.max(0, stats.money))),
  };
}

function emptyStats(): Stats {
  return { academics: 0, social: 0, wellbeing: 0, money: 0 };
}

function addStats(a: Stats, b: Stats): Stats {
  return {
    academics: a.academics + b.academics,
    social: a.social + b.social,
    wellbeing: a.wellbeing + b.wellbeing,
    money: a.money + b.money,
  };
}

function subtractStats(a: Stats, b: Stats): Stats {
  return {
    academics: a.academics - b.academics,
    social: a.social - b.social,
    wellbeing: a.wellbeing - b.wellbeing,
    money: a.money - b.money,
  };
}

function applyMultiplier(gain: Stats, mult: number): Stats {
  return roundStats({
    academics: gain.academics * mult,
    social: gain.social * mult,
    wellbeing: gain.wellbeing * mult,
    money: gain.money,
  });
}

function getBadChanceFromWellbeing(wellbeing: number) {
  const clampedWellbeing = Math.min(10, Math.max(0, wellbeing));
  const shift = (clampedWellbeing - 5) * 4;
  return Math.max(0, Math.min(40, 20 - shift));
}

function toOutcomeTier(
  seedValue: number,
  wellbeing: number
): "bad" | "normal" | "good" {
  const badChance = getBadChanceFromWellbeing(wellbeing);
  const normalChance = 60;

  if (seedValue < badChance) return "bad";
  if (seedValue < badChance + normalChance) return "normal";
  return "good";
}

function getOutcomeMultiplier(tier: "bad" | "normal" | "good") {
  if (tier === "bad") return 0.75;
  if (tier === "good") return 1.25;
  return 1;
}

function getDailyDecayForTraits(
  posTrait?: string | null,
  negTrait?: string | null
): Stats {
  const decay = { ...DAILY_DECAY };

  if (posTrait === "Disciplined") {
    decay.academics += 0.25;
  }

  if (posTrait === "Influencer") {
    decay.social += 0.25;
  }

  if (posTrait === "Trust Fund Kid" || posTrait === "Penny-Pincher") {
    decay.money += 0.25;
  }

  if (posTrait === "Optimist") {
    decay.wellbeing += 0.25;
  }

  if (negTrait === "Sickly") {
    decay.wellbeing -= 0.5;
  }

  if (negTrait === "Spendthrift") {
    decay.money -= 0.25;
  }

  return roundStats(decay);
}

function applySpecialistFlatBonus(gain: Stats, actionId: string): Stats {
  const adjusted = { ...gain };

  switch (actionId) {
    case "study":
      adjusted.academics += 0.5;
      break;
    case "work":
      adjusted.money += 0.5;
      break;
    case "exercise":
      adjusted.wellbeing += 0.5;
      break;
    case "socialize":
      adjusted.social += 0.5;
      break;
    case "rest":
    case "sleep":
      adjusted.wellbeing += 0.5;
      break;
    case "class":
      adjusted.academics += 0.25;
      adjusted.social += 0.25;
      break;
  }

  return roundStats(adjusted);
}

function getSocializeBaseGain({
  spend,
  posTrait,
  negTrait,
  matched,
}: {
  spend: 0 | 1 | 2 | undefined;
  posTrait?: string | null;
  negTrait?: string | null;
  matched: boolean;
}): Stats {
  const gain = emptyStats();

  let socialGain = 1;
  let moneyCost = 0;

  if (spend === 2) {
    socialGain = 1.5;
    moneyCost = 0.5;
  } else if (spend === 1) {
    socialGain = 1.25;
    moneyCost = 0.25;
  }

  if (posTrait === "Coupon Clipper") {
    if (spend === 0 || spend === undefined) {
      socialGain = 1.25;
      moneyCost = 0;
    } else {
      socialGain = 1.5;
      moneyCost = 0.25;
    }
  }

  if (posTrait === "Charmer" && matched && (spend === 0 || spend === undefined)) {
    socialGain = Math.max(socialGain, 1.25);
    moneyCost = 0;
  }

  if (negTrait === "Penny-Wise" && moneyCost > 0) {
    socialGain = 1;
  }

  if (negTrait === "Broke Family" && moneyCost > 0) {
    moneyCost += 0.25;
  }

  gain.social = socialGain;
  gain.money = -moneyCost;

  return roundStats(gain);
}

function adjustOutcomeTierForPositiveTrait({
  tier,
  posTrait,
  actionId,
}: {
  tier: "bad" | "normal" | "good";
  posTrait?: string | null;
  actionId: string;
}) {
  if (
    tier === "bad" &&
    posTrait === "Study Buddy" && actionId === "study"
  ) {
    return "normal" as const;
  }

  if (
    tier === "bad" &&
    posTrait === "Calm Sleeper" &&
    (actionId === "rest" || actionId === "sleep")
  ) {
    return "normal" as const;
  }

  return tier;
}

function adjustOutcomeTierForNegativeTrait({
  tier,
  negTrait,
  actionId,
  seedValue,
  baselineWellbeing,
  weeklyStudyCountBeforeAction,
  secondarySeed,
}: {
  tier: "bad" | "normal" | "good";
  negTrait?: string | null;
  actionId: string;
  seedValue: number;
  baselineWellbeing: number;
  weeklyStudyCountBeforeAction: number;
  secondarySeed: number;
}) {
  if (negTrait === "Pessimist" && tier === "good") {
    return "normal" as const;
  }

  if (
    negTrait === "Procrastinator" &&
    actionId === "study" &&
    weeklyStudyCountBeforeAction === 0
  ) {
    return "bad" as const;
  }

  if (negTrait === "Couch Potato" && actionId === "exercise" && secondarySeed < 50) {
    return "bad" as const;
  }

  if (negTrait === "Hypochondriac" && baselineWellbeing <= 4) {
    const adjustedBadChance = Math.min(50, getBadChanceFromWellbeing(baselineWellbeing) + 10);
    if (seedValue < adjustedBadChance) {
      return "bad" as const;
    }
  }

  return tier;
}

function applyPositiveTraitAfterOutcome({
  gain,
  posTrait,
  actionId,
  slot,
  matched,
  outcomeTier,
}: {
  gain: Stats;
  posTrait?: string | null;
  actionId: string;
  slot: DaySlot;
  matched: boolean;
  outcomeTier: "bad" | "normal" | "good";
}) {
  let adjusted = { ...gain };

  if (posTrait === "Night Owl" && slot === "night") {
    adjusted = applySpecialistFlatBonus(adjusted, actionId);
  }

  if (posTrait === "Early Bird" && slot === "morning") {
    adjusted = applySpecialistFlatBonus(adjusted, actionId);
  }

  if (posTrait === "Athletic" && actionId === "exercise") {
    adjusted.wellbeing += 0.5;
  }

  if (posTrait === "Hustler" && actionId === "work") {
    adjusted.money += 0.5;
  }

  if (posTrait === "Bookworm" && actionId === "study") {
    adjusted.academics += 0.25;
  }

  if (posTrait === "Quick Study" && actionId === "study" && outcomeTier === "good") {
    adjusted.academics += 0.25;
  }

  if (posTrait === "Gym Rat" && actionId === "exercise") {
    adjusted.social += 0.25;
  }

  if (posTrait === "Self Care" && (actionId === "rest" || actionId === "sleep")) {
    adjusted.wellbeing += 0.25;
  }

  if (
    posTrait === "Professor's Favorite" &&
    actionId === "class"
  ) {
    adjusted.social += 0.25;
  }

  if (posTrait === "Charismatic" && actionId === "socialize" && matched) {
    adjusted.social += 0.25;
  }

  if (posTrait === "Networker" && actionId === "socialize" && matched) {
    adjusted.social += 0.25;
  }

  return roundStats(adjusted);
}

function applyNegativeTraitAfterOutcome({
  gain,
  negTrait,
  actionId,
  matched,
  ditched,
}: {
  gain: Stats;
  negTrait?: string | null;
  actionId: string;
  matched: boolean;
  ditched: boolean;
}) {
  const adjusted = { ...gain };

  if (negTrait === "Distracted" && actionId === "class") {
    adjusted.academics = 0.25;
  }

  if (negTrait === "Insomniac" && actionId === "sleep") {
    adjusted.wellbeing = quantizeQuarter(adjusted.wellbeing * 0.5);
  }

  if (negTrait === "Allergic" && actionId === "exercise") {
    adjusted.wellbeing = quantizeQuarter(adjusted.wellbeing * 0.5);
  }

  if (negTrait === "Loner" && actionId === "socialize" && matched) {
    adjusted.social -= 0.25;
  }

  if (negTrait === "Anxious" && ditched) {
    adjusted.wellbeing -= 0.5;
  }

  return roundStats(adjusted);
}

function calculateSlotGain(
  actionId: string | null,
  spend: number | string | null,
  hasClass: boolean
): Stats {
  const gain = emptyStats();
  if (!actionId) {
    return gain;
  }

  switch (actionId) {
    case "class":
      gain.academics += 0.75;
      gain.social += 0.25;
      break;
    case "study":
      gain.academics += 1;
      break;
    case "work":
      gain.money += 1;
      break;
    case "exercise":
      gain.wellbeing += 1;
      break;
    case "socialize": {
      const amount = toNumber(spend, 0);
      if (amount >= 0.5) {
        gain.money -= 0.5;
      } else if (amount >= 0.25) {
        gain.money -= 0.25;
      } else {
        gain.social += 1;
      }
      break;
    }
    case "rest":
      gain.wellbeing += 0.75;
      break;
    case "sleep":
      gain.wellbeing += 1;
      break;
    case "wildcard":
      break;
  }

  if (hasClass && actionId !== "class") {
    gain.academics -= 0.5;
  }

  return roundStats(gain);
}

function buildFallbackHighlights(playerName: string, slotResults: SlotResolution[]) {
  const highlights: ResolutionHighlight[] = [];

  for (const slotResult of slotResults) {
    if (!slotResult.actionId || !slotResult.outcomeTier) {
      continue;
    }

    if (slotResult.ditched && slotResult.targetName) {
      highlights.push({
        text: `${playerName} tried to make plans with ${slotResult.targetName}, but got ditched.`,
        icon: "💔",
        color: "#d94f4f",
      });
      continue;
    }

    if (slotResult.outcomeTier === "good") {
      highlights.push({
        text: `${playerName} had a strong ${slotResult.slot} ${slotResult.actionId.toLowerCase()} session.`,
        icon: "✨",
        color: "#5b8c5a",
      });
    } else if (slotResult.outcomeTier === "bad") {
      highlights.push({
        text: `${playerName}'s ${slotResult.slot} ${slotResult.actionId.toLowerCase()} did not go to plan.`,
        icon: "🥀",
        color: "#d94f4f",
      });
    }
  }

  if (highlights.length === 0) {
    highlights.push({
      text: `${playerName} wrapped up the day without any major drama.`,
      icon: "🍃",
      color: "#8a8579",
    });
  }

  return highlights.slice(0, 5);
}

export function resolveDayForRoom({
  roomCode,
  currentDay,
  players,
  dayActions,
  weeklyActionHistory = [],
}: {
  roomCode: string;
  currentDay: number;
  players: RoomPlayerForResolution[];
  dayActions: DayActionRow[];
  weeklyActionHistory?: Array<{
    player_id: string;
    action: string;
    day: number;
    slot: string;
  }>;
}) {
  const currentDayIndex = (currentDay - 1) % 7;
  const playerById = new Map(players.map((player) => [player.id, player]));
  const selectionsByPlayer = new Map(
    players.map((player) => [
      player.id,
      buildSelectionRecordFromRows(
        dayActions.filter((row) => row.player_id === player.id)
      ),
    ])
  );

  // Socialize spend gifts: target_id -> total social received
  const socialGifts = new Map<string, number>();
  for (const row of dayActions) {
    if (row.action === "socialize" && row.target_id) {
      const spend = toNumber(row.money_spent, 0);
      if (spend >= 0.5) {
        socialGifts.set(row.target_id, (socialGifts.get(row.target_id) || 0) + 1.5);
      } else if (spend >= 0.25) {
        socialGifts.set(row.target_id, (socialGifts.get(row.target_id) || 0) + 1.25);
      }
    }
  }

  const priorWeeklyStudiesByPlayer = new Map<string, number>();
  for (const row of weeklyActionHistory) {
    if (row.action !== "study") continue;
    priorWeeklyStudiesByPlayer.set(
      row.player_id,
      (priorWeeklyStudiesByPlayer.get(row.player_id) || 0) + 1
    );
  }

  const anyoneSocializedToday = dayActions.some((row) => row.action === "socialize");

  const resolutions: StoredResolution[] = [];
  const resolvedActionRows: Array<{
    room_code: string;
    day: number;
    slot: DaySlot;
    player_id: string;
    action: string;
    target_id: string | null;
    money_spent: number;
    outcome_tier: "bad" | "normal" | "good" | null;
  }> = [];

  for (const player of players) {
    if (player.eliminated) {
      continue;
    }

    const classSchedule = Array.isArray(player.class_schedule)
      ? player.class_schedule
      : [];
    const hasClassMorning = classSchedule.some(
      (entry) => entry.day === currentDayIndex && entry.slot === "morning"
    );
    const hasClassAfternoon = classSchedule.some(
      (entry) => entry.day === currentDayIndex && entry.slot === "afternoon"
    );

    const selections = selectionsByPlayer.get(player.id)!;
    const posTrait = player.pos_trait ?? null;
    const negTrait = player.neg_trait ?? null;
    const dailyDecay = getDailyDecayForTraits(posTrait, negTrait);

    const rawOldStats = normalizeStats({
      academics: toNumber(player.academics, 2),
      social: toNumber(player.social, 2),
      wellbeing: toNumber(player.wellbeing, 5),
      money: toNumber(player.money, 2),
    });
    const baselineWellbeing = rawOldStats.wellbeing;

    const activeWarnings = [
      rawOldStats.academics <= 1,
      rawOldStats.social <= 1,
      rawOldStats.money <= 0,
    ].filter(Boolean).length;
    const warningPenalty = activeWarnings * 1.5;

    const oldStats = {
      ...rawOldStats,
      wellbeing: Math.max(0, rawOldStats.wellbeing - warningPenalty),
    };

    let luckyUsed = false;
    const actionCounts = new Map<string, number>();
    let weeklyStudyCountSoFar = priorWeeklyStudiesByPlayer.get(player.id) || 0;

    const slotResults: SlotResolution[] = DAY_SLOTS.map((slot) => {
      const selection = selections[slot];
      const hasClass =
        slot === "morning"
          ? hasClassMorning
          : slot === "afternoon"
          ? hasClassAfternoon
          : false;

      if (!selection) {
        return {
          slot,
          actionId: null,
          targetId: null,
          targetName: null,
          hasClass,
          outcomeTier: null,
          multiplier: 1,
          baseGain: emptyStats(),
          finalGain: emptyStats(),
          ditched: false,
        };
      }

      const matched =
        selection.actionId === "socialize" &&
        typeof selection.targetId === "string" &&
        dayActions.some(
          (row) =>
            row.slot === slot &&
            row.player_id === selection.targetId &&
            row.target_id === player.id &&
            row.action === "socialize"
        );

      const ditched =
        selection.actionId === "socialize" &&
        typeof selection.targetId === "string" &&
        !matched;

      const seedValue = hashString(`${player.name}:${roomCode}:day:${currentDay}:${slot}`) % 100;
      const secondarySeed =
        hashString(`${player.name}:${roomCode}:day:${currentDay}:${slot}:neg`) % 100;

      let tier = adjustOutcomeTierForPositiveTrait({
        tier: toOutcomeTier(seedValue, baselineWellbeing),
        posTrait,
        actionId: selection.actionId,
      });

      tier = adjustOutcomeTierForNegativeTrait({
        tier,
        negTrait,
        actionId: selection.actionId,
        seedValue,
        baselineWellbeing,
        weeklyStudyCountBeforeAction: weeklyStudyCountSoFar,
        secondarySeed,
      });

      if (posTrait === "Lucky" && tier === "bad" && !luckyUsed) {
        tier = "normal";
        luckyUsed = true;
      }

      const multiplier = getOutcomeMultiplier(tier);
      let baseGain =
        selection.actionId === "socialize"
          ? getSocializeBaseGain({
              spend: selection.spend,
              posTrait,
              negTrait,
              matched,
            })
          : calculateSlotGain(selection.actionId, selection.spend ?? null, hasClass);

      if (ditched) {
        baseGain = roundStats({
          ...baseGain,
          social: baseGain.social * 0.5,
        });
      }

      const actionCount = actionCounts.get(selection.actionId) || 0;
      const repeatDecay =
        posTrait === "Adaptable"
          ? 1
          : actionCount === 0
          ? 1
          : actionCount === 1
          ? 0.5
          : 0.25;
      actionCounts.set(selection.actionId, actionCount + 1);

      let finalGain = applyMultiplier(baseGain, multiplier);
      finalGain = applyPositiveTraitAfterOutcome({
        gain: finalGain,
        posTrait,
        actionId: selection.actionId,
        slot,
        matched,
        outcomeTier: tier,
      });
      finalGain = applyNegativeTraitAfterOutcome({
        gain: finalGain,
        negTrait,
        actionId: selection.actionId,
        matched,
        ditched,
      });
      finalGain = applyMultiplier(finalGain, repeatDecay);

      if (selection.actionId === "study") {
        weeklyStudyCountSoFar += 1;
      }

      resolvedActionRows.push({
        room_code: roomCode,
        day: currentDay,
        slot,
        player_id: player.id,
        action: selection.actionId,
        target_id: selection.targetId ?? null,
        money_spent: Math.max(0, -baseGain.money),
        outcome_tier: tier,
      });

      return {
        slot,
        actionId: selection.actionId,
        targetId: selection.targetId ?? null,
        targetName: selection.targetId
          ? playerById.get(selection.targetId)?.name ?? null
          : null,
        hasClass,
        outcomeTier: tier,
        multiplier,
        baseGain,
        finalGain,
        ditched,
      };
    });

      const totalGain = roundStats(
        slotResults.reduce(
          (totals, slotResult) => addStats(totals, slotResult.finalGain),
          emptyStats()
        )
      );

    const roundedTotalGain = roundStats(totalGain);

    const netChange = roundStats(
      addStats(roundedTotalGain, dailyDecay)
    );

    const hadRestOrSleep = DAY_SLOTS.some(
      (slot) => {
        const sel = selections[slot];
        return sel?.actionId === "rest" || sel?.actionId === "sleep";
      }
    );
    const hadSocializeToday = DAY_SLOTS.some(
      (slot) => selections[slot]?.actionId === "socialize"
    );

    const giftSocial = socialGifts.get(player.id) || 0;
    const fomoPenalty =
      negTrait === "FOMO" && anyoneSocializedToday && !hadSocializeToday ? 0.5 : 0;

    const newStats = normalizeStats({
      academics: oldStats.academics + netChange.academics,
      social: oldStats.social + netChange.social + giftSocial,
      wellbeing:
        oldStats.wellbeing +
        netChange.wellbeing -
        (hadRestOrSleep ? 0 : 1.5) -
        fomoPenalty,
      money: oldStats.money + netChange.money,
    });

    resolutions.push({
      room_code: roomCode,
      day: currentDay,
      player_id: player.id,
      old_stats: oldStats,
      new_stats: newStats,
      changes: {
        dailyDecay,
        totalGain: roundedTotalGain,
        netChange: roundStats(subtractStats(newStats, oldStats)),
        slotResults,
      },
      highlights: buildFallbackHighlights(player.name, slotResults),
    });
  }

  return {
    resolutions,
    resolvedActionRows,
    playerUpdates: resolutions.map((resolution) => ({
      playerId: resolution.player_id,
      academics: resolution.new_stats.academics,
      social: resolution.new_stats.social,
      wellbeing: resolution.new_stats.wellbeing,
      money: resolution.new_stats.money,
      eliminated: resolution.new_stats.wellbeing <= 0,
    })),
  };
}
