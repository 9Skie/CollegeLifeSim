const INCOMPATIBLE_TRAIT_PAIRS: Record<string, string[]> = {
  Charismatic: ["Loner"],
  Networker: ["Loner"],
  Influencer: ["Loner"],
  Charmer: ["Loner"],
  Athletic: ["Couch Potato"],
  "Gym Rat": ["Couch Potato"],
  Disciplined: ["Procrastinator"],
  "Study Buddy": ["Procrastinator"],
  "Trust Fund Kid": ["Broke Family"],
  "Calm Sleeper": ["Insomniac"],
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
