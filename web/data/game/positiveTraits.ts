export const POSITIVE_TRAITS = [
  "Night Owl",
  "Disciplined",
  "Charismatic",
  "Athletic",
  "Penny-Pincher",
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
] as const;

export type PositiveTraitName = (typeof POSITIVE_TRAITS)[number];

export const POSITIVE_TRAIT_DATA: Record<string, { desc: string; effect: string }> = {
  "Night Owl": {
    desc: "You thrive after sunset. The later it gets, the sharper you feel.",
    effect: "Night-slot actions: outcome ×1.25",
  },
  Disciplined: {
    desc: "Your study habits are ironclad. Distractions bounce off you.",
    effect: "Study never rolls Bad",
  },
  Charismatic: {
    desc: "People gravitate toward you. Conversations flow like you scripted them.",
    effect: "Successful Socialize: +0.25 extra Social",
  },
  Athletic: {
    desc: "You were basically born in a gym. Your body recovers faster than most.",
    effect: "Exercise: outcome ×1.5",
  },
  "Penny-Pincher": {
    desc: "You can stretch a dollar until it screams. Budgeting is your superpower.",
    effect: "Daily Money decay −0.5 instead of −1",
  },
  "Early Bird": {
    desc: "You're up before the alarm. The morning quiet is where you do your best work.",
    effect: "Morning-slot actions: outcome ×1.25",
  },
  "Quick Study": {
    desc: "Concepts click fast for you. A single read-through and you get it.",
    effect: "Good Study outcomes give +0.25 extra Academics",
  },
  Lucky: {
    desc: "Fortune smiles on you more than it should. Bad luck rarely sticks.",
    effect: "Once per day, re-roll one Bad outcome",
  },
  Networker: {
    desc: "You don't just make friends - you build alliances. Study sessions feel like parties.",
    effect: "Study Together: +0.25 extra Social on success",
  },
  "Trust Fund Kid": {
    desc: "Your parents send a monthly 'living' allowance that most people call a salary.",
    effect: "+1 starting Money",
  },
  Resilient: {
    desc: "You've been through rough patches before. You know how to bounce back.",
    effect: "First time Wellbeing would hit 0, set to 1 instead",
  },
  Influencer: {
    desc: "Your social media presence is non-trivial. People know your name before they meet you.",
    effect: "At Social ≥ 7, gain +0.25 Social passive each day",
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
    desc: "Group work isn't a chore for you - it's where you shine. Partners always show up.",
    effect: "Study Together never rolls Bad",
  },
  Optimist: {
    desc: "You see the glass half-full, even when it's clearly empty. It's a skill.",
    effect: "Wellbeing decay −0.5 instead of −1",
  },
  Adaptable: {
    desc: "Routines bore you. You thrive in chaos and repetition never slows you down.",
    effect: "Same-day repetition penalty does not apply",
  },
  Hustler: {
    desc: "Side gigs, freelancing, reselling - if it pays, you're in. Sleep is for the broke.",
    effect: "Work: outcome ×1.25",
  },
  Connected: {
    desc: "You know a guy who knows a guy. Information finds you before it finds anyone else.",
    effect: "Start Wk1 with 1 free private event code",
  },
  Charmer: {
    desc: "You can make a vending-machine conversation feel intimate. Free hangs hit different.",
    effect: "Free Socialize match treated as Coffee-tier effect",
  },
};
