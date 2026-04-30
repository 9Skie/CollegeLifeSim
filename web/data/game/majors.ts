export const MAJORS = [
  "Computer Science",
  "Business",
  "Pre-Med",
  "Arts / Media",
  "Undecided",
] as const;

export type MajorName = (typeof MAJORS)[number];

export const MAJOR_DATA: Record<
  MajorName,
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
    focus: "Even spread across all stats. You're still figuring it out - and that's fine.",
    weights: "Academics 2.5 · Social 2.5 · Wellbeing 2.5 · Money 2.5",
  },
};
