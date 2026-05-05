import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DAY_SLOTS,
  getMoneySpentFromSelection,
  type Selection,
} from "@/utils/day-actions";
import type { StoredResolution } from "@/utils/day-resolution";
import { resolveDayForRoom } from "@/utils/day-resolution";
import type { RelationshipRow } from "@/utils/relationships";
import { isDayExpired } from "@/utils/day-timing";

type RoomRecord = {
  code: string;
  current_day: number;
  current_phase: string;
  status: string;
  updated_at?: string | null;
};

type RoomPlayer = {
  id: string;
  name: string;
  major?: string | null;
  pos_trait?: string | null;
  neg_trait?: string | null;
  academics?: number | string | null;
  social?: number | string | null;
  wellbeing?: number | string | null;
  money?: number | string | null;
  class_schedule?: Array<{ day: number; slot: "morning" | "afternoon" }> | null;
  eliminated: boolean;
};

type DayActionRow = {
  id: string;
  player_id: string;
  slot: string;
  action: string;
  target_id: string | null;
  money_spent: number | string | null;
};


export type EnsuredDayPhaseResult = {
  room: RoomRecord;
  players: RoomPlayer[];
  resolved: boolean;
  allResolutions: StoredResolution[] | null;
  currentResolution: StoredResolution | null;
};

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function getDaySlotContext(
  player: RoomPlayer,
  currentDay: number,
  slot: "morning" | "afternoon" | "night"
) {
  const currentDayIndex = (currentDay - 1) % 7;
  const classSchedule = Array.isArray(player.class_schedule) ? player.class_schedule : [];
  const hasClass =
    slot !== "night" &&
    classSchedule.some(
      (entry) => entry.day === currentDayIndex && entry.slot === slot
    );

  return {
    hasClass,
    workAvailable: slot === "night" ? true : !hasClass,
  };
}

function buildAutoSelectionForSlot({
  roomCode,
  currentDay,
  player,
  slot,
  activeOtherPlayers,
  usedWildcard,
}: {
  roomCode: string;
  currentDay: number;
  player: RoomPlayer;
  slot: "morning" | "afternoon" | "night";
  activeOtherPlayers: RoomPlayer[];
  usedWildcard: boolean;
}): Selection {
  const { hasClass, workAvailable } = getDaySlotContext(player, currentDay, slot);
  const includeSocialize = activeOtherPlayers.length > 0;
  const actions: string[] = [];

  if (slot === "morning") {
    if (hasClass) {
      actions.push("class");
    } else {
      actions.push("study");
    }
    if (includeSocialize) actions.push("socialize");
    if (!usedWildcard) actions.push("wildcard");
    actions.push("exercise", "rest");
    if (workAvailable) actions.push("work");
  } else if (slot === "afternoon") {
    actions.push(hasClass ? "class" : "study");
    if (includeSocialize) actions.push("socialize");
    if (!usedWildcard) actions.push("wildcard");
    actions.push("exercise", "rest");
    if (workAvailable) actions.push("work");
  } else {
    actions.push("study");
    if (includeSocialize) actions.push("socialize");
    if (!usedWildcard) actions.push("wildcard");
    actions.push("sleep", "work");
  }

  const actionId = pickRandom(actions);

  if (actionId !== "socialize") {
    return { actionId };
  }

  const target = pickRandom(activeOtherPlayers);
  const spend = Math.floor(Math.random() * 3) as
    | 0
    | 1
    | 2;

  return {
    actionId,
    targetId: target.id,
    spend,
  };
}

function buildAutofillRows({
  room,
  players,
  dayActions,
}: {
  room: RoomRecord;
  players: RoomPlayer[];
  dayActions: DayActionRow[];
}) {
  const byPlayer = new Map<string, Set<string>>();
  const wildcardByPlayer = new Set<string>();

  for (const row of dayActions) {
    if (!byPlayer.has(row.player_id)) {
      byPlayer.set(row.player_id, new Set());
    }
    byPlayer.get(row.player_id)!.add(row.slot);
    if (row.action === "wildcard") {
      wildcardByPlayer.add(row.player_id);
    }
  }

  const activePlayers = players.filter((player) => !player.eliminated);

  return activePlayers.flatMap((player) => {
    const seenSlots = byPlayer.get(player.id) ?? new Set<string>();
    let usedWildcard = wildcardByPlayer.has(player.id);
    const activeOtherPlayers = activePlayers.filter((otherPlayer) => otherPlayer.id !== player.id);

    return DAY_SLOTS.flatMap((slot) => {
      if (seenSlots.has(slot)) {
        return [];
      }

      const selection = buildAutoSelectionForSlot({
        roomCode: room.code,
        currentDay: room.current_day,
        player,
        slot,
        activeOtherPlayers,
        usedWildcard,
      });

      if (selection.actionId === "wildcard") {
        usedWildcard = true;
      }

      return {
        room_code: room.code,
        day: room.current_day,
        slot,
        player_id: player.id,
        action: selection.actionId,
        target_id: selection.targetId ?? null,
        money_spent: getMoneySpentFromSelection(selection),
      };
    });
  });
}

