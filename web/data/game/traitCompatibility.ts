const INCOMPATIBLE_TRAIT_PAIRS: Record<string, string[]> = {
  Disciplined: ["Scattered"],
  Socialite: ["Withdrawn"],
  Frugal: ["Spendthrift"],
  Centered: ["Tense"],
  Bookworm: ["Distracted"],
  Curious: ["Drained"],
  Prepared: ["Sleepy"],
  Likeable: ["Quiet"],
  Hustler: ["Sloppy"],
  Courteous: ["Rude"],
  Athletic: ["Stiff"],
  Upbeat: ["Flat"],
  Rested: ["Restless"],
  Sleeper: ["Insomniac"],
  Reflective: ["Ruminating"],
  Dreamer: ["Groggy"],
  Charismatic: ["Shy"],
  Warm: ["Hollow"],
  Thrifty: ["Pricey"],
  Friendly: ["Loner"],
  Calm: ["Brittle"],
  Cheerful: ["FOMO"],
  Helpful: ["Frazzled"],
  Steady: ["Burned Out"],
  "Clear-Headed": ["Foggy"],
};

export function areTraitsCompatible(
  posTrait: string | null | undefined,
  negTrait: string | null | undefined
) {
  if (!posTrait || !negTrait) {
    return true;
  }

  return !(INCOMPATIBLE_TRAIT_PAIRS[posTrait] || []).includes(negTrait);
}

export function getCompatibleNegativeTraits(
  posTrait: string | null | undefined,
  negativeTraits: readonly string[]
) {
  return negativeTraits.filter((negTrait) => areTraitsCompatible(posTrait, negTrait));
}
