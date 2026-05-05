import {
  DAY_SLOTS,
  buildSelectionRecordFromRows,
  type DaySlot,
} from "@/utils/day-actions";
import {
  getRelationshipBonusAmount,
  getRelationshipKey,
  getRelationshipLevel,
  normalizeRelationshipPair,
  pickRelationshipBonusStat,
  type RelationshipRow,
} from "@/utils/relationships";
import type { WildcardCard } from "@/data/wildcards";
import type { WildcardImmediateEffect } from "@/data/wildcards";
import {
  extractInterestingEvents,
  eventsToHighlights,
} from "@/data/highlights";

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
  wildcardCard?: {
    id: string;
    tier: WildcardCard["tier"];
    title: string;
    emoji: string;
    description: string;
    effectSummary: string;
  } | null;
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
    autoFilled?: boolean;
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

function randomPercent() {
  return Math.floor(Math.random() * 100);
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

function wildcardImmediateToStats(immediate: WildcardImmediateEffect): Stats {
  return roundStats({
    academics: immediate.academics ?? 0,
    social: immediate.social ?? 0,
    wellbeing: immediate.wellbeing ?? 0,
    money: immediate.money ?? 0,
  });
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

function getHomeworkPenalty(studyCount: number) {
  if (studyCount >= 4) return 0;
  if (studyCount === 3) return 0.5;
  if (studyCount === 2) return 1;
  if (studyCount === 1) return 1.5;
  return 2;
}

function getMissedClassPenalty(missedClassCount: number) {
  if (missedClassCount >= 3) return 1.5;
  if (missedClassCount === 2) return 1;
  if (missedClassCount === 1) return 0.5;
  return 0;
}

function hasScheduledClass(
  classSchedule: Array<{ day: number; slot: "morning" | "afternoon" }>,
  day: number,
  slot: string
) {
  if (slot !== "morning" && slot !== "afternoon") {
    return false;
  }

  const currentDayIndex = (day - 1) % 7;
  return classSchedule.some(
    (entry) => entry.day === currentDayIndex && entry.slot === slot
  );
}

function getDailyDecayForTraits(
  posTrait?: string | null,
  negTrait?: string | null
): Stats {
  const decay = { ...DAILY_DECAY };

  if (posTrait === "Disciplined") decay.academics += 0.25;
  if (posTrait === "Socialite") decay.social += 0.25;
  if (posTrait === "Frugal") decay.money += 0.25;
  if (posTrait === "Centered") decay.wellbeing += 0.25;

  if (negTrait === "Scattered") decay.academics -= 0.25;
  if (negTrait === "Withdrawn") decay.social -= 0.25;
  if (negTrait === "Spendthrift") decay.money -= 0.25;
  if (negTrait === "Tense") decay.wellbeing -= 0.25;

  return roundStats(decay);
}

function getSocializeBaseGain({
  spend,
  posTrait,
  negTrait,
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

  if (posTrait === "Thrifty" && moneyCost > 0) {
    moneyCost = Math.max(0, moneyCost - 0.25);
  }

  if (negTrait === "Pricey" && moneyCost > 0) {
    moneyCost += 0.25;
  }

  gain.social = socialGain;
  gain.money = -moneyCost;

  return roundStats(gain);
}

function adjustOutcomeTierForPositiveTrait({
  tier,
}: {
  tier: "bad" | "normal" | "good";
  posTrait?: string | null;
  actionId: string;
}) {
  return tier;
}

function adjustOutcomeTierForNegativeTrait({
  tier,
}: {
  tier: "bad" | "normal" | "good";
  negTrait?: string | null;
  actionId: string;
  seedValue: number;
  baselineWellbeing: number;
  weeklyStudyCountBeforeAction: number;
  secondarySeed: number;
}) {
  return tier;
}

function applyPositiveTraitAfterOutcome({
  gain,
  posTrait,
  actionId,
  matched,
}: {
  gain: Stats;
  posTrait?: string | null;
  actionId: string;
  slot: DaySlot;
  matched: boolean;
  outcomeTier: "bad" | "normal" | "good";
}) {
  const adjusted = { ...gain };

  if (posTrait === "Bookworm" && actionId === "study") adjusted.academics += 0.25;
  if (posTrait === "Curious" && actionId === "study") adjusted.wellbeing += 0.25;
  if (posTrait === "Prepared" && actionId === "class") adjusted.academics += 0.25;
  if (posTrait === "Likeable" && actionId === "class") adjusted.social += 0.25;
  if (posTrait === "Hustler" && actionId === "work") adjusted.money += 0.25;
  if (posTrait === "Courteous" && actionId === "work") adjusted.social += 0.25;
  if (posTrait === "Athletic" && actionId === "exercise") adjusted.wellbeing += 0.25;
  if (posTrait === "Upbeat" && actionId === "exercise") adjusted.social += 0.25;
  if (posTrait === "Rested" && actionId === "rest") adjusted.wellbeing += 0.25;
  if (posTrait === "Sleeper" && actionId === "sleep") adjusted.wellbeing += 0.25;
  if (posTrait === "Reflective" && actionId === "rest") adjusted.academics += 0.25;
  if (posTrait === "Dreamer" && actionId === "sleep") adjusted.academics += 0.25;
  if (posTrait === "Charismatic" && actionId === "socialize") adjusted.social += 0.25;
  if (posTrait === "Warm" && actionId === "socialize") adjusted.wellbeing += 0.25;
  if (posTrait === "Friendly" && actionId === "socialize" && matched) adjusted.social += 0.25;
  if (posTrait === "Helpful" && actionId === "class") adjusted.wellbeing += 0.25;
  if (posTrait === "Steady" && actionId === "work") adjusted.wellbeing += 0.25;
  if (posTrait === "Clear-Headed" && actionId === "exercise") adjusted.academics += 0.25;

  return roundStats(adjusted);
}

function applyNegativeTraitAfterOutcome({
  gain,
  negTrait,
  actionId,
  matched,
}: {
  gain: Stats;
  negTrait?: string | null;
  actionId: string;
  matched: boolean;
  ditched: boolean;
}) {
  const adjusted = { ...gain };

  if (negTrait === "Distracted" && actionId === "study") adjusted.academics -= 0.25;
  if (negTrait === "Drained" && actionId === "study") adjusted.wellbeing -= 0.25;
  if (negTrait === "Sleepy" && actionId === "class") adjusted.academics -= 0.25;
  if (negTrait === "Quiet" && actionId === "class") adjusted.social -= 0.25;
  if (negTrait === "Sloppy" && actionId === "work") adjusted.money -= 0.25;
  if (negTrait === "Rude" && actionId === "work") adjusted.social -= 0.25;
  if (negTrait === "Stiff" && actionId === "exercise") adjusted.wellbeing -= 0.25;
  if (negTrait === "Flat" && actionId === "exercise") adjusted.social -= 0.25;
  if (negTrait === "Restless" && actionId === "rest") adjusted.wellbeing -= 0.25;
  if (negTrait === "Insomniac" && actionId === "sleep") adjusted.wellbeing -= 0.25;
  if (negTrait === "Ruminating" && actionId === "rest") adjusted.academics -= 0.25;
  if (negTrait === "Groggy" && actionId === "sleep") adjusted.academics -= 0.25;
  if (negTrait === "Shy" && actionId === "socialize") adjusted.social -= 0.25;
  if (negTrait === "Hollow" && actionId === "socialize") adjusted.wellbeing -= 0.25;
  if (negTrait === "Loner" && actionId === "socialize" && matched) adjusted.social -= 0.25;
  if (negTrait === "Frazzled" && actionId === "class") adjusted.wellbeing -= 0.25;
  if (negTrait === "Burned Out" && actionId === "work") adjusted.wellbeing -= 0.25;
  if (negTrait === "Foggy" && actionId === "exercise") adjusted.academics -= 0.25;

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

  return roundStats(gain);
}



export function resolveDayForRoom({
  roomCode,
  currentDay,
  players,
  dayActions,
  weeklyActionHistory = [],
  relationshipRows = [],
  wildcardAssignments = [],
  publicEvent,
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
  relationshipRows?: RelationshipRow[];
  wildcardAssignments?: Array<{
    playerId: string;
    slot: DaySlot;
    card: WildcardCard;
  }>;
  publicEvent?: {
    effectType: string;
    actionModifiers: Record<string, Record<string, number>>;
  } | null;
}) {
  const currentDayIndex = (currentDay - 1) % 7;
  const playerById = new Map(players.map((player) => [player.id, player]));
  const wildcardAssignmentByKey = new Map(
    wildcardAssignments.map((assignment) => [
      `${assignment.playerId}:${assignment.slot}`,
      assignment.card,
    ])
  );
  const rawStatsByPlayer = new Map(
    players.map((player) => [
      player.id,
      normalizeStats({
        academics: toNumber(player.academics, 2),
        social: toNumber(player.social, 2),
        wellbeing: toNumber(player.wellbeing, 5),
        money: toNumber(player.money, 2),
      }),
    ])
  );
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
  const priorWeeklyClassesByPlayer = new Map<string, number>();
  for (const row of weeklyActionHistory) {
    if (row.action === "study") {
      priorWeeklyStudiesByPlayer.set(
        row.player_id,
        (priorWeeklyStudiesByPlayer.get(row.player_id) || 0) + 1
      );
      continue;
    }

    if (row.action !== "class") continue;

    const player = playerById.get(row.player_id);
    const classSchedule = Array.isArray(player?.class_schedule) ? player.class_schedule : [];
    if (!hasScheduledClass(classSchedule, row.day, row.slot)) continue;

    priorWeeklyClassesByPlayer.set(
      row.player_id,
      (priorWeeklyClassesByPlayer.get(row.player_id) || 0) + 1
    );
  }

  const anyoneSocializedToday = dayActions.some((row) => row.action === "socialize");
  const relationshipState = new Map(
    relationshipRows.map((row) => [
      getRelationshipKey(row.player_a, row.player_b),
      {
        playerA: row.player_a,
        playerB: row.player_b,
        progress: row.progress,
        level: getRelationshipLevel(row.progress),
      },
    ])
  );
  const changedRelationshipKeys = new Set<string>();
  const relationshipBonusByPlayer = new Map<string, Stats>();

  for (const slot of DAY_SLOTS) {
    const slotRows = dayActions.filter(
      (row) => row.slot === slot && row.action === "socialize" && row.target_id
    );

    for (const row of slotRows) {
      if (!row.target_id || row.player_id >= row.target_id) {
        continue;
      }

      const reciprocal = slotRows.find(
        (candidate) =>
          candidate.player_id === row.target_id && candidate.target_id === row.player_id
      );

      if (!reciprocal) {
        continue;
      }

      const { playerA, playerB } = normalizeRelationshipPair(row.player_id, row.target_id);
      const relationshipKey = getRelationshipKey(playerA, playerB);
      const previousState = relationshipState.get(relationshipKey) ?? {
        playerA,
        playerB,
        progress: 0,
        level: 1,
      };
      const nextProgress = previousState.progress + 1;
      const nextLevel = getRelationshipLevel(nextProgress);

      relationshipState.set(relationshipKey, {
        playerA,
        playerB,
        progress: nextProgress,
        level: nextLevel,
      });
      changedRelationshipKeys.add(relationshipKey);

      const bonusAmount = getRelationshipBonusAmount(nextLevel);
      if (bonusAmount <= 0) {
        continue;
      }

      for (const playerId of [playerA, playerB]) {
        const existingBonus = relationshipBonusByPlayer.get(playerId) || emptyStats();
        const rawStats = rawStatsByPlayer.get(playerId) || emptyStats();
        const bonusStat = pickRelationshipBonusStat({
          academics: rawStats.academics + existingBonus.academics,
          wellbeing: rawStats.wellbeing + existingBonus.wellbeing,
          money: rawStats.money + existingBonus.money,
        });

        relationshipBonusByPlayer.set(playerId, roundStats({
          ...existingBonus,
          [bonusStat]: existingBonus[bonusStat] + bonusAmount,
        }));
      }
    }
  }

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
    const warningAdjustment = posTrait === "Calm" ? -0.25 : negTrait === "Brittle" ? 0.25 : 0;
    const warningPenalty = Math.max(0, activeWarnings * 1.5 + warningAdjustment);

    const oldStats = {
      ...rawOldStats,
      wellbeing: Math.max(0, rawOldStats.wellbeing - warningPenalty),
    };

        const actionCounts = new Map<string, number>();
    let weeklyStudyCountSoFar = priorWeeklyStudiesByPlayer.get(player.id) || 0;
    let weeklyClassesAttendedSoFar = priorWeeklyClassesByPlayer.get(player.id) || 0;

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
          wildcardCard: null,
        };
      }

      const wildcardCard =
        selection.actionId === "wildcard"
          ? wildcardAssignmentByKey.get(`${player.id}:${slot}`) ?? null
          : null;

      if (selection.actionId === "wildcard") {
        const wildcardGain = wildcardCard
          ? wildcardImmediateToStats(wildcardCard.immediate)
          : emptyStats();

        resolvedActionRows.push({
          room_code: roomCode,
          day: currentDay,
          slot,
          player_id: player.id,
          action: selection.actionId,
          target_id: null,
          money_spent: 0,
          outcome_tier: null,
        });

        return {
          slot,
          actionId: selection.actionId,
          targetId: null,
          targetName: null,
          hasClass,
          outcomeTier: null,
          multiplier: 1,
          baseGain: wildcardGain,
          finalGain: wildcardGain,
          ditched: false,
          wildcardCard: wildcardCard
            ? {
                id: wildcardCard.id,
                tier: wildcardCard.tier,
                title: wildcardCard.title,
                emoji: wildcardCard.emoji,
                description: wildcardCard.description,
                effectSummary: wildcardCard.effectSummary,
              }
            : null,
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

      const seedValue = randomPercent();
      const secondarySeed = randomPercent();

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

      // Apply public event action modifiers
      if (publicEvent?.actionModifiers && selection.actionId) {
        const actionMod = publicEvent.actionModifiers[selection.actionId];
        if (actionMod) {
          baseGain = roundStats({
            academics: baseGain.academics + (actionMod.academics ?? 0),
            social: baseGain.social + (actionMod.social ?? 0),
            wellbeing: baseGain.wellbeing + (actionMod.wellbeing ?? 0),
            money: baseGain.money + (actionMod.money ?? 0),
          });
        }
      }

      if (ditched) {
        baseGain = roundStats({
          ...baseGain,
          social: 0.5,
          money: 0,
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

      if (selection.actionId === "class" && hasClass) {
        weeklyClassesAttendedSoFar += 1;
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
        wildcardCard: wildcardCard
          ? {
              id: wildcardCard.id,
              tier: wildcardCard.tier,
              title: wildcardCard.title,
              emoji: wildcardCard.emoji,
              description: wildcardCard.description,
              effectSummary: wildcardCard.effectSummary,
            }
          : null,
      };
    });

      const totalGain = roundStats(
        addStats(
          slotResults.reduce(
            (totals, slotResult) => addStats(totals, slotResult.finalGain),
            emptyStats()
          ),
          relationshipBonusByPlayer.get(player.id) || emptyStats()
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
    const fomoPenalty = negTrait === "FOMO" && anyoneSocializedToday && !hadSocializeToday ? 0.25 : 0;
    const cheerfulBonus = posTrait === "Cheerful" && anyoneSocializedToday && hadSocializeToday ? 0.25 : 0;
    const isEndOfWeek = currentDayIndex === 6;
    const homeworkPenalty = isEndOfWeek ? getHomeworkPenalty(weeklyStudyCountSoFar) : 0;
    const classesScheduledThisWeek = classSchedule.length;
    const missedClassCount = Math.max(0, classesScheduledThisWeek - weeklyClassesAttendedSoFar);
    const classPenalty = isEndOfWeek ? getMissedClassPenalty(missedClassCount) : 0;

    const newStats = normalizeStats({
      academics: oldStats.academics + netChange.academics - homeworkPenalty - classPenalty,
      social: oldStats.social + netChange.social + giftSocial,
      wellbeing:
        oldStats.wellbeing +
        netChange.wellbeing -
        (hadRestOrSleep ? 0 : 1.5) -
        fomoPenalty +
        cheerfulBonus,
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
      highlights: [], // filled globally below
    });
  }

  // --- Global campus highlights (shared by all players) ---
  const globalEvents = extractInterestingEvents({
    roomCode,
    currentDay,
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      pos_trait: p.pos_trait,
      neg_trait: p.neg_trait,
    })),
    resolutions,
    relationshipUpdates: Array.from(changedRelationshipKeys).map((relationshipKey) => {
      const state = relationshipState.get(relationshipKey)!;
      return {
        room_code: roomCode,
        player_a: state.playerA,
        player_b: state.playerB,
        progress: state.progress,
        level: state.level,
      };
    }),
    publicEvent: publicEvent
      ? { effectType: publicEvent.effectType, actionModifiers: publicEvent.actionModifiers }
      : null,
  });

  const globalHighlights = eventsToHighlights(
    globalEvents,
    `${roomCode}:${currentDay}`
  );

  for (const resolution of resolutions) {
    resolution.highlights = globalHighlights;
  }

  return {
    resolutions,
    resolvedActionRows,
    relationshipUpdates: Array.from(changedRelationshipKeys).map((relationshipKey) => {
      const state = relationshipState.get(relationshipKey)!;
      return {
        room_code: roomCode,
        player_a: state.playerA,
        player_b: state.playerB,
        progress: state.progress,
        level: state.level,
      };
    }),
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