export async function ensureDayPhaseResolved({
  supabase,
  room,
  players,
  playerId,
}: {
  supabase: SupabaseClient;
  room: RoomRecord;
  players: RoomPlayer[];
  playerId?: string | null;
}): Promise<EnsuredDayPhaseResult> {
  if (room.current_phase !== "day") {
    return {
      room,
      players,
      resolved: false,
      allResolutions: null,
      currentResolution: null,
    };
  }

  const { data: actionRows, error: actionRowsError } = await supabase
    .from("day_actions")
    .select("id, player_id, slot, action, target_id, money_spent")
    .eq("room_code", room.code)
    .eq("day", room.current_day);

  if (actionRowsError) {
    throw actionRowsError;
  }

  let dayActions = ((actionRows || []) as Array<{
    id?: string;
    player_id: string;
    slot: string;
    action: string;
    target_id: string | null;
    money_spent: number | string | null;
  }>).map((row) => ({
    id: row.id ?? `existing:${row.player_id}:${row.slot}`,
    player_id: row.player_id,
    slot: row.slot,
    action: row.action,
    target_id: row.target_id,
    money_spent: row.money_spent,
  }));
  const counts = new Map<string, number>();

  const { data: relationshipRows, error: relationshipRowsError } = await supabase
    .from("relationships")
    .select("room_code, player_a, player_b, level, progress")
    .eq("room_code", room.code);

  if (relationshipRowsError) {
    throw relationshipRowsError;
  }

  for (const row of dayActions) {
    counts.set(row.player_id, (counts.get(row.player_id) || 0) + 1);
  }

  const activePlayers = players.filter((player) => !player.eliminated);
  const allActivePlayersSubmitted = activePlayers.every(
    (player) => (counts.get(player.id) || 0) >= DAY_SLOTS.length
  );
  const timedOut = isDayExpired(room.updated_at);
  const autoFilledPlayerIds = new Set<string>();

  if (!allActivePlayersSubmitted && !timedOut) {
    return {
      room,
      players,
      resolved: false,
      allResolutions: null,
      currentResolution: null,
    };
  }

  if (timedOut && !allActivePlayersSubmitted) {
    const autofillRows = buildAutofillRows({ room, players, dayActions });

    for (const row of autofillRows) {
      autoFilledPlayerIds.add(row.player_id);
    }

    if (autofillRows.length > 0) {
      const { error: autofillError } = await supabase
        .from("day_actions")
        .upsert(autofillRows, { onConflict: "room_code,day,slot,player_id" });

      if (autofillError) {
        throw autofillError;
      }

      dayActions = [
        ...dayActions,
        ...autofillRows.map((row) => ({
          id: `autofill:${row.player_id}:${row.slot}`,
          player_id: row.player_id,
          slot: row.slot,
          action: row.action,
          target_id: row.target_id,
          money_spent: row.money_spent,
        })),
      ];
    }
  }

  const currentWeek = Math.floor((room.current_day - 1) / 7) + 1;
  const weekStartDay = (currentWeek - 1) * 7 + 1;

  const { data: weeklyActionHistory, error: weeklyHistoryError } = await supabase
    .from("day_actions")
    .select("player_id, action, day, slot")
    .eq("room_code", room.code)
    .gte("day", weekStartDay)
    .lt("day", room.current_day);

  if (weeklyHistoryError) {
    throw weeklyHistoryError;
  }

  const resolvedDay = resolveDayForRoom({
    roomCode: room.code,
    currentDay: room.current_day,
    players,
    dayActions,
    weeklyActionHistory: weeklyActionHistory || [],
    relationshipRows: (relationshipRows || []) as RelationshipRow[],
  });

  resolvedDay.resolutions = resolvedDay.resolutions.map((resolution) => ({
    ...resolution,
    changes: {
      ...resolution.changes,
      autoFilled: autoFilledPlayerIds.has(resolution.player_id),
    },
  }));

  const { error: actionResolveError } = await supabase
    .from("day_actions")
    .upsert(resolvedDay.resolvedActionRows, {
      onConflict: "room_code,day,slot,player_id",
    });

  if (actionResolveError) {
    throw actionResolveError;
  }

  const { error: resolutionError } = await supabase
    .from("resolutions")
    .upsert(resolvedDay.resolutions, { onConflict: "room_code,day,player_id" });

  if (resolutionError) {
    throw resolutionError;
  }

  if (resolvedDay.relationshipUpdates.length > 0) {
    const { error: relationshipUpdateError } = await supabase
      .from("relationships")
      .upsert(resolvedDay.relationshipUpdates, {
        onConflict: "room_code,player_a,player_b",
      });

    if (relationshipUpdateError) {
      throw relationshipUpdateError;
    }
  }

  for (const playerUpdate of resolvedDay.playerUpdates) {
    const { error: playerUpdateError } = await supabase
      .from("players")
      .update({
        academics: playerUpdate.academics,
        social: playerUpdate.social,
        wellbeing: playerUpdate.wellbeing,
        money: playerUpdate.money,
        eliminated: playerUpdate.eliminated,
      })
      .eq("id", playerUpdate.playerId)
      .eq("room_code", room.code);

    if (playerUpdateError) {
      throw playerUpdateError;
    }
  }

  const { data: resolutionRoom, error: updateError } = await supabase
    .from("rooms")
    .update({
      current_phase: "resolution",
      status: "resolution",
      updated_at: new Date().toISOString(),
    })
    .eq("code", room.code)
    .select("code, current_day, current_phase, status, updated_at")
    .single();

  if (updateError || !resolutionRoom) {
    throw updateError || new Error("Failed to advance room");
  }

  const updatedPlayers = players.map((player) => {
    const update = resolvedDay.playerUpdates.find(
      (playerUpdate) => playerUpdate.playerId === player.id
    );

    if (!update) {
      return player;
    }

    return {
      ...player,
      academics: update.academics,
      social: update.social,
      wellbeing: update.wellbeing,
      money: update.money,
      eliminated: update.eliminated,
    };
  });

  return {
    room: resolutionRoom,
    players: updatedPlayers,
    resolved: true,
    allResolutions: resolvedDay.resolutions,
    currentResolution:
      resolvedDay.resolutions.find((resolution) => resolution.player_id === playerId) ?? null,
  };
}
