const INCOMPATIBLE_TRAIT_PAIRS: Record<string, string[]> = {
  "Charismatic": ["Loner", "Anxious"],
  "Networker": ["Loner"],
  "Influencer": ["Loner"],
  "Charmer": ["Loner", "Penny-Wise"],
  "Athletic": ["Couch Potato", "Allergic"],
  "Gym Rat": ["Couch Potato", "Allergic"],
  "Disciplined": ["Procrastinator", "Distracted"],
  "Quick Study": ["Procrastinator", "Distracted"],
  "Bookworm": ["Procrastinator", "Distracted"],
  "Study Buddy": ["Procrastinator", "Distracted"],
  "Professor's Favorite": ["Distracted"],
  "Trust Fund Kid": ["Broke Family"],
  "Coupon Clipper": ["Spendthrift"],
  "Self Care": ["Sickly"],
  "Resilient": ["Sickly"],
  "Optimist": ["Pessimist"],
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
