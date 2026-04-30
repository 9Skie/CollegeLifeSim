import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  MAJORS,
  NEGATIVE_TRAITS,
  POSITIVE_TRAITS,
} from "@/data/game";

type AllocatedStats = {
  academics: number;
  social: number;
  wellbeing: number;
  money: number;
};

type ClassSlot = "morning" | "afternoon";

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function isValidChoice(value: unknown, choices: readonly string[]) {
  return typeof value === "string" && choices.includes(value);
}

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

function generateClassSchedule(roomCode: string, playerId: string) {
  const days = [0, 1, 2, 3];
  const schedule: Array<{ day: number; slot: ClassSlot }> = [];
  const usedDays = new Set<number>();
  let seed = hashString(`${roomCode}:${playerId}:class-schedule`);

  while (schedule.length < 3 && usedDays.size < days.length) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const day = days[seed % days.length];
    if (usedDays.has(day)) {
      continue;
    }

    usedDays.add(day);
    schedule.push({
      day,
      slot: seed % 2 === 0 ? "morning" : "afternoon",
    });
  }

  return schedule;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; playerId: string }> }
) {
  try {
    const { code, playerId } = await params;
    const body = await request.json();
    const { major, posTrait, negTrait, allocatedStats } = body;

    if (!isValidChoice(major, MAJORS)) {
      return NextResponse.json({ error: "Invalid major" }, { status: 400 });
    }

    if (!isValidChoice(posTrait, POSITIVE_TRAITS)) {
      return NextResponse.json({ error: "Invalid positive trait" }, { status: 400 });
    }

    if (!isValidChoice(negTrait, NEGATIVE_TRAITS)) {
      return NextResponse.json({ error: "Invalid negative trait" }, { status: 400 });
    }

    if (!isValidAllocatedStats(allocatedStats)) {
      return NextResponse.json(
        { error: "Allocated stats must be non-negative integers totaling 3" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, room_code, class_schedule")
      .eq("id", playerId)
      .eq("room_code", code)
      .single();

    if (playerError || !player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const existingSchedule = Array.isArray(player.class_schedule)
      ? player.class_schedule
      : [];
    const classSchedule =
      existingSchedule.length > 0
        ? existingSchedule
        : generateClassSchedule(code, playerId);

    const { data: updatedPlayer, error: updateError } = await supabase
      .from("players")
      .update({
        major,
        pos_trait: posTrait,
        neg_trait: negTrait,
        academics: 1 + allocatedStats.academics,
        social: 1 + allocatedStats.social,
        wellbeing: 5 + allocatedStats.wellbeing,
        money: 2 + allocatedStats.money,
        class_schedule: classSchedule,
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
