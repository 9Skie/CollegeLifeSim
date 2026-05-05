import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DAY_SLOTS,
  buildSelectionRecordFromRows,
  createEmptySelectionRecord,
  type DaySubmissionStatus,
  type SelectionRecord,
} from "@/utils/day-actions";
import {
  buildDayPlanningContext,
  type DayPlanningContext,
} from "@/utils/day-planning";
import {
  getDayDeadlineAt,
  getDaySecondsRemaining,
  isDayExpired,
} from "@/utils/day-timing";
import type { RelationshipRow } from "@/utils/relationships";

type RoomPlayerForDayState = {
  id: string;
  name: string;
  major?: string | null;
  pos_trait?: string | null;
  neg_trait?: string | null;
  academics?: number | string | null;
  social?: number | string | null;
  wellbeing?: number | string | null;
  money?: number | string | null;
  eliminated?: boolean | null;
  class_schedule?: Array<{ day: number; slot: "morning" | "afternoon" }> | null;
};

type DayActionRow = {
  player_id: string;
  slot: string;
  action: string;
  target_id: string | null;
  money_spent: number | string | null;
  event_code?: string | null;
};

export type PlayerDayStatus = {
  playerId: string;
  status: DaySubmissionStatus;
};

export type RoomEvent = {
  id: string;
  name: string;
  description: string;
  effect: string;
  effectType?: string;
  actionModifiers?: Record<string, Record<string, number>>;
  code?: string;
  isHolder?: boolean;
};

export type RoomDayState = {
  currentDay: number;
  dayDeadlineAt: string | null;
  daySecondsRemaining: number | null;
  dayTimedOut: boolean;
  activePlayerCount: number;
  submittedPlayerCount: number;
  allActivePlayersSubmitted: boolean;
  playerStatuses: PlayerDayStatus[];
  myStatus: DaySubmissionStatus | null;
  mySelections: SelectionRecord;
  myDayContext: DayPlanningContext | null;
  myWeeklyProgress: {
    currentWeek: number;
    weekStartDay: number;
    weekEndDay: number;
    classesScheduled: number;
    classesAttended: number;
    studiesThisWeek: number;
    studyGoal: number;
  } | null;
  publicEvent: RoomEvent | null;
  privateEvent: RoomEvent | null;
};

