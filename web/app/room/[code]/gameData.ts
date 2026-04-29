/* ------------------------------------------------------------------ */
// Majors

export const MAJORS = [
  "Computer Science",
  "Business",
  "Pre-Med",
  "Arts / Media",
  "Undecided",
] as const;

export const MAJOR_DATA: Record<
  string,
  { focus: string; weights: string }
> = {
  "Computer Science": {
    focus: "Heavy on Academics and Money. You grind code by day and side-projects by night.",
    weights: "Academics 4 · Social 1 · Wellbeing 2 · Money 3",
  },
  Business: {
    focus: "Balanced Social and Money. Networking is your real major.",
    weights: "Academics 2 · Social 3 · Wellbeing 2 · Money 3",
  },
  "Pre-Med": {
    focus: "Extreme Academics and Wellbeing. Sleep is a myth, but you know exactly why.",
    weights: "Academics 4 · Social 1 · Wellbeing 4 · Money 1",
  },
  "Arts / Media": {
    focus: "Heavy on Social and Wellbeing. The grind is real, but so is the vibe.",
    weights: "Academics 1 · Social 4 · Wellbeing 3 · Money 2",
  },
  Undecided: {
    focus: "Even spread across all stats. You’re still figuring it out — and that’s fine.",
    weights: "Academics 2.5 · Social 2.5 · Wellbeing 2.5 · Money 2.5",
  },
};

/* ------------------------------------------------------------------ */
// Positive Traits

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

export const POSITIVE_TRAIT_DATA: Record<
  string,
  { desc: string; effect: string }
> = {
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
    desc: "You’re up before the alarm. The morning quiet is where you do your best work.",
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
    desc: "You don’t just make friends — you build alliances. Study sessions feel like parties.",
    effect: "Study Together: +0.25 extra Social on success",
  },
  "Trust Fund Kid": {
    desc: "Your parents send a monthly ‘living’ allowance that most people call a salary.",
    effect: "+1 starting Money",
  },
  Resilient: {
    desc: "You’ve been through rough patches before. You know how to bounce back.",
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
    desc: "The gym is your second home. You know everyone’s PRs and their deadlift form.",
    effect: "Exercise also gives +0.25 Social",
  },
  "Study Buddy": {
    desc: "Group work isn’t a chore for you — it’s where you shine. Partners always show up.",
    effect: "Study Together never rolls Bad",
  },
  Optimist: {
    desc: "You see the glass half-full, even when it’s clearly empty. It’s a skill.",
    effect: "Wellbeing decay −0.5 instead of −1",
  },
  Adaptable: {
    desc: "Routines bore you. You thrive in chaos and repetition never slows you down.",
    effect: "Same-day repetition penalty does not apply",
  },
  Hustler: {
    desc: "Side gigs, freelancing, reselling — if it pays, you’re in. Sleep is for the broke.",
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

/* ------------------------------------------------------------------ */
// Negative Traits

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

export const NEGATIVE_TRAIT_DATA: Record<
  string,
  { desc: string; effect: string }
> = {
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
    desc: "Secrets slip out of you like water through a sieve. You don’t even mean to.",
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
    desc: "Pollen, dust, exertion — your body finds reasons to complain. Exercise is a gamble.",
    effect: "Exercise Wellbeing gain halved",
  },
};
