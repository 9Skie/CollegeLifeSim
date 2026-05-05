export const POSITIVE_TRAITS = [
  "Disciplined",
  "Socialite",
  "Frugal",
  "Centered",
  "Bookworm",
  "Curious",
  "Prepared",
  "Likeable",
  "Hustler",
  "Courteous",
  "Athletic",
  "Upbeat",
  "Rested",
  "Sleeper",
  "Reflective",
  "Dreamer",
  "Charismatic",
  "Warm",
  "Thrifty",
  "Friendly",
  "Calm",
  "Cheerful",
  "Helpful",
  "Steady",
  "Clear-Headed",
] as const;

export type PositiveTraitName = (typeof POSITIVE_TRAITS)[number];

export const POSITIVE_TRAIT_DATA: Record<string, { desc: string; effect: string }> = {
  Disciplined: {
    desc: "Your schoolwork slips more slowly when the day itself is not helping.",
    effect: "Daily Academics decay reduced by 0.25",
  },
  Socialite: {
    desc: "People do not fall off your radar as quickly as they do for most students.",
    effect: "Daily Social decay reduced by 0.25",
  },
  Frugal: {
    desc: "You are good at making money stretch just a little further.",
    effect: "Daily Money decay reduced by 0.25",
  },
  Centered: {
    desc: "Stress still hits, but it does not drain you quite as fast.",
    effect: "Daily Wellbeing decay reduced by 0.25",
  },
  Bookworm: {
    desc: "When you sit down to study, you usually squeeze more out of it than other people do.",
    effect: "Study gives +0.25 Academics",
  },
  Curious: {
    desc: "Studying leaves you feeling a little more energized instead of just more tired.",
    effect: "Study gives +0.25 Wellbeing",
  },
  Prepared: {
    desc: "You usually show up to class ready enough to actually get something out of it.",
    effect: "Class gives +0.25 Academics",
  },
  Likeable: {
    desc: "You come off well in classrooms and group spaces without trying too hard.",
    effect: "Class gives +0.25 Social",
  },
  Hustler: {
    desc: "You are good at pulling a little more value out of the same amount of work.",
    effect: "Work gives +0.25 Money",
  },
  Courteous: {
    desc: "People tend to respond better to you on the job, and that helps in small ways.",
    effect: "Work gives +0.25 Social",
  },
  Athletic: {
    desc: "Your body responds well to movement and effort.",
    effect: "Exercise gives +0.25 Wellbeing",
  },
  Upbeat: {
    desc: "Working out tends to leave you a little more socially alive afterward.",
    effect: "Exercise gives +0.25 Social",
  },
  Rested: {
    desc: "When you rest, the recovery usually lands properly.",
    effect: "Rest gives +0.25 Wellbeing",
  },
  Sleeper: {
    desc: "Sleep actually helps you instead of just keeping you functional.",
    effect: "Sleep gives +0.25 Wellbeing",
  },
  Reflective: {
    desc: "Quiet recovery time helps your head as much as your body.",
    effect: "Rest gives +0.25 Academics",
  },
  Dreamer: {
    desc: "A good night of sleep tends to leave you mentally sharper the next day.",
    effect: "Sleep gives +0.25 Academics",
  },
  Charismatic: {
    desc: "When you do choose to socialize, people usually warm up to you faster.",
    effect: "Socialize gives +0.25 Social",
  },
  Warm: {
    desc: "Being around people tends to refill you a little instead of only draining you.",
    effect: "Socialize gives +0.25 Wellbeing",
  },
  Thrifty: {
    desc: "Paid plans cost you a little less because you know how to avoid the worst deal in the room.",
    effect: "Paid Socialize costs 0.25 less Money",
  },
  Friendly: {
    desc: "When plans match up, they usually land a little better for you.",
    effect: "Matched Socialize gives +0.25 Social",
  },
  Calm: {
    desc: "You handle low-stat pressure a little better than most people.",
    effect: "Warning-based Wellbeing penalty reduced by 0.25",
  },
  Cheerful: {
    desc: "If you actually go out when other people do, it tends to lift your mood too.",
    effect: "If anyone Socializes and you do too that day: Wellbeing +0.25",
  },
  Helpful: {
    desc: "Classroom spaces leave you a little more emotionally settled than usual.",
    effect: "Class gives +0.25 Wellbeing",
  },
  Steady: {
    desc: "You do not get as drained by work as other people do.",
    effect: "Work gives +0.25 Wellbeing",
  },
  "Clear-Headed": {
    desc: "Physical activity tends to clear your head instead of just wearing you out.",
    effect: "Exercise gives +0.25 Academics",
  },
};
