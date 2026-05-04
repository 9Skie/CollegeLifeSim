import type { SupabaseClient } from "@supabase/supabase-js";
import { wildcardCards, type WildcardCard } from "@/data/wildcards";

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

export function buildShuffledWildcardDeck() {
  return shuffle(wildcardCards.map((card) => card.id));
}

export function getWildcardCardById(cardId: string) {
  return wildcardCards.find((card) => card.id === cardId) ?? null;
}

export async function ensureWildcardDeckForRoom({
  supabase,
  roomCode,
}: {
  supabase: SupabaseClient;
  roomCode: string;
}) {
  const { data: existingDeck, error: existingDeckError } = await supabase
    .from("wildcard_decks")
    .select("room_code")
    .eq("room_code", roomCode)
    .maybeSingle();

  if (existingDeckError) {
    throw existingDeckError;
  }

  if (existingDeck) {
    return existingDeck;
  }

  const { data: deck, error: deckError } = await supabase
    .from("wildcard_decks")
    .insert({
      room_code: roomCode,
      draw_pile: buildShuffledWildcardDeck(),
      discard_pile: [],
    })
    .select("room_code")
    .single();

  if (deckError || !deck) {
    throw deckError || new Error("Failed to initialize wildcard deck");
  }

  return deck;
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

export function drawWildcardCardsFromDeck({
  deck,
  count,
}: {
  deck: WildcardDeckRow;
  count: number;
}): {
  drawnCards: WildcardCard[];
  nextDeck: WildcardDeckRow;
} {
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

    const card = getWildcardCardById(nextCardId);
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
