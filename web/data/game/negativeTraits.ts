export const NEGATIVE_TRAITS = [
  "FOMO",
  "Anxious",
  "Couch Potato",
  "Broke Family",
  "Sickly",
  "Procrastinator",
  "Loose Lips",
  "Penny-Wise",
  "Loner",
  "Insomniac",
  "Hot-Headed",
  "Distracted",
  "Spendthrift",
  "Pessimist",
  "Hypochondriac",
  "Heartbreaker",
  "Forgetful",
  "Phone Addict",
  "Burnout-Prone",
  "Allergic",
] as const;

export type NegativeTraitName = (typeof NEGATIVE_TRAITS)[number];

export const NEGATIVE_TRAIT_DATA: Record<string, { desc: string; effect: string }> = {
  FOMO: {
    desc: "The fear of missing out gnaws at you. Every party you skip feels personal.",
    effect: "If anyone Socializes and you don't that day: Wellbeing −0.5",
  },
  Anxious: {
    desc: "Your brain runs worst-case scenarios on loop. Social plans feel like minefields.",
    effect: "Mismatched shared actions: Wellbeing −0.5",
  },
  "Couch Potato": {
    desc: "The couch has accepted you as one of its own. Exercise feels like betrayal.",
    effect: "Exercise rolls Bad 50% regardless of Wellbeing",
  },
  "Broke Family": {
    desc: "Your family means well, but the bank account echoes. You start from zero.",
    effect: "Start with Money 0",
  },
  Sickly: {
    desc: "Your immune system is more suggestion than infrastructure. You catch everything.",
    effect: "Wellbeing decay −1.5 instead of −1",
  },
  Procrastinator: {
    desc: "You work best under pressure. Unfortunately, pressure starts five minutes before the deadline.",
    effect: "First Study each week is auto-Bad",
  },
  "Loose Lips": {
    desc: "Secrets slip out of you like water through a sieve. You don't even mean to.",
    effect: "Event codes you receive auto-leak to 1 random other player",
  },
  "Penny-Wise": {
    desc: "You spend money to save money. The math never works, but you do it anyway.",
    effect: "Coffee/Dinner Socialize give Free-tier effect (money still spent)",
  },
  Loner: {
    desc: "Groups drain you. Even when things go well, you leave feeling half-empty.",
    effect: "Successful shared actions: outcome ×0.75",
  },
  Insomniac: {
    desc: "Sleep is a negotiation you usually lose. Your bed is more battlefield than refuge.",
    effect: "Sleep: outcome ×0.5",
  },
  "Hot-Headed": {
    desc: "Your temper arrives before you do. Mismatched plans feel like personal attacks.",
    effect: "Mismatched shared actions cost 1 Relationship progress",
  },
  Distracted: {
    desc: "Your attention span is a precious, fleeting resource. Lectures might as well be white noise.",
    effect: "Class gives only Academics +0.25 (not +0.75)",
  },
  Spendthrift: {
    desc: "Money burns a hole in your pocket. You buy things you don't need with money you don't have.",
    effect: "Daily Money decay −1.5 instead of −1",
  },
  Pessimist: {
    desc: "You prepare for the worst, and the worst usually shows up. It's a self-fulfilling prophecy.",
    effect: "Your Good rolls become Normal",
  },
  Hypochondriac: {
    desc: "Every sneeze is a symptom. Every headache is something worse. Stress compounds stress.",
    effect: "At Wellbeing ≤ 4, +10% Bad chance on all actions",
  },
  Heartbreaker: {
    desc: "Connections fray around you. You can get close, but never close enough.",
    effect: "Cannot reach Relationship Lvl 3 with anyone",
  },
  Forgetful: {
    desc: "Your calendar is a suggestion. Alarms are suggestions. Attendance is a coin flip.",
    effect: "1 random class per week is auto-skipped",
  },
  "Phone Addict": {
    desc: "Your screen time is a lifestyle. Wildcard moments get swallowed by doomscrolling.",
    effect: "Wildcard never pulls a positive-tier card",
  },
  "Burnout-Prone": {
    desc: "You sprint until you collapse. Two study days in a row and your brain starts melting.",
    effect: "Studying 2 days in a row → Wellbeing −1 the second day",
  },
  Allergic: {
    desc: "Pollen, dust, exertion - your body finds reasons to complain. Exercise is a gamble.",
    effect: "Exercise Wellbeing gain halved",
  },
};
