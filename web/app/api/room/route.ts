import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  DEBUG_ROOM_CODE,
  buildDebugDummyPlayers,
  isExplicitDebugRoom,
} from "@/utils/debug-room";
import { initializeRoomEventSelections } from "@/utils/event-selection";
import { ensureWildcardDeckForRoom } from "@/utils/wildcard-deck";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function POST(request: Request) {
  try {
    const { name, code: rawClientCode, debugRoom } = await request.json();
    if (!name || typeof name !== "string" || name.length < 1 || name.length > 20) {
      return NextResponse.json({ error: "Name must be 1–20 characters" }, { status: 400 });
    }

    const clientCode =
      typeof rawClientCode === "string" ? rawClientCode.trim().toUpperCase() : null;
    const debugBootstrap =
      typeof clientCode === "string" && isExplicitDebugRoom(clientCode, debugRoom);

    if (clientCode && !debugBootstrap) {
      return NextResponse.json({ error: "Custom room codes are only allowed for debug rooms" }, { status: 400 });
    }

    const supabase = createAdminClient();

    let code = debugBootstrap ? DEBUG_ROOM_CODE : generateCode();

    if (debugBootstrap) {
      // Delete players first to avoid foreign-key issues, then delete room
      await supabase.from("players").delete().eq("room_code", code);
      await supabase.from("rooms").delete().eq("code", code);
    } else {
      let attempts = 0;
      while (attempts < 10) {
        if (code === DEBUG_ROOM_CODE) {
          code = generateCode();
          attempts++;
          continue;
        }

        const { data: existing } = await supabase
          .from("rooms")
          .select("code")
          .eq("code", code)
          .single();
        if (!existing) break;
        code = generateCode();
        attempts++;
      }
    }

    // Create room
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({ code, status: "lobby", current_day: 1, current_phase: "lobby" })
      .select()
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
    }

    // Create host player
    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({ room_code: code, name })
      .select()
      .single();

    if (playerError || !player) {
      return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
    }

    // Set host_id on room and reload final room state
    const { data: updatedRoom, error: hostUpdateError } = await supabase
      .from("rooms")
      .update({ host_id: player.id })
      .eq("code", code)
      .select()
      .single();

    if (hostUpdateError || !updatedRoom) {
      return NextResponse.json({ error: "Failed to assign room host" }, { status: 500 });
    }

    await ensureWildcardDeckForRoom({ supabase, roomCode: code });
    await initializeRoomEventSelections({ supabase, roomCode: code });

    if (debugBootstrap) {
      const { error: dummyInsertError } = await supabase
        .from("players")
        .insert(buildDebugDummyPlayers(code));

      if (dummyInsertError) {
        return NextResponse.json({ error: "Failed to create debug players" }, { status: 500 });
      }
    }

    return NextResponse.json({ room: updatedRoom, player }, { status: 201 });
  } catch (err) {
    console.error("POST /api/room error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
