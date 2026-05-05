export const NEGATIVE_TRAITS = [
  "Scattered",
  "Withdrawn",
  "Spendthrift",
  "Tense",
  "Distracted",
  "Drained",
  "Sleepy",
  "Quiet",
  "Sloppy",
  "Rude",
  "Stiff",
  "Flat",
  "Restless",
  "Insomniac",
  "Ruminating",
  "Groggy",
  "Shy",
  "Hollow",
  "Pricey",
  "Loner",
  "Brittle",
  "FOMO",
  "Frazzled",
  "Burned Out",
  "Foggy",
] as const;

export type NegativeTraitName = (typeof NEGATIVE_TRAITS)[number];

export const NEGATIVE_TRAIT_DATA: Record<string, { desc: string; effect: string }> = {
  Scattered: {
    desc: "Your academic progress slips a little faster whenever you are not actively holding it together.",
    effect: "Daily Academics decay worsened by 0.25",
  },
  Withdrawn: {
    desc: "Social momentum fades a little faster for you than it does for most people.",
    effect: "Daily Social decay worsened by 0.25",
  },
  Spendthrift: {
    desc: "Money seems to leak away from you in small, annoying ways.",
    effect: "Daily Money decay worsened by 0.25",
  },
  Tense: {
    desc: "Stress settles into your body more easily than it should.",
    effect: "Daily Wellbeing decay worsened by 0.25",
  },
  Distracted: {
    desc: "When you sit down to study, your attention slips too quickly.",
    effect: "Study gives -0.25 Academics",
  },
  Drained: {
    desc: "Studying takes more out of you than it seems to take out of everybody else.",
    effect: "Study gives -0.25 Wellbeing",
  },
  Sleepy: {
    desc: "Even when you make it to class, your brain arrives a little late.",
    effect: "Class gives -0.25 Academics",
  },
  Quiet: {
    desc: "You are physically there in class, but you do not connect with the room that much.",
    effect: "Class gives -0.25 Social",
  },
  Sloppy: {
    desc: "You lose little bits of efficiency on the job and it shows up in your pay.",
    effect: "Work gives -0.25 Money",
  },
  Rude: {
    desc: "Your work interactions go a little rougher than you would like.",
    effect: "Work gives -0.25 Social",
  },
  Stiff: {
    desc: "Exercise helps less because your body never fully loosens up.",
    effect: "Exercise gives -0.25 Wellbeing",
  },
  Flat: {
    desc: "Even when you move your body, you do not get much emotional lift from it.",
    effect: "Exercise gives -0.25 Social",
  },
  Restless: {
    desc: "Rest does not land properly for you. You stop, but you do not really recover.",
    effect: "Rest gives -0.25 Wellbeing",
  },
  Insomniac: {
    desc: "Sleep helps, but never quite as much as it should.",
    effect: "Sleep gives -0.25 Wellbeing",
  },
  Ruminating: {
    desc: "When you stop moving, your mind starts spinning in circles.",
    effect: "Rest gives -0.25 Academics",
  },
  Groggy: {
    desc: "A full night's sleep still leaves your brain running half a step behind.",
    effect: "Sleep gives -0.25 Academics",
  },
  Shy: {
    desc: "You get less out of social plans because you hold yourself back too much.",
    effect: "Socialize gives -0.25 Social",
  },
  Hollow: {
    desc: "Even when you do choose people, social time does not refill you the way it should.",
    effect: "Socialize gives -0.25 Wellbeing",
  },
  Pricey: {
    desc: "Your social life somehow always costs a little more than expected.",
    effect: "Paid Socialize costs 0.25 extra Money",
  },
  Loner: {
    desc: "Even when plans line up, they still do not hit you as positively as they hit other people.",
    effect: "Matched Socialize gives -0.25 Social",
  },
  Brittle: {
    desc: "Low-stat pressure hits your nerves a little harder than it should.",
    effect: "Warning-based Wellbeing penalty worsened by 0.25",
  },
  FOMO: {
    desc: "If people go out without you, it gets under your skin fast.",
    effect: "If anyone Socializes and you do not that day: Wellbeing -0.25",
  },
  Frazzled: {
    desc: "Classroom spaces leave you more emotionally spent than they do for other people.",
    effect: "Class gives -0.25 Wellbeing",
  },
  "Burned Out": {
    desc: "Work drains more out of you than it seems to drain out of everybody else.",
    effect: "Work gives -0.25 Wellbeing",
  },
  Foggy: {
    desc: "Exercise clears your head less than it should, and sometimes it does the opposite.",
    effect: "Exercise gives -0.25 Academics",
  },
};
