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
    money: gain.money * mult,
  });
}

function toOutcomeTier(seedValue: number): "bad" | "normal" | "good" {
  if (seedValue < 20) return "bad";
  if (seedValue < 80) return "normal";
  return "good";
}

function getOutcomeMultiplier(tier: "bad" | "normal" | "good") {
  if (tier === "bad") return 0.75;
  if (tier === "good") return 1.25;
  return 1;
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
}: {
  roomCode: string;
  currentDay: number;
  players: RoomPlayerForResolution[];
  dayActions: DayActionRow[];
}) {
  const currentDayIndex = (currentDay - 1) % 7;
  const playerById = new Map(players.map((player) => [player.id, player]));

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

    const selections = buildSelectionRecordFromRows(
      dayActions.filter((row) => row.player_id === player.id)
    );

    const rawOldStats = normalizeStats({
      academics: toNumber(player.academics, 2),
      social: toNumber(player.social, 2),
      wellbeing: toNumber(player.wellbeing, 5),
      money: toNumber(player.money, 2),
    });

    const activeWarnings = [
      rawOldStats.academics <= 1,
      rawOldStats.social <= 1,
      rawOldStats.money <= 0,
      rawOldStats.wellbeing <= 1,
    ].filter(Boolean).length;
    const warningPenalty = activeWarnings * 1.5;

    const oldStats = {
      ...rawOldStats,
      wellbeing: Math.max(0, rawOldStats.wellbeing - warningPenalty),
    };

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

      const tier = toOutcomeTier(
        hashString(`${player.name}:${roomCode}:day:${currentDay}:${slot}`) % 100
      );
      const multiplier = getOutcomeMultiplier(tier);
      const baseGain = calculateSlotGain(
        selection.actionId,
        selection.spend ?? null,
        hasClass
      );

      // Repeat decay: 1st = ×1.0, 2nd = ×0.5, 3rd = ×0.25
      const actionCounts = new Map<string, number>();
      let repeatDecay = 1;
      for (const s of DAY_SLOTS) {
        const sel = selections[s];
        if (!sel) continue;
        const count = actionCounts.get(sel.actionId) || 0;
        if (s === slot) {
          repeatDecay = count === 0 ? 1 : count === 1 ? 0.5 : 0.25;
          break;
        }
        actionCounts.set(sel.actionId, count + 1);
      }

      let finalGain = applyMultiplier(
        applyMultiplier(baseGain, multiplier),
        repeatDecay
      );

      const ditched =
        selection.actionId === "socialize" &&
        typeof selection.targetId === "string" &&
        !dayActions.some(
          (row) =>
            row.slot === slot &&
            row.player_id === selection.targetId &&
            row.target_id === player.id &&
            row.action === "socialize"
        );

      if (ditched) {
        finalGain = applyMultiplier(finalGain, 0.5);
      }

      resolvedActionRows.push({
        room_code: roomCode,
        day: currentDay,
        slot,
        player_id: player.id,
        action: selection.actionId,
        target_id: selection.targetId ?? null,
        money_spent: toNumber(selection.spend === 2 ? 0.5 : selection.spend === 1 ? 0.25 : 0, 0),
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

    const netChange = roundStats(
      addStats(totalGain, DAILY_DECAY)
    );

    const hadRestOrSleep = DAY_SLOTS.some(
      (slot) => {
        const sel = selections[slot];
        return sel?.actionId === "rest" || sel?.actionId === "sleep";
      }
    );

    const giftSocial = socialGifts.get(player.id) || 0;

    const newStats = normalizeStats({
      academics: oldStats.academics + netChange.academics,
      social: oldStats.social + netChange.social + giftSocial,
      wellbeing: oldStats.wellbeing + netChange.wellbeing - (hadRestOrSleep ? 0 : 1.5),
      money: oldStats.money + netChange.money,
    });

    resolutions.push({
      room_code: roomCode,
      day: currentDay,
      player_id: player.id,
      old_stats: oldStats,
      new_stats: newStats,
      changes: {
        dailyDecay: DAILY_DECAY,
        totalGain,
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
