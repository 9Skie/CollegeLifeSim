export type WildcardTier =
  | "really_bad"
  | "bad"
  | "normal"
  | "good"
  | "really_good";

export type WildcardCardType = "stat" | "gimmick";

export type WildcardStat = "academics" | "social" | "wellbeing" | "money";

export type WildcardActionType =
  | "class"
  | "study"
  | "work"
  | "exercise"
  | "socialize"
  | "rest"
  | "sleep"
  | "wildcard"
  | "rest_or_sleep"
  | "any";

export type WildcardDuration =
  | "immediate"
  | "next_action"
  | "next_day"
  | "next_two_actions"
  | "until_triggered"
  | "instant";

export type WildcardImmediateEffect = Partial<Record<WildcardStat, number>>;

export type WildcardFutureEffect =
  | {
      kind: "action_bonus";
      duration: "next_action";
      action: WildcardActionType;
      stat: WildcardStat;
      amount: number;
    }
  | {
      kind: "action_override";
      duration: "next_action";
      action: WildcardActionType;
      override: "zero_money_gain" | "class_academics_negative" | "zero_wellbeing_gain";
      amount?: number;
    }
  | {
      kind: "extra_decay";
      duration: "next_day";
      stat: WildcardStat;
      amount: number;
    }
  | {
      kind: "ignore_penalty";
      duration: "next_day" | "until_triggered";
      penalty: "wellbeing";
      count: number;
    }
  | {
      kind: "convert_bad_outcomes";
      duration: "until_triggered";
      count: number;
    }
  | {
      kind: "draw_extra";
      duration: "instant";
      count: number;
    }
  | {
      kind: "momentum_chain";
      duration: "next_two_actions";
      amount: number;
      excludes?: WildcardActionType[];
    };

export type WildcardCard = {
  id: string;
  tier: WildcardTier;
  type: WildcardCardType;
  title: string;
  emoji: string;
  description: string;
  effectSummary: string;
  duration: WildcardDuration;
  targetStats: WildcardStat[];
  immediate: WildcardImmediateEffect;
  future: WildcardFutureEffect | null;
};

function statCard({
  id,
  tier,
  title,
  emoji,
  description,
  effectSummary,
  immediate,
}: {
  id: string;
  tier: WildcardTier;
  title: string;
  emoji: string;
  description: string;
  effectSummary: string;
  immediate: WildcardImmediateEffect;
}): WildcardCard {
  return {
    id,
    tier,
    type: "stat",
    title,
    emoji,
    description,
    effectSummary,
    duration: "immediate",
    targetStats: Object.keys(immediate) as WildcardStat[],
    immediate,
    future: null,
  };
}

function gimmickCard({
  id,
  tier,
  title,
  emoji,
  description,
  effectSummary,
  duration,
  targetStats,
  immediate = {},
  future,
}: {
  id: string;
  tier: WildcardTier;
  title: string;
  emoji: string;
  description: string;
  effectSummary: string;
  duration: Exclude<WildcardDuration, "immediate">;
  targetStats: WildcardStat[];
  immediate?: WildcardImmediateEffect;
  future: WildcardFutureEffect;
}): WildcardCard {
  return {
    id,
    tier,
    type: "gimmick",
    title,
    emoji,
    description,
    effectSummary,
    duration,
    targetStats,
    immediate,
    future,
  };
}

