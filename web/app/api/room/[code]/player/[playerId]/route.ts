import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { ensureSetupRollsForPlayers } from "@/utils/setup-roll";

type AllocatedStats = {
  academics: number;
  social: number;
  wellbeing: number;
  money: number;
};

function isValidAllocatedStats(value: unknown): value is AllocatedStats {
  if (!value || typeof value !== "object") {
    return false;
  }

  const stats = value as Record<string, unknown>;
  const keys = ["academics", "social", "wellbeing", "money"] as const;

  let total = 0;
  for (const key of keys) {
    const amount = stats[key];
    if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 0) {
      return false;
    }
    total += amount;
  }

  return total === 3;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; playerId: string }> }
) {
  try {
    const { code, playerId } = await params;
    const body = await request.json();
    const { allocatedStats } = body;

    if (!isValidAllocatedStats(allocatedStats)) {
      return NextResponse.json(
        { error: "Allocated stats must be non-negative integers totaling 3" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, room_code, major, pos_trait, neg_trait, class_schedule")
      .eq("id", playerId)
      .eq("room_code", code)
      .single();

    if (playerError || !player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const [rolledPlayer] = await ensureSetupRollsForPlayers({
      supabase,
      roomCode: code,
      players: [player],
    });

    const { data: updatedPlayer, error: updateError } = await supabase
      .from("players")
      .update({
        major: rolledPlayer.major,
        pos_trait: rolledPlayer.pos_trait,
        neg_trait: rolledPlayer.neg_trait,
        academics: 2 + allocatedStats.academics,
        social: 2 + allocatedStats.social,
        wellbeing: 5 + allocatedStats.wellbeing,
        money: 2 + allocatedStats.money,
        class_schedule: rolledPlayer.class_schedule,
      })
      .eq("id", playerId)
      .eq("room_code", code)
      .select("*")
      .single();

    if (updateError || !updatedPlayer) {
      return NextResponse.json({ error: "Failed to save setup" }, { status: 500 });
    }

    return NextResponse.json({ player: updatedPlayer });
  } catch (err) {
    console.error("PATCH /api/room/[code]/player/[playerId] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
