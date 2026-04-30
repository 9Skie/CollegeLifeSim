import type { Selection } from "./ActionPicker";

export type DummyBehavior =
  | "socializeWithYou"
  | "wildcardRestSleep"
  | "randomEachSlot"
  | "goner";

export type DummyPlayerState = {
  eliminated?: boolean;
  wellbeing?: number;
};

type DummyPlayerDefinition = {
  name: string;
  behavior: DummyBehavior;
  state?: DummyPlayerState;
};

export const DUMMY_PLAYERS: readonly DummyPlayerDefinition[] = [
  { name: "Maya", behavior: "socializeWithYou" },
  { name: "Quinn", behavior: "wildcardRestSleep" },
  { name: "Riley", behavior: "randomEachSlot" },
  {
    name: "Greg",
    behavior: "goner",
    state: { eliminated: true, wellbeing: 0 },
  },
] as const;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getDummyBehavior(name: string): DummyBehavior | null {
  return DUMMY_PLAYERS.find((player) => player.name === name)?.behavior ?? null;
}

export function getDummyState(name: string): DummyPlayerState | null {
  return DUMMY_PLAYERS.find((player) => player.name === name)?.state ?? null;
}

export function getDummySelection(
  name: string,
  slot: "morning" | "afternoon" | "night",
  roomCode: string,
  myPlayerId: string | null
): Selection | null {
  const behavior = getDummyBehavior(name);
  if (!behavior) {
    return null;
  }

  if (behavior === "socializeWithYou") {
    return myPlayerId
      ? { actionId: "socialize", targetId: myPlayerId, spend: 0 }
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
      ...(myPlayerId
        ? [{ actionId: "socialize", targetId: myPlayerId, spend: 0 as const }]
        : []),
    ],
    afternoon: [
      { actionId: "study" },
      { actionId: "wildcard" },
      { actionId: "exercise" },
      { actionId: "rest" },
      { actionId: "work" },
      ...(myPlayerId
        ? [{ actionId: "socialize", targetId: myPlayerId, spend: 0 as const }]
        : []),
    ],
    night: [
      { actionId: "study" },
      { actionId: "wildcard" },
      { actionId: "sleep" },
      { actionId: "work" },
      ...(myPlayerId
        ? [{ actionId: "socialize", targetId: myPlayerId, spend: 0 as const }]
        : []),
    ],
  };

  const pool = randomPools[slot];
  return pool[hashString(`${name}:${roomCode}:${slot}`) % pool.length];
}