export const wildcardCards: WildcardCard[] = [
  statCard({
    id: "WC-001",
    tier: "really_bad",
    title: "Academic Probation",
    emoji: "📉",
    description:
      "A late-night portal check reveals that your academic situation is much worse than you thought. The panic does not help.",
    effectSummary: "Academics -2.0",
    immediate: { academics: -2 },
  }),
  statCard({
    id: "WC-002",
    tier: "really_bad",
    title: "Food Poisoning",
    emoji: "🤢",
    description:
      "Something from the dining hall wages biological warfare on your stomach. You spend the rest of the day regretting every life choice that led here.",
    effectSummary: "Wellbeing -2.0",
    immediate: { wellbeing: -2 },
  }),
  statCard({
    id: "WC-003",
    tier: "really_bad",
    title: "Wallet Gone",
    emoji: "💸",
    description:
      "Somewhere between campus, the bus stop, and your dorm, your wallet stops existing. You will be reconstructing this disaster for days.",
    effectSummary: "Money -2.0",
    immediate: { money: -2 },
  }),
  statCard({
    id: "WC-004",
    tier: "really_bad",
    title: "Public Humiliation",
    emoji: "😬",
    description:
      "You say something incredibly wrong in a crowded room and everyone remembers it longer than they should. The social fallout is immediate.",
    effectSummary: "Social -2.0",
    immediate: { social: -2 },
  }),
  statCard({
    id: "WC-005",
    tier: "really_bad",
    title: "Group Project Disaster",
    emoji: "🧨",
    description:
      "Your teammates vanish, the document is empty, and the deadline is now. You absorb the consequences personally.",
    effectSummary: "Academics -1.0, Wellbeing -1.0",
    immediate: { academics: -1, wellbeing: -1 },
  }),
  statCard({
    id: "WC-006",
    tier: "really_bad",
    title: "ER Visit",
    emoji: "🚑",
    description:
      "A dumb accident eats your time, your energy, and more money than you want to think about. Campus life continues without mercy.",
    effectSummary: "Money -1.0, Wellbeing -1.5",
    immediate: { money: -1, wellbeing: -1.5 },
  }),
  statCard({
    id: "WC-007",
    tier: "really_bad",
    title: "Spiral Night",
    emoji: "🌪️",
    description:
      "What starts as a little doomscrolling turns into a full emotional freefall. By sunrise you are somehow both tired and ashamed.",
    effectSummary: "Social -0.5, Wellbeing -1.5",
    immediate: { social: -0.5, wellbeing: -1.5 },
  }),
  statCard({
    id: "WC-008",
    tier: "really_bad",
    title: "Dorm Flood",
    emoji: "💧",
    description:
      "A pipe bursts or a ceiling leaks, and your room briefly becomes a shallow indoor pond. Cleanup costs money and your last nerve.",
    effectSummary: "Money -1.5, Wellbeing -0.5",
    immediate: { money: -1.5, wellbeing: -0.5 },
  }),
  statCard({
    id: "WC-009",
    tier: "really_bad",
    title: "Identity Crisis",
    emoji: "🫠",
    description:
      "You lose an entire evening staring at the ceiling and questioning your path, your major, and maybe your entire personality.",
    effectSummary: "Academics -0.5, Social -0.5, Wellbeing -1.0",
    immediate: { academics: -0.5, social: -0.5, wellbeing: -1 },
  }),
  gimmickCard({
    id: "WC-010",
    tier: "really_bad",
    title: "Blacklisted Shift",
    emoji: "🚫",
    description:
      "You mouth off at the wrong supervisor and discover that service jobs have long memories. The punishment arrives the next time you try to work.",
    effectSummary: "Money -1.0, and your next Work gives 0 Money",
    duration: "next_action",
    targetStats: ["money"],
    immediate: { money: -1 },
    future: {
      kind: "action_override",
      duration: "next_action",
      action: "work",
      override: "zero_money_gain",
    },
  }),
  gimmickCard({
    id: "WC-011",
    tier: "really_bad",
    title: "Professor Grudge",
    emoji: "🧾",
    description:
      "You accidentally antagonize a professor who definitely keeps mental receipts. Their next impression of you is not going to be charitable.",
    effectSummary:
      "Academics -0.5, and your next Class gives -0.25 Academics instead of its normal gain",
    duration: "next_action",
    targetStats: ["academics"],
    immediate: { academics: -0.5 },
    future: {
      kind: "action_override",
      duration: "next_action",
      action: "class",
      override: "class_academics_negative",
      amount: -0.25,
    },
  }),
  gimmickCard({
    id: "WC-012",
    tier: "really_bad",
    title: "Meltdown Week",
    emoji: "🔥",
    description:
      "You hold it together just long enough for the week to end, and then everything catches up to you all at once. Tomorrow is going to feel heavier than usual.",
    effectSummary: "Wellbeing -1.0, and your next day adds an extra -0.5 Wellbeing decay",
    duration: "next_day",
    targetStats: ["wellbeing"],
    immediate: { wellbeing: -1 },
    future: {
      kind: "extra_decay",
      duration: "next_day",
      stat: "wellbeing",
      amount: -0.5,
    },
  }),
  statCard({
    id: "WC-013",
    tier: "bad",
    title: "Missed Alarm",
    emoji: "⏰",
    description:
      "You wake up in a blind panic, already too late to salvage the plan you had. The day starts behind and never catches up.",
    effectSummary: "Academics -1.0",
    immediate: { academics: -1 },
  }),
  statCard({
    id: "WC-014",
    tier: "bad",
    title: "Awkward Hangout",
    emoji: "😶",
    description:
      "You try to be charming, but somehow the whole interaction becomes stilted, weird, and hard to recover from.",
    effectSummary: "Social -1.0",
    immediate: { social: -1 },
  }),
  statCard({
    id: "WC-015",
    tier: "bad",
    title: "Impulse Purchase",
    emoji: "🛍️",
    description:
      "You convince yourself that buying this thing is self-care, then regret it almost immediately after checkout.",
    effectSummary: "Money -1.0",
    immediate: { money: -1 },
  }),
  statCard({
    id: "WC-016",
    tier: "bad",
    title: "Minor Cold",
    emoji: "🤧",
    description:
      "You are not sick enough to stop functioning, just sick enough to feel miserable doing everything. That is somehow worse.",
    effectSummary: "Wellbeing -1.0",
    immediate: { wellbeing: -1 },
  }),
  statCard({
    id: "WC-017",
    tier: "bad",
    title: "Parking Ticket",
    emoji: "🚓",
    description:
      "Campus parking enforcement remains one of the most competent institutions in your life. It finds you quickly and without mercy.",
    effectSummary: "Money -0.75, Wellbeing -0.25",
    immediate: { money: -0.75, wellbeing: -0.25 },
  }),
  statCard({
    id: "WC-018",
    tier: "bad",
    title: "Bad Study Session",
    emoji: "📚",
    description:
      "You stare at the same page for an hour and retain nothing except growing self-hatred. The time is gone forever.",
    effectSummary: "Academics -0.75",
    immediate: { academics: -0.75 },
  }),
  statCard({
    id: "WC-019",
    tier: "bad",
    title: "Overheard Rumor",
    emoji: "👂",
    description:
      "A dumb story about you starts making the rounds, and the worst part is how little control you have over it.",
    effectSummary: "Social -0.75, Wellbeing -0.25",
    immediate: { social: -0.75, wellbeing: -0.25 },
  }),
  statCard({
    id: "WC-020",
    tier: "bad",
    title: "Shattered Phone",
    emoji: "📱",
    description:
      "One slip of the hand and your phone screen becomes an expensive spiderweb. You pretend not to care while absolutely caring.",
    effectSummary: "Money -0.75",
    immediate: { money: -0.75 },
  }),
  statCard({
    id: "WC-021",
    tier: "bad",
    title: "Missed Meal",
    emoji: "🍽️",
    description:
      "You get too busy, too stubborn, or too distracted to eat properly, and your body notices before you do.",
    effectSummary: "Wellbeing -0.75",
    immediate: { wellbeing: -0.75 },
  }),
  statCard({
    id: "WC-022",
    tier: "bad",
    title: "Laundry Disaster",
    emoji: "🧺",
    description:
      "An entire load comes back shrunk, pink, or mysteriously ruined. You now own fewer usable clothes and more resentment.",
    effectSummary: "Money -0.5, Wellbeing -0.5",
    immediate: { money: -0.5, wellbeing: -0.5 },
  }),
  statCard({
    id: "WC-023",
    tier: "bad",
    title: "Peer Comparison",
    emoji: "🪞",
    description:
      "Everyone around you suddenly seems more accomplished, more stable, and more sure of themselves. It gets into your head.",
    effectSummary: "Wellbeing -0.5, Social -0.5",
    immediate: { wellbeing: -0.5, social: -0.5 },
  }),
  statCard({
    id: "WC-024",
    tier: "bad",
    title: "Broken Printer",
    emoji: "🖨️",
    description:
      "The assignment is finished, but the machine you need refuses to cooperate when it matters. Campus technology remains your enemy.",
    effectSummary: "Academics -0.5, Money -0.25",
    immediate: { academics: -0.5, money: -0.25 },
  }),
  statCard({
    id: "WC-025",
    tier: "bad",
    title: "Wrong Classroom",
    emoji: "🚪",
    description:
      "You sit through a chunk of the wrong lecture before realizing you are not where you are supposed to be. The lost momentum stings.",
    effectSummary: "Academics -0.5",
    immediate: { academics: -0.5 },
  }),
  statCard({
    id: "WC-026",
    tier: "bad",
    title: "Terrible Coffee",
    emoji: "☕",
    description:
      "The coffee tastes burnt, costs too much, and somehow still fails to wake you up. It is an insult on every level.",
    effectSummary: "Money -0.25, Wellbeing -0.5",
    immediate: { money: -0.25, wellbeing: -0.5 },
  }),
  statCard({
    id: "WC-027",
    tier: "bad",
    title: "Rain-Soaked Walk",
    emoji: "🌧️",
    description:
      "You get absolutely drenched between buildings and spend the rest of the day damp, cold, and quietly furious.",
    effectSummary: "Wellbeing -0.5",
    immediate: { wellbeing: -0.5 },
  }),
  statCard({
    id: "WC-028",
    tier: "bad",
    title: "Passive-Aggressive Roommate",
    emoji: "🛏️",
    description:
      "Your roommate starts a conflict through body language, weird comments, and the strategic relocation of your stuff.",
    effectSummary: "Social -0.5, Wellbeing -0.5",
    immediate: { social: -0.5, wellbeing: -0.5 },
  }),
  statCard({
    id: "WC-029",
    tier: "bad",
    title: "Library Fine",
    emoji: "📘",
    description:
      "That borrowed book was due so long ago that the fee feels less like a penalty and more like a personal judgment.",
    effectSummary: "Money -0.5",
    immediate: { money: -0.5 },
  }),
  statCard({
    id: "WC-030",
    tier: "bad",
    title: "Bad Networking Event",
    emoji: "🤝",
    description:
      "You collect free pens, fake smiles, and absolutely no real opportunities. The whole evening feels like a tax on your spirit.",
    effectSummary: "Social -0.5, Money -0.25",
    immediate: { social: -0.5, money: -0.25 },
  }),
  statCard({
    id: "WC-031",
    tier: "bad",
    title: "Late-Night Regret",
    emoji: "🌙",
    description:
      "Something that seemed fun in the moment becomes much less charming under the brutal light of tomorrow.",
    effectSummary: "Wellbeing -0.75, Academics -0.25",
    immediate: { wellbeing: -0.75, academics: -0.25 },
  }),
  gimmickCard({
    id: "WC-032",
    tier: "bad",
    title: "Foggy Head",
    emoji: "💤",
    description:
      "Your brain never fully boots up, and whatever focus you had planned to use later is already compromised.",
    effectSummary: "Your next Study loses 0.5 Academics",
    duration: "next_action",
    targetStats: ["academics"],
    future: {
      kind: "action_bonus",
      duration: "next_action",
      action: "study",
      stat: "academics",
      amount: -0.5,
    },
  }),
  gimmickCard({
    id: "WC-033",
    tier: "bad",
    title: "Cringe Flashback",
    emoji: "😵",
    description:
      "Your body decides now is the perfect time to replay something humiliating from years ago in full detail.",
    effectSummary: "Your next Socialize loses 0.5 Social",
    duration: "next_action",
    targetStats: ["social"],
    future: {
      kind: "action_bonus",
      duration: "next_action",
      action: "socialize",
      stat: "social",
      amount: -0.5,
    },
  }),
  gimmickCard({
    id: "WC-034",
    tier: "bad",
    title: "Bad Budget Week",
    emoji: "📉",
    description:
      "Small expenses keep stacking until your whole week feels cursed by invisible charges. The next shift will not save you.",
    effectSummary: "Your next Work gives only +0.5 Money",
    duration: "next_action",
    targetStats: ["money"],
    future: {
      kind: "action_bonus",
      duration: "next_action",
      action: "work",
      stat: "money",
      amount: -0.5,
    },
  }),
  gimmickCard({
    id: "WC-035",
    tier: "bad",
    title: "Sore Muscles",
    emoji: "🦵",
    description:
      "You move wrong exactly once and spend the next day discovering new ways to be annoyed by your own body.",
    effectSummary: "Your next Exercise gives 0 Wellbeing",
    duration: "next_action",
    targetStats: ["wellbeing"],
    future: {
      kind: "action_override",
      duration: "next_action",
      action: "exercise",
      override: "zero_wellbeing_gain",
    },
  }),
  gimmickCard({
    id: "WC-036",
    tier: "bad",
    title: "Bad Sleep Spiral",
    emoji: "🛌",
    description:
      "You technically sleep, but it is the kind of sleep that feels like a prank your body is playing on you.",
    effectSummary: "Your next Sleep gives only +0.5 Wellbeing",
    duration: "next_action",
    targetStats: ["wellbeing"],
    future: {
      kind: "action_bonus",
      duration: "next_action",
      action: "sleep",
      stat: "wellbeing",
      amount: -0.5,
    },
  }),
  statCard({
    id: "WC-037",
    tier: "bad",
    title: "Office Hours Panic",
    emoji: "😨",
    description:
      "You show up hoping for clarity and leave replaying every awkward second of the conversation in your head.",
    effectSummary: "Academics -0.25, Wellbeing -0.5",
    immediate: { academics: -0.25, wellbeing: -0.5 },
  }),
  statCard({
    id: "WC-038",
    tier: "normal",
    title: "Found Twenty",
    emoji: "💵",
    description:
      "A crumpled bill appears in a coat pocket or an old notebook like the universe taking pity on you. It is not much, but it feels blessed.",
    effectSummary: "Money +1.0",
    immediate: { money: 1 },
  }),
  statCard({
    id: "WC-039",
    tier: "normal",
    title: "Unexpected Nap",
    emoji: "😌",
    description:
      "You lie down 'for ten minutes' and wake up noticeably more human than you were before. It saves the whole day.",
    effectSummary: "Wellbeing +1.0",
    immediate: { wellbeing: 1 },
  }),
  statCard({
    id: "WC-040",
    tier: "normal",
    title: "Clean Notes Swap",
    emoji: "📝",
    description:
      "Someone shares notes that are somehow clearer than the lecture itself. You suddenly understand much more than you should.",
    effectSummary: "Academics +1.0",
    immediate: { academics: 1 },
  }),
  statCard({
    id: "WC-041",
    tier: "normal",
    title: "Friendly Hallway Chat",
    emoji: "🙂",
    description:
      "A small conversation catches you at exactly the right moment and leaves you lighter than it has any right to.",
    effectSummary: "Social +1.0",
    immediate: { social: 1 },
  }),
  statCard({
    id: "WC-042",
    tier: "normal",
    title: "Free Pizza Slice",
    emoji: "🍕",
    description:
      "You drift into a student event you had no intention of attending and still leave fed. That counts as a win.",
    effectSummary: "Money +0.5, Wellbeing +0.5",
    immediate: { money: 0.5, wellbeing: 0.5 },
  }),
  statCard({
    id: "WC-043",
    tier: "normal",
    title: "Good Playlist",
    emoji: "🎧",
    description:
      "The right song at the right time makes walking across campus feel cinematic instead of miserable. Mood matters more than you admit.",
    effectSummary: "Wellbeing +0.75, Social +0.25",
    immediate: { wellbeing: 0.75, social: 0.25 },
  }),
  statCard({
    id: "WC-044",
    tier: "normal",
    title: "Study Groove",
    emoji: "🧠",
    description:
      "You finally hit a patch of concentration where the words stick and the work moves. It feels almost suspicious.",
    effectSummary: "Academics +0.75, Wellbeing +0.25",
    immediate: { academics: 0.75, wellbeing: 0.25 },
  }),
  statCard({
    id: "WC-045",
    tier: "normal",
    title: "Tipsy Tip Jar",
    emoji: "☕",
    description:
      "Your shift is boring, but people are weirdly generous all night and that changes your opinion of humanity a little.",
    effectSummary: "Money +0.75, Social +0.25",
    immediate: { money: 0.75, social: 0.25 },
  }),
  statCard({
    id: "WC-046",
    tier: "normal",
    title: "Sunny Bench Break",
    emoji: "🌤️",
    description:
      "You end up alone in a warm patch of sunlight for ten peaceful minutes and return to life less brittle than before.",
    effectSummary: "Wellbeing +0.75",
    immediate: { wellbeing: 0.75 },
  }),
  statCard({
    id: "WC-047",
    tier: "normal",
    title: "Good Hair Day",
    emoji: "💁",
    description:
      "Your reflection surprises you in a good way and your confidence quietly spikes for the rest of the day.",
    effectSummary: "Social +0.75",
    immediate: { social: 0.75 },
  }),
  statCard({
    id: "WC-048",
    tier: "normal",
    title: "Club Flyer Curiosity",
    emoji: "📣",
    description:
      "You follow a random flyer or friend into a room you would normally ignore and accidentally learn something useful.",
    effectSummary: "Social +0.5, Academics +0.5",
    immediate: { social: 0.5, academics: 0.5 },
  }),
  statCard({
    id: "WC-049",
    tier: "normal",
    title: "Meal Swipe Gift",
    emoji: "🎟️",
    description:
      "Someone with an extra swipe saves you from paying and from pretending instant noodles are a personality trait.",
    effectSummary: "Money +0.5, Wellbeing +0.5",
    immediate: { money: 0.5, wellbeing: 0.5 },
  }),
  statCard({
    id: "WC-050",
    tier: "normal",
    title: "Tutor Tip",
    emoji: "💡",
    description:
      "One offhand explanation from the right person makes a concept click in a way your textbook never managed.",
    effectSummary: "Academics +0.75",
    immediate: { academics: 0.75 },
  }),
  statCard({
    id: "WC-051",
    tier: "normal",
    title: "Free Bus Ride",
    emoji: "🚌",
    description:
      "You save both time and energy by catching a lucky ride when your body was already done with walking.",
    effectSummary: "Money +0.25, Wellbeing +0.5",
    immediate: { money: 0.25, wellbeing: 0.5 },
  }),
  statCard({
    id: "WC-052",
    tier: "normal",
    title: "Late Library Hours",
    emoji: "🌃",
    description:
      "The library stays open just long enough for you to actually get something done instead of giving up and spiraling.",
    effectSummary: "Academics +0.5, Wellbeing +0.25",
    immediate: { academics: 0.5, wellbeing: 0.25 },
  }),
  statCard({
    id: "WC-053",
    tier: "normal",
    title: "Compliment from a Stranger",
    emoji: "🌟",
    description:
      "Someone says something kind at exactly the moment you needed a reason to stop being so harsh on yourself.",
    effectSummary: "Social +0.5, Wellbeing +0.25",
    immediate: { social: 0.5, wellbeing: 0.25 },
  }),
  statCard({
    id: "WC-054",
    tier: "normal",
    title: "Campus Freebie Bag",
    emoji: "🎁",
    description:
      "Most of the bag is nonsense, but enough of it is useful that the whole experience feels like a tiny festival of luck.",
    effectSummary: "Money +0.75",
    immediate: { money: 0.75 },
  }),
  statCard({
    id: "WC-055",
    tier: "normal",
    title: "Rain Delay Reset",
    emoji: "☔",
    description:
      "Plans fall apart, but the forced pause gives you a little more room to breathe than your day had before.",
    effectSummary: "Wellbeing +0.75",
    immediate: { wellbeing: 0.75 },
  }),
  statCard({
    id: "WC-056",
    tier: "normal",
    title: "Lucky Seat in Class",
    emoji: "🪑",
    description:
      "You sit next to the one person who actually understood the lecture and they explain it in plain language after class.",
    effectSummary: "Academics +0.5, Social +0.25",
    immediate: { academics: 0.5, social: 0.25 },
  }),
  statCard({
    id: "WC-057",
    tier: "normal",
    title: "Decent Shift",
    emoji: "🍽️",
    description:
      "Nothing dramatic happens, nobody yells at you, and the money arrives exactly as promised. That alone feels rare.",
    effectSummary: "Money +1.0",
    immediate: { money: 1 },
  }),
  statCard({
    id: "WC-058",
    tier: "normal",
    title: "Stretch Break",
    emoji: "🧘",
    description:
      "A simple break for your body resets more tension than you realized you were carrying.",
    effectSummary: "Wellbeing +0.75",
    immediate: { wellbeing: 0.75 },
  }),
  statCard({
    id: "WC-059",
    tier: "normal",
    title: "Small Scholarship Email",
    emoji: "📩",
    description:
      "It is not a life-changing amount, but it lands in your inbox at exactly the right time to matter.",
    effectSummary: "Money +0.75",
    immediate: { money: 0.75 },
  }),
  statCard({
    id: "WC-060",
    tier: "normal",
    title: "Lucky Guess",
    emoji: "❓",
    description:
      "You make a guess on something you probably should not know and somehow come out looking competent.",
    effectSummary: "Academics +0.75",
    immediate: { academics: 0.75 },
  }),
  statCard({
    id: "WC-061",
    tier: "normal",
    title: "Vending Jackpot",
    emoji: "🥤",
    description:
      "The machine double-drops your snack and you briefly feel favored by forces beyond your understanding.",
    effectSummary: "Money +0.25, Wellbeing +0.5",
    immediate: { money: 0.25, wellbeing: 0.5 },
  }),
  gimmickCard({
    id: "WC-062",
    tier: "normal",
    title: "Next Study Boost",
    emoji: "📖",
    description:
      "You stumble across a clue, a source, or a trick that will make your next real study session much more productive.",
    effectSummary: "Your next Study gains +0.75 Academics",
    duration: "next_action",
    targetStats: ["academics"],
    future: {
      kind: "action_bonus",
      duration: "next_action",
      action: "study",
      stat: "academics",
      amount: 0.75,
    },
  }),
  gimmickCard({
    id: "WC-063",
    tier: "normal",
    title: "Next Work Boost",
    emoji: "💼",
    description:
      "Someone offers you an easy task, a good shift, or a small advantage that turns your next work session into a better deal.",
    effectSummary: "Your next Work gains +0.75 Money",
    duration: "next_action",
    targetStats: ["money"],
    future: {
      kind: "action_bonus",
      duration: "next_action",
      action: "work",
      stat: "money",
      amount: 0.75,
    },
  }),
  statCard({
    id: "WC-064",
    tier: "good",
    title: "Professor Mercy",
    emoji: "🎓",
    description:
      "The professor hands out a hint, extension, or grading break that they absolutely did not have to give you.",
    effectSummary: "Academics +1.5",
    immediate: { academics: 1.5 },
  }),
  statCard({
    id: "WC-065",
    tier: "good",
    title: "Perfect Sleep",
    emoji: "😴",
    description:
      "You wake up feeling startlingly rested, like your body briefly remembered how to function correctly.",
    effectSummary: "Wellbeing +1.5",
    immediate: { wellbeing: 1.5 },
  }),
  statCard({
    id: "WC-066",
    tier: "good",
    title: "Cash Gig",
    emoji: "💼",
    description:
      "A random one-day job appears and somehow pays better than your actual normal opportunities.",
    effectSummary: "Money +1.5",
    immediate: { money: 1.5 },
  }),
  statCard({
    id: "WC-067",
    tier: "good",
    title: "Magnetic Energy",
    emoji: "✨",
    description:
      "People are weirdly drawn to you today, and every interaction goes a little smoother than expected.",
    effectSummary: "Social +1.5",
    immediate: { social: 1.5 },
  }),
  statCard({
    id: "WC-068",
    tier: "good",
    title: "Locked-In Study Day",
    emoji: "📚",
    description:
      "The distractions fall away, the tasks line up, and you spend hours actually making progress instead of pretending to.",
    effectSummary: "Academics +1.25, Wellbeing +0.25",
    immediate: { academics: 1.25, wellbeing: 0.25 },
  }),
  statCard({
    id: "WC-069",
    tier: "good",
    title: "Healing Weekend",
    emoji: "🛀",
    description:
      "You accidentally do everything right for one stretch of time and your body rewards you for it immediately.",
    effectSummary: "Wellbeing +1.25, Social +0.25",
    immediate: { wellbeing: 1.25, social: 0.25 },
  }),
  statCard({
    id: "WC-070",
    tier: "good",
    title: "Great Tips Night",
    emoji: "🍻",
    description:
      "Customers are cheerful, management is absent, and the cash accumulates faster than your stress does.",
    effectSummary: "Money +1.25, Social +0.25",
    immediate: { money: 1.25, social: 0.25 },
  }),
  statCard({
    id: "WC-071",
    tier: "good",
    title: "Campus Celebrity Moment",
    emoji: "📸",
    description:
      "For one evening, people know who you are for a good reason and the glow carries farther than expected.",
    effectSummary: "Social +1.25, Wellbeing +0.25",
    immediate: { social: 1.25, wellbeing: 0.25 },
  }),
  statCard({
    id: "WC-072",
    tier: "good",
    title: "Advisor Hookup",
    emoji: "🧠",
    description:
      "You get pointed toward exactly the right person, office, or resource just before you would have given up.",
    effectSummary: "Academics +1.0, Money +0.5",
    immediate: { academics: 1, money: 0.5 },
  }),
  statCard({
    id: "WC-073",
    tier: "good",
    title: "Recharge Day",
    emoji: "🌿",
    description:
      "You do less, breathe more, and still come out ahead because your brain and body finally stop fighting you.",
    effectSummary: "Wellbeing +1.0, Academics +0.5",
    immediate: { wellbeing: 1, academics: 0.5 },
  }),
  statCard({
    id: "WC-074",
    tier: "good",
    title: "Good Crowd",
    emoji: "🫶",
    description:
      "You land in a room where everyone is easy to talk to and no one makes you regret leaving home.",
    effectSummary: "Social +1.0, Money +0.5",
    immediate: { social: 1, money: 0.5 },
  }),
  statCard({
    id: "WC-075",
    tier: "good",
    title: "Paid Opportunity",
    emoji: "📑",
    description:
      "Someone notices competence and turns it into a concrete chance to earn. It is one of those tiny lucky pivots.",
    effectSummary: "Money +1.0, Academics +0.5",
    immediate: { money: 1, academics: 0.5 },
  }),
  statCard({
    id: "WC-076",
    tier: "good",
    title: "Lucky Break",
    emoji: "🍀",
    description:
      "Two or three small things line up in your favor and the whole day becomes much easier to live inside.",
    effectSummary: "Academics +0.75, Wellbeing +0.75",
    immediate: { academics: 0.75, wellbeing: 0.75 },
  }),
  statCard({
    id: "WC-077",
    tier: "good",
    title: "Confidence Surge",
    emoji: "🔥",
    description:
      "You stop hesitating, stop second-guessing, and suddenly every choice feels easier to commit to.",
    effectSummary: "Social +0.75, Wellbeing +0.75",
    immediate: { social: 0.75, wellbeing: 0.75 },
  }),
  statCard({
    id: "WC-078",
    tier: "good",
    title: "Free Groceries",
    emoji: "🛒",
    description:
      "Someone moving out or cleaning house hands you a ridiculous amount of useful food and basic supplies.",
    effectSummary: "Money +0.75, Wellbeing +0.75",
    immediate: { money: 0.75, wellbeing: 0.75 },
  }),
  statCard({
    id: "WC-079",
    tier: "good",
    title: "Research Assistant Lead",
    emoji: "🔬",
    description:
      "A professor, TA, or grad student gives you the kind of opening that makes you feel smarter just for hearing it.",
    effectSummary: "Academics +1.25",
    immediate: { academics: 1.25 },
  }),
  statCard({
    id: "WC-080",
    tier: "good",
    title: "Great Gym Session",
    emoji: "🏋️",
    description:
      "Your body cooperates, your lungs behave, and the endorphins actually show up on time.",
    effectSummary: "Wellbeing +1.25",
    immediate: { wellbeing: 1.25 },
  }),
  statCard({
    id: "WC-081",
    tier: "good",
    title: "Unexpected Venmo",
    emoji: "📲",
    description:
      "Somebody finally pays you back for something ancient and you immediately stop believing in karma out of sheer surprise.",
    effectSummary: "Money +1.25",
    immediate: { money: 1.25 },
  }),
  statCard({
    id: "WC-082",
    tier: "good",
    title: "Party Win",
    emoji: "🪩",
    description:
      "You leave the night with new names, new confidence, and the rare sense that going out was absolutely the right choice.",
    effectSummary: "Social +1.25",
    immediate: { social: 1.25 },
  }),
  gimmickCard({
    id: "WC-083",
    tier: "good",
    title: "Next-Day Focus Buff",
    emoji: "🎯",
    description:
      "Something clicks mentally and leaves behind just enough structure that your next study session starts stronger.",
    effectSummary: "Your next Study gains +0.75 Academics",
    duration: "next_action",
    targetStats: ["academics"],
    future: {
      kind: "action_bonus",
      duration: "next_action",
      action: "study",
      stat: "academics",
      amount: 0.75,
    },
  }),
  gimmickCard({
    id: "WC-084",
    tier: "good",
    title: "Next-Day Recovery Buff",
    emoji: "🛌",
    description:
      "Your body is set up to recover better the next time you actually let it rest.",
    effectSummary: "Your next Sleep or Rest gains +0.75 Wellbeing",
    duration: "next_action",
    targetStats: ["wellbeing"],
    future: {
      kind: "action_bonus",
      duration: "next_action",
      action: "rest_or_sleep",
      stat: "wellbeing",
      amount: 0.75,
    },
  }),
  gimmickCard({
    id: "WC-085",
    tier: "good",
    title: "Next-Day Hustle Buff",
    emoji: "🚀",
    description:
      "You find an easier route to money, and your next time working will benefit from that momentum.",
    effectSummary: "Your next Work gains +0.75 Money",
    duration: "next_action",
    targetStats: ["money"],
    future: {
      kind: "action_bonus",
      duration: "next_action",
      action: "work",
      stat: "money",
      amount: 0.75,
    },
  }),
  gimmickCard({
    id: "WC-086",
    tier: "good",
    title: "Social Momentum",
    emoji: "🗣️",
    description:
      "You become easier to talk to for a little while, as if your charm has finally stopped buffering.",
    effectSummary: "Your next Socialize gains +0.75 Social",
    duration: "next_action",
    targetStats: ["social"],
    future: {
      kind: "action_bonus",
      duration: "next_action",
      action: "socialize",
      stat: "social",
      amount: 0.75,
    },
  }),
  gimmickCard({
    id: "WC-087",
    tier: "good",
    title: "Safety Net",
    emoji: "🛡️",
    description:
      "You feel strangely protected, like the next disaster has already been politely asked to stay away.",
    effectSummary: "Your next bad outcome becomes normal",
    duration: "until_triggered",
    targetStats: [],
    future: {
      kind: "convert_bad_outcomes",
      duration: "until_triggered",
      count: 1,
    },
  }),
  gimmickCard({
    id: "WC-088",
    tier: "good",
    title: "Calm Mind",
    emoji: "🌙",
    description:
      "The static in your head clears just enough that tomorrow's stress has less room to hurt you.",
    effectSummary: "Tomorrow you ignore one wellbeing-related penalty",
    duration: "next_day",
    targetStats: ["wellbeing"],
    future: {
      kind: "ignore_penalty",
      duration: "next_day",
      penalty: "wellbeing",
      count: 1,
    },
  }),
  statCard({
    id: "WC-089",
    tier: "really_good",
    title: "Secret Answer Key",
    emoji: "🔑",
    description:
      "You accidentally find exactly the clue, answer pattern, or hidden advantage you were never supposed to see. It is a little illegal and extremely useful.",
    effectSummary: "Academics +2.0",
    immediate: { academics: 2 },
  }),
  statCard({
    id: "WC-090",
    tier: "really_good",
    title: "Scholarship Win",
    emoji: "🏆",
    description:
      "Real money, no strings, no fake internship catch, and no follow-up email asking for your banking password.",
    effectSummary: "Money +2.0",
    immediate: { money: 2 },
  }),
  statCard({
    id: "WC-091",
    tier: "really_good",
    title: "Miracle Recovery",
    emoji: "🌈",
    description:
      "Whatever was wrong with your brain, body, or spirit briefly gets patched by divine intervention.",
    effectSummary: "Wellbeing +2.0",
    immediate: { wellbeing: 2 },
  }),
  statCard({
    id: "WC-092",
    tier: "really_good",
    title: "Legendary Social Night",
    emoji: "🎉",
    description:
      "You become the center of the room for all the right reasons and ride the high all the way home.",
    effectSummary: "Social +2.0",
    immediate: { social: 2 },
  }),
  statCard({
    id: "WC-093",
    tier: "really_good",
    title: "Dream Internship Offer",
    emoji: "💼",
    description:
      "A ridiculous opportunity lands in your lap and somehow turns out to be both real and useful.",
    effectSummary: "Money +1.5, Academics +0.75",
    immediate: { money: 1.5, academics: 0.75 },
  }),
  statCard({
    id: "WC-094",
    tier: "really_good",
    title: "Peak Flow State",
    emoji: "🧠",
    description:
      "You become terrifyingly efficient for one stretch of time and tear through work that should have taken twice as long.",
    effectSummary: "Academics +1.5, Wellbeing +0.75",
    immediate: { academics: 1.5, wellbeing: 0.75 },
  }),
  statCard({
    id: "WC-095",
    tier: "really_good",
    title: "Perfect Reset Weekend",
    emoji: "🛏️",
    description:
      "You sleep, eat, breathe, and recover like a person in a self-help book instead of a college student.",
    effectSummary: "Wellbeing +1.5, Social +0.75",
    immediate: { wellbeing: 1.5, social: 0.75 },
  }),
  statCard({
    id: "WC-096",
    tier: "really_good",
    title: "Main Character Arc",
    emoji: "🌟",
    description:
      "For one glorious moment, the universe remembers your name and decides to reward your existence.",
    effectSummary: "Social +1.5, Money +0.75",
    immediate: { social: 1.5, money: 0.75 },
  }),
  statCard({
    id: "WC-097",
    tier: "really_good",
    title: "Double Lucky Break",
    emoji: "🍀🍀",
    description:
      "Two unrelated good things happen back to back and you do not trust either of them, but both are real.",
    effectSummary: "Academics +1.0, Money +1.0",
    immediate: { academics: 1, money: 1 },
  }),
  gimmickCard({
    id: "WC-098",
    tier: "really_good",
    title: "Guardian Angel",
    emoji: "😇",
    description:
      "Something invisible steps between you and catastrophe, and the protection lingers just long enough to matter.",
    effectSummary: "Your next two bad outcomes become normal",
    duration: "until_triggered",
    targetStats: [],
    future: {
      kind: "convert_bad_outcomes",
      duration: "until_triggered",
      count: 2,
    },
  }),
  gimmickCard({
    id: "WC-099",
    tier: "really_good",
    title: "Momentum Chain",
    emoji: "⚡",
    description:
      "Success starts feeding itself, and the next couple of things you do inherit some of that spark.",
    effectSummary: "Your next two actions each gain +0.5 to their main stat",
    duration: "next_two_actions",
    targetStats: ["academics", "social", "wellbeing", "money"],
    future: {
      kind: "momentum_chain",
      duration: "next_two_actions",
      amount: 0.5,
      excludes: ["wildcard"],
    },
  }),
  gimmickCard({
    id: "WC-100",
    tier: "really_good",
    title: "Golden Ticket",
    emoji: "🎫",
    description:
      "You pull the kind of luck people tell stories about later, and it keeps paying out after the first shock wears off.",
    effectSummary: "Draw 1 additional wildcard immediately, then also gain Wellbeing +0.5",
    duration: "instant",
    targetStats: ["wellbeing"],
    immediate: { wellbeing: 0.5 },
    future: {
      kind: "draw_extra",
      duration: "instant",
      count: 1,
    },
  }),
];

export const wildcardTierCounts = {
  really_bad: 12,
  bad: 25,
  normal: 26,
  good: 25,
  really_good: 12,
} as const;
