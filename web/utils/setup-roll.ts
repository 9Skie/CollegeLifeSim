import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MAJORS,
  NEGATIVE_TRAITS,
  POSITIVE_TRAITS,
  getCompatibleNegativeTraits,
} from "@/data/game";

type ClassSlot = "morning" | "afternoon";

type PlayerSetupState = {
  id: string;
  room_code?: string | null;
  major?: string | null;
  pos_trait?: string | null;
  neg_trait?: string | null;
  class_schedule?: Array<{ day: number; slot: ClassSlot }> | null;
};

function pickRandom<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function generateClassSchedule() {
  const days = [0, 1, 2, 3];
  const shuffledDays = [...days];

  for (let index = shuffledDays.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledDays[index], shuffledDays[swapIndex]] = [
      shuffledDays[swapIndex],
      shuffledDays[index],
    ];
  }

  return shuffledDays.slice(0, 3).map((day) => ({
    day,
    slot: (Math.random() < 0.5 ? "morning" : "afternoon") as ClassSlot,
  }));
}

function buildSetupRoll() {
  const major = pickRandom(MAJORS);
  const posTrait = pickRandom(POSITIVE_TRAITS);
  const compatibleNegativeTraits = getCompatibleNegativeTraits(posTrait, NEGATIVE_TRAITS);
  const negTrait = pickRandom(compatibleNegativeTraits);

  return {
    major,
    pos_trait: posTrait,
    neg_trait: negTrait,
    class_schedule: generateClassSchedule(),
  };
}

function isSetupRollComplete(player: PlayerSetupState) {
  return Boolean(
    player.major &&
      player.pos_trait &&
      player.neg_trait &&
      Array.isArray(player.class_schedule) &&
      player.class_schedule.length > 0
  );
}

export async function ensureSetupRollsForPlayers({
  supabase,
  roomCode,
  players,
}: {
  supabase: SupabaseClient;
  roomCode: string;
  players: PlayerSetupState[];
}) {
  const updatedPlayers = [...players];

  for (let index = 0; index < updatedPlayers.length; index += 1) {
    const player = updatedPlayers[index];
    if (isSetupRollComplete(player)) {
      continue;
    }

    const { data: updatedPlayer, error } = await supabase
      .from("players")
      .update(buildSetupRoll())
      .eq("id", player.id)
      .eq("room_code", roomCode)
      .select(
        "id, room_code, name, major, pos_trait, neg_trait, academics, social, wellbeing, money, class_schedule, eliminated, created_at"
      )
      .single();

    if (error || !updatedPlayer) {
      throw error || new Error("Failed to assign setup roll");
    }

    updatedPlayers[index] = updatedPlayer as PlayerSetupState;
  }

  return updatedPlayers;
}
