import type { SupabaseClient } from "@supabase/supabase-js";
import type { WildcardFutureEffect, WildcardActionType } from "@/data/wildcards";

export type StoredWildcardEffect = {
  id: string;
  room_code: string;
  player_id: string;
  effect: WildcardFutureEffect;
  consumed: boolean;
  created_at: string;
};

export async function saveWildcardEffects({
  supabase,
  roomCode,
  playerId,
  effects,
}: {
  supabase: SupabaseClient;
  roomCode: string;
  playerId: string;
  effects: WildcardFutureEffect[];
}) {
  if (effects.length === 0) {
    return;
  }

  const rows = effects.map((effect) => ({
    room_code: roomCode,
    player_id: playerId,
    effect,
  }));

  const { error } = await supabase.from("player_wildcard_effects").insert(rows);

  if (error) {
    throw error;
  }
}

export async function loadPendingEffects({
  supabase,
  roomCode,
  playerId,
}: {
  supabase: SupabaseClient;
  roomCode: string;
  playerId: string;
}): Promise<StoredWildcardEffect[]> {
  const { data, error } = await supabase
    .from("player_wildcard_effects")
    .select("id, room_code, player_id, effect, consumed, created_at")
    .eq("room_code", roomCode)
    .eq("player_id", playerId)
    .eq("consumed", false)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as StoredWildcardEffect[];
}

export async function consumeEffect({
  supabase,
  effectId,
}: {
  supabase: SupabaseClient;
  effectId: string;
}) {
  const { error } = await supabase
    .from("player_wildcard_effects")
    .update({ consumed: true })
    .eq("id", effectId);

  if (error) {
    throw error;
  }
}

export async function consumeEffectsBulk({
  supabase,
  effectIds,
}: {
  supabase: SupabaseClient;
  effectIds: string[];
}) {
  if (effectIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("player_wildcard_effects")
    .update({ consumed: true })
    .in("id", effectIds);

  if (error) {
    throw error;
  }
}

export function matchActionBonus(
  effect: WildcardFutureEffect,
  actionId: string | null
) {
  if (effect.kind !== "action_bonus") {
    return false;
  }

  if (!actionId) {
    return false;
  }

  const actionMap: Record<WildcardActionType, string[]> = {
    class: ["class"],
    study: ["study"],
    work: ["work"],
    exercise: ["exercise"],
    socialize: ["socialize"],
    rest: ["rest"],
    sleep: ["sleep"],
    wildcard: ["wildcard"],
    rest_or_sleep: ["rest", "sleep"],
    any: [],
  };

  const matchedActions = actionMap[effect.action] ?? [];
  if (matchedActions.length === 0) {
    return false;
  }

  return matchedActions.includes(actionId);
}