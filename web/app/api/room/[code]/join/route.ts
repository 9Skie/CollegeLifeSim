import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { name } = await request.json();

    if (!name || typeof name !== "string" || name.length < 1 || name.length > 20) {
      return NextResponse.json({ error: "Name must be 1–20 characters" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check room exists and is in lobby
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("status")
      .eq("code", code)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.status !== "lobby") {
      return NextResponse.json({ error: "Game already started" }, { status: 403 });
    }

    // Check player count
    const { count, error: countError } = await supabase
      .from("players")
      .select("*", { count: "exact", head: true })
      .eq("room_code", code);

    if (countError) {
      return NextResponse.json({ error: "Failed to check room capacity" }, { status: 500 });
    }

    if ((count || 0) >= 12) {
      return NextResponse.json({ error: "Room is full (max 12 players)" }, { status: 403 });
    }

    // Create player
    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({ room_code: code, name })
      .select()
      .single();

    if (playerError || !player) {
      return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
    }

    return NextResponse.json({ player }, { status: 201 });
  } catch (err) {
    console.error("POST /api/room/[code]/join error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
