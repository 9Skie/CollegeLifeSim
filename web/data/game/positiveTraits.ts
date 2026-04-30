export const POSITIVE_TRAITS = [
  "Night Owl",
  "Disciplined",
  "Charismatic",
  "Athletic",
  "Early Bird",
  "Quick Study",
  "Lucky",
  "Networker",
  "Trust Fund Kid",
  "Resilient",
  "Influencer",
  "Bookworm",
  "Gym Rat",
  "Study Buddy",
  "Optimist",
  "Adaptable",
  "Hustler",
  "Connected",
  "Charmer",
  "Self Care",
  "Coupon Clipper",
  "Calm Sleeper",
  "Professor's Favorite",
] as const;

export type PositiveTraitName = (typeof POSITIVE_TRAITS)[number];

export const POSITIVE_TRAIT_DATA: Record<string, { desc: string; effect: string }> = {
  "Night Owl": {
    desc: "You thrive after sunset. The later it gets, the sharper you feel.",
    effect: "Night-slot actions gain +0.5 to their main stat",
  },
  Disciplined: {
    desc: "You stay on top of your workload, even on the days when you do nothing flashy.",
    effect: "Daily Academics decay reduced by 0.25",
  },
  Charismatic: {
    desc: "People gravitate toward you. Conversations flow like you scripted them.",
    effect: "Successful Socialize: +0.25 extra Social",
  },
  Athletic: {
    desc: "You were basically born in a gym. Your body recovers faster than most.",
    effect: "Exercise gives +0.5 extra Wellbeing",
  },
  "Early Bird": {
    desc: "You're up before the alarm. The morning quiet is where you do your best work.",
    effect: "Morning-slot actions gain +0.5 to their main stat",
  },
  "Quick Study": {
    desc: "Concepts click fast for you. A single read-through and you get it.",
    effect: "Good Study outcomes give +0.25 extra Academics",
  },
  Lucky: {
    desc: "Fortune smiles on you more than it should. Bad luck rarely sticks.",
    effect: "Once per day, the first Bad outcome becomes Normal",
  },
  Networker: {
    desc: "You don't just make friends - you build alliances. Study sessions feel like parties.",
    effect: "Matched Socialize: +0.25 extra Social",
  },
  "Trust Fund Kid": {
    desc: "Your family cushion means money problems still hurt, but not as fast as they do for everyone else.",
    effect: "Daily Money decay reduced by 0.25",
  },
  Resilient: {
    desc: "You've been through rough patches before. You know how to bounce back.",
    effect: "First time Wellbeing would hit 0, set to 1 instead",
  },
  Influencer: {
    desc: "You always seem to stay socially relevant, even when you do not go out of your way to keep it up.",
    effect: "Daily Social decay reduced by 0.25",
  },
  Bookworm: {
    desc: "You genuinely enjoy reading textbooks. Highlighting is therapeutic.",
    effect: "Solo Study: +0.25 extra Academics",
  },
  "Gym Rat": {
    desc: "The gym is your second home. You know everyone's PRs and their deadlift form.",
    effect: "Exercise also gives +0.25 Social",
  },
  "Study Buddy": {
    desc: "Studying with structure comes naturally to you, and you rarely spiral when you sit down to work.",
    effect: "Study never rolls Bad",
  },
  Optimist: {
    desc: "You see the glass half-full, even when it's clearly empty. It's a skill.",
    effect: "Daily Wellbeing decay reduced by 0.25",
  },
  Adaptable: {
    desc: "Routines bore you. You thrive in chaos and repetition never slows you down.",
    effect: "Same-day repetition penalty does not apply",
  },
  Hustler: {
    desc: "Side gigs, freelancing, reselling - if it pays, you're in. Sleep is for the broke.",
    effect: "Work gives +0.5 extra Money",
  },
  Connected: {
    desc: "You know a guy who knows a guy. Information finds you before it finds anyone else.",
    effect: "Start Wk1 with 1 free private event code",
  },
  Charmer: {
    desc: "You can make a vending-machine conversation feel intimate. Free hangs hit different.",
    effect: "Free Socialize match treated as Coffee-tier effect",
  },
  "Self Care": {
    desc: "You know how to actually recover. Resting is an investment, not a waste.",
    effect: "Rest and Sleep give +0.25 extra Wellbeing",
  },
  "Coupon Clipper": {
    desc: "You somehow always know the hidden deal. Your social plans stretch further on the same budget.",
    effect: "Free Socialize uses Coffee-tier effect; $25 Socialize uses Food-tier effect",
  },
  "Calm Sleeper": {
    desc: "When you slow down, you really slow down. Recovery comes naturally to you.",
    effect: "Rest and Sleep never roll Bad",
  },
  "Professor's Favorite": {
    desc: "For whatever reason, the faculty seem to like you. Even showing up earns extra goodwill.",
    effect: "Class gives +0.25 extra Social",
  },

  // Legacy alias for older local/debug saves before the trait was renamed.
  "Penny-Pincher": {
    desc: "Your family cushion means money problems still hurt, but not as fast as they do for everyone else.",
    effect: "Daily Money decay reduced by 0.25",
  },
};
