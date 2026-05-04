import type { SupabaseClient } from "@supabase/supabase-js";
import type { WildcardCard, WildcardStat } from "@/data/wildcards";

export type WildcardDeckRow = {
  room_code: string;
  draw_pile: string[];
  discard_pile: string[];
};

function shuffle<T>(items: T[]) {
  const output = [...items];

  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }

  return output;
}

export async function loadWildcardDefs(supabase: SupabaseClient): Promise<WildcardCard[]> {
  const { data, error } = await supabase
    .from("wildcard_defs")
    .select("id, tier, type, title, emoji, description, effect_summary, duration, target_stats, immediate, future, metadata");

  if (error || !data) {
    throw error || new Error("Failed to load wildcard definitions");
  }

  return data.map((row) => ({
    id: row.id as string,
    tier: row.tier as WildcardCard["tier"],
    type: row.type as WildcardCard["type"],
    title: row.title as string,
    emoji: row.emoji as string,
    description: row.description as string,
    effectSummary: row.effect_summary as string,
    duration: row.duration as WildcardCard["duration"],
    targetStats: Array.isArray(row.target_stats) ? (row.target_stats as WildcardStat[]) : [],
    immediate: (row.immediate as Record<string, number>) || {},
    future: (row.future as WildcardCard["future"]) || null,
  }));
}

export async function buildShuffledWildcardDeck(supabase: SupabaseClient) {
  const defs = await loadWildcardDefs(supabase);
  return shuffle(defs.map((card) => card.id));
}

export async function getWildcardCardById(supabase: SupabaseClient, cardId: string): Promise<WildcardCard | null> {
  const { data, error } = await supabase
    .from("wildcard_defs")
    .select("id, tier, type, title, emoji, description, effect_summary, duration, target_stats, immediate, future, metadata")
    .eq("id", cardId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id as string,
    tier: data.tier as WildcardCard["tier"],
    type: data.type as WildcardCard["type"],
    title: data.title as string,
    emoji: data.emoji as string,
    description: data.description as string,
    effectSummary: data.effect_summary as string,
    duration: data.duration as WildcardCard["duration"],
    targetStats: Array.isArray(data.target_stats) ? (data.target_stats as WildcardStat[]) : [],
    immediate: (data.immediate as Record<string, number>) || {},
    future: (data.future as WildcardCard["future"]) || null,
  };
}

export async function ensureWildcardDeckForRoom({
  supabase,
  roomCode,
}: {
  supabase: SupabaseClient;
  roomCode: string;
}): Promise<{ room_code: string } | null> {
  try {
    const { data: existingDeck, error: existingDeckError } = await supabase
      .from("wildcard_decks")
      .select("room_code")
      .eq("room_code", roomCode)
      .maybeSingle();

    if (existingDeckError) {
      console.warn("ensureWildcardDeckForRoom: query failed, table may not exist yet:", existingDeckError.message);
      return null;
    }

    if (existingDeck) {
      return existingDeck;
    }

    const drawPile = await buildShuffledWildcardDeck(supabase);

    const { data: deck, error: deckError } = await supabase
      .from("wildcard_decks")
      .insert({
        room_code: roomCode,
        draw_pile: drawPile,
        discard_pile: [],
      })
      .select("room_code")
      .single();

    if (deckError) {
      console.warn("ensureWildcardDeckForRoom: insert failed, table may not exist yet:", deckError.message);
      return null;
    }

    if (!deck) {
      return null;
    }

    return deck;
  } catch (err) {
    console.warn("ensureWildcardDeckForRoom: unexpected error, table may not exist yet:", err instanceof Error ? err.message : err);
    return null;
  }
}

function normalizeDeckRow(row: {
  room_code: string;
  draw_pile: unknown;
  discard_pile: unknown;
}): WildcardDeckRow {
  return {
    room_code: row.room_code,
    draw_pile: Array.isArray(row.draw_pile) ? (row.draw_pile as string[]) : [],
    discard_pile: Array.isArray(row.discard_pile) ? (row.discard_pile as string[]) : [],
  };
}

export async function loadWildcardDeckForRoom({
  supabase,
  roomCode,
}: {
  supabase: SupabaseClient;
  roomCode: string;
}) {
  await ensureWildcardDeckForRoom({ supabase, roomCode });

  const { data, error } = await supabase
    .from("wildcard_decks")
    .select("room_code, draw_pile, discard_pile")
    .eq("room_code", roomCode)
    .single();

  if (error || !data) {
    throw error || new Error("Failed to load wildcard deck");
  }

  return normalizeDeckRow(data);
}

export async function drawWildcardCardsFromDeck({
  supabase,
  deck,
  count,
}: {
  supabase: SupabaseClient;
  deck: WildcardDeckRow;
  count: number;
}): Promise<{
  drawnCards: WildcardCard[];
  nextDeck: WildcardDeckRow;
}> {
  let drawPile = [...deck.draw_pile];
  let discardPile = [...deck.discard_pile];
  const drawnCards: WildcardCard[] = [];

  while (drawnCards.length < count) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) {
        throw new Error("Wildcard deck is empty and cannot be reshuffled");
      }

      drawPile = shuffle(discardPile);
      discardPile = [];
    }

    const nextCardId = drawPile.shift();
    if (!nextCardId) {
      throw new Error("Failed to draw wildcard card");
    }

    const card = await getWildcardCardById(supabase, nextCardId);
    if (!card) {
      throw new Error(`Unknown wildcard card id: ${nextCardId}`);
    }

    drawnCards.push(card);
    discardPile.push(nextCardId);
  }

  return {
    drawnCards,
    nextDeck: {
      room_code: deck.room_code,
      draw_pile: drawPile,
      discard_pile: discardPile,
    },
  };
}

export async function saveWildcardDeckForRoom({
  supabase,
  deck,
}: {
  supabase: SupabaseClient;
  deck: WildcardDeckRow;
}) {
  const { error } = await supabase
    .from("wildcard_decks")
    .update({
      draw_pile: deck.draw_pile,
      discard_pile: deck.discard_pile,
      updated_at: new Date().toISOString(),
    })
    .eq("room_code", deck.room_code);

  if (error) {
    throw error;
  }
}
