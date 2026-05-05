export const MAJORS = [
  "Computer Science",
  "Business",
  "Pre-Med",
  "Arts / Media",
  "Psychology",
  "Engineering",
  "Communications",
  "Education",
  "Environmental Science",
  "Undecided",
] as const;

export type MajorName = (typeof MAJORS)[number];

export const MAJOR_DATA: Record<string, { focus: string; weights: string }> = {
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
  Psychology: {
    focus: "Balanced Academics and Social insight. You read people almost as much as your textbooks.",
    weights: "Academics 3 · Social 3 · Wellbeing 2 · Money 2",
  },
  Engineering: {
    focus: "High Academics with a practical streak. Long labs, longer problem sets, and just enough money to justify it.",
    weights: "Academics 4 · Social 1 · Wellbeing 2 · Money 3",
  },
  Communications: {
    focus: "Social-first with a professional polish. You know how to turn conversation into opportunity.",
    weights: "Academics 2 · Social 4 · Wellbeing 2 · Money 2",
  },
  Education: {
    focus: "Steady Academics and strong Wellbeing. You care about people and structure in equal measure.",
    weights: "Academics 3 · Social 2 · Wellbeing 3 · Money 2",
  },
  "Environmental Science": {
    focus: "Balanced Academics and Wellbeing. Fieldwork, labs, and a healthy amount of existential climate dread.",
    weights: "Academics 3 · Social 2 · Wellbeing 3 · Money 2",
  },
  Undecided: {
    focus: "Even spread across all stats. You're still figuring it out - and that's fine.",
    weights: "Academics 2.5 · Social 2.5 · Wellbeing 2.5 · Money 2.5",
  },
};
