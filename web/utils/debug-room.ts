import {
  MAJORS,
  NEGATIVE_TRAITS,
  POSITIVE_TRAITS,
  areTraitsCompatible,
} from "@/data/game";
import type { Selection } from "@/utils/day-actions";

export const DEBUG_ROOM_CODE = "TEST";

export type DummyBehavior =
  | "socializeWithYou"
  | "wildcardRestSleep"
  | "randomEachSlot"
  | "goner";

type DummyPlayerDefinition = {
  name: string;
  behavior: DummyBehavior;
  eliminated?: boolean;
  wellbeing?: number;
};

export const DEBUG_DUMMY_PLAYERS: readonly DummyPlayerDefinition[] = [
  { name: "Maya", behavior: "socializeWithYou" },
  { name: "Quinn", behavior: "wildcardRestSleep" },
  { name: "Riley", behavior: "randomEachSlot" },
  { name: "Greg", behavior: "goner", eliminated: true, wellbeing: 0 },
] as const;

function hashString(str: string): number {
  let hash = 0;
  for (let index = 0; index < str.length; index += 1) {
    hash = str.charCodeAt(index) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function generateClassSchedule(roomCode: string, playerKey: string) {
  const days = [0, 1, 2, 3];
  const schedule: Array<{ day: number; slot: "morning" | "afternoon" }> = [];
  const usedDays = new Set<number>();
  let seed = hashString(`${roomCode}:${playerKey}:class-schedule`);

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

function pickCompatibleTraits(seed: number) {
  const posTrait = POSITIVE_TRAITS[seed % POSITIVE_TRAITS.length];

  for (let index = 0; index < NEGATIVE_TRAITS.length; index += 1) {
    const candidate = NEGATIVE_TRAITS[(seed + index) % NEGATIVE_TRAITS.length];
    if (areTraitsCompatible(posTrait, candidate)) {
      return { posTrait, negTrait: candidate };
    }
  }

  return { posTrait, negTrait: NEGATIVE_TRAITS[0] };
}

export function isExplicitDebugRoom(code: string, debugRoom?: boolean) {
  return debugRoom === true && code.toUpperCase() === DEBUG_ROOM_CODE;
}

export function isDebugRoomCode(code: string) {
  return code.toUpperCase() === DEBUG_ROOM_CODE;
}

export function buildDebugDummyPlayers(roomCode: string) {
  return DEBUG_DUMMY_PLAYERS.map((dummy, index) => {
    const seed = hashString(`${roomCode}:${dummy.name}:${index}`);
    const { posTrait, negTrait } = pickCompatibleTraits(seed);

    return {
      room_code: roomCode,
      name: dummy.name,
      major: MAJORS[seed % MAJORS.length],
      pos_trait: posTrait,
      neg_trait: negTrait,
      academics: 2 + ((seed >> 2) % 2),
      social: 2 + ((seed >> 4) % 2),
      wellbeing: dummy.wellbeing ?? 5,
      money: 2 + ((seed >> 6) % 2),
      class_schedule: generateClassSchedule(roomCode, dummy.name),
      eliminated: dummy.eliminated ?? false,
    };
  });
}

export function getDummyBehavior(name: string): DummyBehavior | null {
  return DEBUG_DUMMY_PLAYERS.find((player) => player.name === name)?.behavior ?? null;
}

export function getDummySelection(
  name: string,
  slot: "morning" | "afternoon" | "night",
  roomCode: string,
  hostPlayerId: string | null
): Selection | null {
  const behavior = getDummyBehavior(name);
  if (!behavior) {
    return null;
  }

  if (behavior === "socializeWithYou") {
    return hostPlayerId
      ? { actionId: "socialize", targetId: hostPlayerId, spend: 0 }
      : { actionId: slot === "night" ? "sleep" : "rest" };
  }

  if (behavior === "wildcardRestSleep") {
    if (slot === "morning") return { actionId: "wildcard" };
    if (slot === "afternoon") return { actionId: "rest" };
    return { actionId: "sleep" };
  }

  if (behavior === "goner") {
    return null;
  }

  const randomPools: Record<typeof slot, Selection[]> = {
    morning: [
      { actionId: "study" },
      { actionId: "wildcard" },
      { actionId: "exercise" },
      { actionId: "rest" },
      { actionId: "work" },
      ...(hostPlayerId
        ? [{ actionId: "socialize", targetId: hostPlayerId, spend: 0 as const }]
        : []),
    ],
    afternoon: [
      { actionId: "study" },
      { actionId: "wildcard" },
      { actionId: "exercise" },
      { actionId: "rest" },
      { actionId: "work" },
      ...(hostPlayerId
        ? [{ actionId: "socialize", targetId: hostPlayerId, spend: 0 as const }]
        : []),
    ],
    night: [
      { actionId: "study" },
      { actionId: "wildcard" },
      { actionId: "sleep" },
      { actionId: "work" },
      ...(hostPlayerId
        ? [{ actionId: "socialize", targetId: hostPlayerId, spend: 0 as const }]
        : []),
    ],
  };

  const pool = randomPools[slot];
  return pool[hashString(`${name}:${roomCode}:${slot}`) % pool.length];
}
