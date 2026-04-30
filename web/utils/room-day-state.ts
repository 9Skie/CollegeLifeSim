import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DAY_SLOTS,
  buildSelectionRecordFromRows,
  createEmptySelectionRecord,
  type DaySubmissionStatus,
  type SelectionRecord,
} from "@/utils/day-actions";

type RoomPlayerForDayState = {
  id: string;
  eliminated?: boolean | null;
  class_schedule?: Array<{ day: number; slot: "morning" | "afternoon" }> | null;
};

type DayActionRow = {
  player_id: string;
  slot: string;
  action: string;
  target_id: string | null;
  money_spent: number | string | null;
};

export type PlayerDayStatus = {
  playerId: string;
  status: DaySubmissionStatus;
};

export type RoomDayState = {
  currentDay: number;
  activePlayerCount: number;
  submittedPlayerCount: number;
  allActivePlayersSubmitted: boolean;
  playerStatuses: PlayerDayStatus[];
  myStatus: DaySubmissionStatus | null;
  mySelections: SelectionRecord;
  myWeeklyProgress: {
    currentWeek: number;
    weekStartDay: number;
    weekEndDay: number;
    classesScheduled: number;
    classesAttended: number;
    studiesThisWeek: number;
    studyGoal: number;
  } | null;
};

export async function loadRoomDayState(
  supabase: SupabaseClient,
  code: string,
  currentDay: number,
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

  return {
    currentDay,
    activePlayerCount,
    submittedPlayerCount,
    allActivePlayersSubmitted:
      activePlayerCount === 0 || submittedPlayerCount >= activePlayerCount,
    playerStatuses,
    myStatus,
    mySelections,
    myWeeklyProgress,
  };
}