export async function loadRoomDayState(
  supabase: SupabaseClient,
  code: string,
  currentDay: number,
  currentPhase: string,
  roomUpdatedAt: string | null | undefined,
  players: RoomPlayerForDayState[],
  playerId?: string | null
): Promise<RoomDayState> {
  const { data: rows, error } = await supabase
    .from("day_actions")
    .select("player_id, slot, action, target_id, money_spent")
    .eq("room_code", code)
    .eq("day", currentDay);

  if (error) {
    throw error;
  }

  const dayActions = (rows || []) as DayActionRow[];
  const counts = new Map<string, number>();

  for (const row of dayActions) {
    counts.set(row.player_id, (counts.get(row.player_id) || 0) + 1);
  }

  const playerStatuses: PlayerDayStatus[] = players.map((player) => {
    if (player.eliminated) {
      return { playerId: player.id, status: "goner" };
    }

    return {
      playerId: player.id,
      status: (counts.get(player.id) || 0) >= DAY_SLOTS.length ? "done" : "thinking",
    };
  });

  const activePlayerCount = players.filter((player) => !player.eliminated).length;
  const submittedPlayerCount = playerStatuses.filter(
    (player) => player.status === "done"
  ).length;
  const myStatus = playerId
    ? playerStatuses.find((player) => player.playerId === playerId)?.status ?? null
    : null;
  const mySelections = playerId
    ? buildSelectionRecordFromRows(
        dayActions.filter((row) => row.player_id === playerId)
      )
    : createEmptySelectionRecord();

  const { data: relationshipRows, error: relationshipError } = await supabase
    .from("relationships")
    .select("room_code, player_a, player_b, level, progress")
    .eq("room_code", code);

  if (relationshipError) {
    throw relationshipError;
  }

  const myDayContext = playerId
    ? buildDayPlanningContext({
        roomCode: code,
        currentDay,
        players,
        playerId,
        relationshipRows: (relationshipRows || []) as RelationshipRow[],
      })
    : null;

  let myWeeklyProgress = null;

  if (playerId) {
    const currentWeek = Math.floor((currentDay - 1) / 7) + 1;
    const weekStartDay = (currentWeek - 1) * 7 + 1;
    const weekEndDay = weekStartDay + 6;

    const { data: weeklyRows, error: weeklyError } = await supabase
      .from("day_actions")
      .select("action")
      .eq("room_code", code)
      .eq("player_id", playerId)
      .gte("day", weekStartDay)
      .lte("day", weekEndDay);

    if (weeklyError) {
      throw weeklyError;
    }

    const currentPlayer = players.find((player) => player.id === playerId);
    const classSchedule = Array.isArray(currentPlayer?.class_schedule)
      ? currentPlayer.class_schedule
      : [];

    myWeeklyProgress = {
      currentWeek,
      weekStartDay,
      weekEndDay,
      classesScheduled: classSchedule.length,
      classesAttended: (weeklyRows || []).filter((row) => row.action === "class").length,
      studiesThisWeek: (weeklyRows || []).filter((row) => row.action === "study").length,
      studyGoal: 4,
    };
  }

  /* ---- load real public/private events for today ------------------- */
  const [{ data: publicEventRow }, { data: privateEventRow }] = await Promise.all([
    supabase
      .from("room_public_events")
      .select("public_event_id")
      .eq("room_code", code)
      .eq("day", currentDay)
      .maybeSingle(),
    supabase
      .from("room_private_events")
      .select("private_event_id, assigned_holder_ids")
      .eq("room_code", code)
      .eq("day", currentDay)
      .maybeSingle(),
  ]);

  let publicEvent: RoomEvent | null = null;
  let privateEvent: RoomEvent | null = null;

  if (publicEventRow) {
    const { data: pubDef } = await supabase
      .from("public_event_defs")
      .select("id, title, description, effect_type, action_modifiers")
      .eq("id", publicEventRow.public_event_id)
      .single();
    if (pubDef) {
      publicEvent = {
        id: pubDef.id as string,
        name: pubDef.title as string,
        description: pubDef.description as string,
        effect: formatPublicEffect(
          pubDef.effect_type as string,
          pubDef.action_modifiers as Record<string, Record<string, number>> | null
        ),
        effectType: pubDef.effect_type as string,
        actionModifiers: (pubDef.action_modifiers as Record<string, Record<string, number>>) || undefined,
      };
    }
  }

  if (privateEventRow) {
    const { data: privDef } = await supabase
      .from("private_event_defs")
      .select("id, title, description, effect_type, code_prefix, risk_payload, reward_payload")
      .eq("id", privateEventRow.private_event_id)
      .single();
    if (privDef) {
      const holderIds = (privateEventRow as { assigned_holder_ids?: string[] }).assigned_holder_ids ?? [];
      privateEvent = {
        id: privDef.id as string,
        name: privDef.title as string,
        description: privDef.description as string,
        effect: formatPrivateEffect(
          privDef.effect_type as string,
          privDef.risk_payload as Record<string, unknown> | null,
          privDef.reward_payload as Record<string, unknown> | null
        ),
        code: `${privDef.code_prefix as string}-${String(currentDay).padStart(2, "0")}`,
        isHolder: playerId ? holderIds.includes(playerId) : false,
      };
    }
  }

  return {
    currentDay,
    dayDeadlineAt: currentPhase === "day" ? getDayDeadlineAt(roomUpdatedAt) : null,
    daySecondsRemaining:
      currentPhase === "day" ? getDaySecondsRemaining(roomUpdatedAt) : null,
    dayTimedOut: currentPhase === "day" ? isDayExpired(roomUpdatedAt) : false,
    activePlayerCount,
    submittedPlayerCount,
    allActivePlayersSubmitted:
      activePlayerCount === 0 || submittedPlayerCount >= activePlayerCount,
    playerStatuses,
    myStatus,
    mySelections,
    myDayContext,
    myWeeklyProgress,
    publicEvent,
    privateEvent,
  };
}

function formatPublicEffect(
  effectType: string,
  actionModifiers: Record<string, Record<string, number>> | null
): string {
  if (actionModifiers && Object.keys(actionModifiers).length > 0) {
    return Object.entries(actionModifiers)
      .map(([action, stats]) => {
        const statParts = Object.entries(stats).map(
          ([stat, val]) => `${stat.charAt(0).toUpperCase() + stat.slice(1)} ${val >= 0 ? "+" : ""}${val}`
        );
        return `${action.charAt(0).toUpperCase() + action.slice(1)}: ${statParts.join(", ")}`;
      })
      .join("; ");
  }
  switch (effectType) {
    case "flat_stats":
      return "Flat stat changes";
    case "action_modifier":
      return "Action rewards modified";
    case "daily_decay":
      return "Daily decay modified";
    default:
      return "Mixed effects";
  }
}

function formatPrivateEffect(
  effectType: string,
  risk: Record<string, unknown> | null,
  reward: Record<string, unknown> | null
): string {
  switch (effectType) {
    case "risk_reward":
      return "Risk / Reward choice";
    case "flat_stats":
      return "Guaranteed stat changes";
    case "gimmick":
      return "Special effect";
    case "future_effect":
      return "Delayed effect";
    default:
      return "Mixed effects";
  }
}
