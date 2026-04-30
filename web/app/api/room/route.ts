import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { DUMMY_PLAYERS, getDummyState } from "@/app/room/[code]/dummyPlayers";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DEBUG_ROOM_CODE = process.env.CLS_DEBUG_ROOM_CODE?.trim().toUpperCase() ?? "";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function getFixedDebugRoomCode() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return /^[A-Z]{4}$/.test(DEBUG_ROOM_CODE) ? DEBUG_ROOM_CODE : null;
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== "string" || name.length < 1 || name.length > 20) {
      return NextResponse.json({ error: "Name must be 1–20 characters" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const fixedDebugRoomCode = getFixedDebugRoomCode();

    // Generate unique code, or reuse a fixed local debug code.
    let code = fixedDebugRoomCode || generateCode();

    if (fixedDebugRoomCode) {
      const { error: deleteError } = await supabase
        .from("rooms")
        .delete()
        .eq("code", fixedDebugRoomCode);

      if (deleteError) {
        return NextResponse.json({ error: "Failed to reset debug room" }, { status: 500 });
      }
    } else {
      let attempts = 0;
      while (attempts < 10) {
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

    // Set host_id on room
    await supabase.from("rooms").update({ host_id: player.id }).eq("code", code);

    if (fixedDebugRoomCode) {
      const dummyPlayers = DUMMY_PLAYERS.filter((dummy) => dummy.name !== name).map(
        (dummy) => {
          const state = getDummyState(dummy.name);
          return {
            room_code: code,
            name: dummy.name,
            eliminated: state?.eliminated ?? false,
            wellbeing: state?.wellbeing ?? 5,
          };
        }
      );

      if (dummyPlayers.length > 0) {
        const { error: dummyError } = await supabase
          .from("players")
          .insert(dummyPlayers);

        if (dummyError) {
          return NextResponse.json(
            { error: "Failed to create debug dummy players" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ room, player }, { status: 201 });
  } catch (err) {
    console.error("POST /api/room error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
