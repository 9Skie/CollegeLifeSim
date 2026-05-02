import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { resolveExamForRoom } from "@/utils/exam-resolution";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { playerId } = body as { playerId?: string };

    if (!playerId || typeof playerId !== "string") {
      return NextResponse.json({ error: "playerId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("code, current_day, current_phase, host_id")
      .eq("code", code)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.host_id !== playerId) {
      return NextResponse.json({ error: "Only the host can resolve the exam" }, { status: 403 });
    }

    if (room.current_phase !== "exam") {
      return NextResponse.json({ error: "Room is not in exam phase" }, { status: 403 });
    }

    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, name, academics, wellbeing, eliminated")
      .eq("room_code", code);

    if (playersError || !players) {
      return NextResponse.json({ error: "Failed to load players" }, { status: 500 });
    }

    const { results, playerUpdates } = resolveExamForRoom({
      currentDay: room.current_day,
      players: players,
    });

    // Update player stats
    for (const update of playerUpdates) {
      const { error: updateError } = await supabase
        .from("players")
        .update({
          academics: update.academics,
          wellbeing: update.wellbeing,
          eliminated: update.eliminated,
        })
        .eq("id", update.playerId)
        .eq("room_code", code);

      if (updateError) {
        return NextResponse.json({ error: "Failed to update player stats" }, { status: 500 });
      }
    }

    // Advance room: midterm → next day, final → end
    const isFinal = room.current_day >= 19;
    const nextPhase = isFinal ? "end" : "day";
    const nextStatus = isFinal ? "end" : "day";
    const nextDay = isFinal ? room.current_day : room.current_day + 1;

    const { data: updatedRoom, error: updateError } = await supabase
      .from("rooms")
      .update({
        current_phase: nextPhase,
        status: nextStatus,
        updated_at: new Date().toISOString(),
        ...(isFinal ? {} : { current_day: nextDay }),
      })
      .eq("code", code)
      .select("code, current_day, current_phase, status")
      .single();

    if (updateError || !updatedRoom) {
      return NextResponse.json({ error: "Failed to advance room" }, { status: 500 });
    }

    const { data: updatedPlayers, error: updatedPlayersError } = await supabase
      .from("players")
      .select("id, name, academics, social, wellbeing, money, eliminated")
      .eq("room_code", code);

    if (updatedPlayersError) {
      return NextResponse.json({ error: "Failed to load updated players" }, { status: 500 });
    }

    return NextResponse.json({ room: updatedRoom, results, players: updatedPlayers || [] });
  } catch (err) {
    console.error("POST /api/room/[code]/exam error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
