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

  return {
    currentDay,
    activePlayerCount,
    submittedPlayerCount,
    allActivePlayersSubmitted:
      activePlayerCount === 0 || submittedPlayerCount >= activePlayerCount,
    playerStatuses,
    myStatus,
    mySelections,
  };
}
