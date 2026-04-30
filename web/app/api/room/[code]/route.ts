import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { loadRoomDayState } from "@/utils/room-day-state";

const ALLOWED_PHASES = new Set([
  "lobby",
  "setup",
  "day",
  "resolution",
  "exam",
  "end",
]);

const ALLOWED_STATUSES = new Set([
  "lobby",
  "setup",
  "day",
  "resolution",
  "exam",
  "end",
]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const url = new URL(request.url);
    const playerId = url.searchParams.get("playerId");
    const supabase = createAdminClient();

    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", code)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const { data: players, error: playersError } = await supabase
      .from("players")
      .select(
        "id, name, major, pos_trait, neg_trait, academics, social, wellbeing, money, class_schedule, eliminated, created_at"
      )
      .eq("room_code", code)
      .order("created_at", { ascending: true });

    if (playersError) {
      return NextResponse.json({ error: "Failed to load players" }, { status: 500 });
    }

    const dayState = await loadRoomDayState(
      supabase,
      code,
      room.current_day,
      players || [],
      playerId
    );

    return NextResponse.json({ room, players: players || [], dayState });
  } catch (err) {
    console.error("GET /api/room/[code] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { playerId, currentPhase, status, currentDay } = await request.json();

    if (!playerId || typeof playerId !== "string") {
      return NextResponse.json({ error: "playerId is required" }, { status: 400 });
    }

    if (!currentPhase || !ALLOWED_PHASES.has(currentPhase)) {
      return NextResponse.json({ error: "Invalid room phase" }, { status: 400 });
    }

    if (status && (!ALLOWED_STATUSES.has(status) || typeof status !== "string")) {
      return NextResponse.json({ error: "Invalid room status" }, { status: 400 });
    }

    if (
      currentDay !== undefined &&
      (typeof currentDay !== "number" || !Number.isInteger(currentDay) || currentDay < 1)
    ) {
      return NextResponse.json({ error: "Invalid current day" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("code, host_id, status, current_phase")
      .eq("code", code)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.host_id !== playerId) {
      return NextResponse.json({ error: "Only the host can update the room" }, { status: 403 });
    }

    const updates: { current_phase: string; status?: string; current_day?: number } = {
      current_phase: currentPhase,
    };

    if (status) {
      updates.status = status;
    }

    if (currentDay !== undefined) {
      updates.current_day = currentDay;
    }

    const { data: updatedRoom, error: updateError } = await supabase
      .from("rooms")
      .update(updates)
      .eq("code", code)
      .select("*")
      .single();

    if (updateError || !updatedRoom) {
      return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
    }

    return NextResponse.json({ room: updatedRoom });
  } catch (err) {
    console.error("PATCH /api/room/[code] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
