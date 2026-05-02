import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  DAY_SLOTS,
  getMoneySpentFromSelection,
  isSelectionRecord,
  type SelectionRecord,
} from "@/utils/day-actions";
import { getDummyBehavior, getDummySelection, isDebugRoomCode } from "@/utils/debug-room";
import { ensureDayPhaseResolved } from "@/utils/day-phase";
import { loadRoomDayState } from "@/utils/room-day-state";

const ALLOWED_ACTIONS = new Set([
  "class",
  "study",
  "work",
  "exercise",
  "socialize",
  "rest",
  "sleep",
  "wildcard",
]);

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { playerId, selections } = body as {
      playerId?: string;
      selections?: SelectionRecord;
    };

    if (!playerId || typeof playerId !== "string") {
      return NextResponse.json({ error: "playerId is required" }, { status: 400 });
    }

    if (!isSelectionRecord(selections)) {
      return NextResponse.json({ error: "Invalid day selections" }, { status: 400 });
    }

    if (DAY_SLOTS.some((slot) => !selections[slot])) {
      return NextResponse.json({ error: "All 3 slots must be selected" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("code, current_day, current_phase, status, updated_at")
      .eq("code", code)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.current_phase !== "day") {
      return NextResponse.json({ error: "Room is not accepting day actions" }, { status: 403 });
    }

    const { data: players, error: playersError } = await supabase
      .from("players")
      .select(
        "id, name, major, pos_trait, neg_trait, academics, social, wellbeing, money, class_schedule, eliminated"
      )
      .eq("room_code", code);

    if (playersError || !players) {
      return NextResponse.json({ error: "Failed to load players" }, { status: 500 });
    }

    const roomPlayers = players as RoomPlayer[];

    const preSubmitResolution = await ensureDayPhaseResolved({
      supabase,
      room,
      players: roomPlayers,
      playerId,
    });

    if (preSubmitResolution.room.current_phase !== "day") {
      const resolvedDayState = await loadRoomDayState(
        supabase,
        code,
        preSubmitResolution.room.current_day,
        preSubmitResolution.room.current_phase,
        preSubmitResolution.room.updated_at,
        preSubmitResolution.players,
        playerId
      );

      return NextResponse.json({
        room: preSubmitResolution.room,
        dayState: resolvedDayState,
        currentResolution: preSubmitResolution.currentResolution,
      });
    }

    const submittingPlayer = roomPlayers.find((player) => player.id === playerId);

    if (!submittingPlayer) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (submittingPlayer.eliminated) {
      return NextResponse.json(
        { error: "Eliminated players cannot submit actions" },
        { status: 403 }
      );
    }

    const activePlayerIds = new Set(
      roomPlayers.filter((player) => !player.eliminated).map((player) => player.id)
    );

    for (const slot of DAY_SLOTS) {
      const selection = selections[slot];
      if (!selection) {
        continue;
      }

      if (!ALLOWED_ACTIONS.has(selection.actionId)) {
        return NextResponse.json({ error: "Invalid action selection" }, { status: 400 });
      }

      if (selection.targetId) {
        if (!activePlayerIds.has(selection.targetId) || selection.targetId === playerId) {
          return NextResponse.json({ error: "Invalid target selection" }, { status: 400 });
        }
      }
    }

    const playerRows = DAY_SLOTS.map((slot) => {
      const selection = selections[slot]!;
      return {
        room_code: code,
        day: room.current_day,
        slot,
        player_id: playerId,
        action: selection.actionId,
        target_id: selection.targetId ?? null,
        money_spent: getMoneySpentFromSelection(selection),
      };
    });

    const dummyRows = !isDebugRoomCode(code)
      ? []
      : roomPlayers.flatMap((player) => {
      if (player.id === playerId || player.eliminated || !getDummyBehavior(player.name)) {
        return [];
      }

      return DAY_SLOTS.flatMap((slot) => {
        const selection = getDummySelection(player.name, slot, code, playerId);
        if (!selection) {
          return [];
        }

        if (!ALLOWED_ACTIONS.has(selection.actionId)) {
          return [];
        }

        return {
          room_code: code,
          day: room.current_day,
          slot,
          player_id: player.id,
          action: selection.actionId,
          target_id: selection.targetId ?? null,
          money_spent: getMoneySpentFromSelection(selection),
        };
      });
    });

    const allRows = [...playerRows, ...dummyRows];

    const { error: upsertError } = await supabase
      .from("day_actions")
      .upsert(allRows, { onConflict: "room_code,day,slot,player_id" });

    if (upsertError) {
      return NextResponse.json({ error: "Failed to save day actions" }, { status: 500 });
    }

    const dayState = await loadRoomDayState(
      supabase,
      code,
      room.current_day,
      room.current_phase,
      room.updated_at,
      roomPlayers,
      playerId
    );

    const ensuredDay = await ensureDayPhaseResolved({
      supabase,
      room,
      players: roomPlayers,
      playerId,
    });

    const updatedDayState = await loadRoomDayState(
      supabase,
      code,
      ensuredDay.room.current_day,
      ensuredDay.room.current_phase,
      ensuredDay.room.updated_at,
      ensuredDay.players,
      playerId
    );

    return NextResponse.json({
      room: ensuredDay.room,
      dayState: updatedDayState,
      currentResolution: ensuredDay.currentResolution,
    });
  } catch (err) {
    console.error("POST /api/room/[code]/day-actions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
