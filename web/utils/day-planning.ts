export type DayPublicEvent = {
  name: string;
  flavor: string;
  effect: string;
};

export type DayPrivateEvent = {
  id: string;
  name: string;
  code: string;
  flavor: string;
  effect: string;
  prereq: string;
};

export type DayRelationship = {
  playerId: string;
  name: string;
  level: number;
};

export type DayPlanningContext = {
  character: {
    major: string | null;
    posTrait: string | null;
    negTrait: string | null;
  };
  stats: {
    academics: number;
    social: number;
    wellbeing: number;
    money: number;
  };
  dailyDecay: {
    academics: number;
    social: number;
    wellbeing: number;
    money: number;
  };
  classSchedule: Array<{ day: number; slot: "morning" | "afternoon" }>;
  hasClassMorning: boolean;
  hasClassAfternoon: boolean;
  workAvailability: {
    morning: boolean;
    afternoon: boolean;
    night: boolean;
  };
  publicEvent: DayPublicEvent | null;
  privateEvents: DayPrivateEvent[];
  heldCodes: Array<{ code: string; name: string }>;
  relationships: DayRelationship[];
};

type DayPlanningPlayer = {
  id: string;
  name: string;
  major?: string | null;
  pos_trait?: string | null;
  neg_trait?: string | null;
  academics?: number | string | null;
  social?: number | string | null;
  wellbeing?: number | string | null;
  money?: number | string | null;
  class_schedule?: Array<{ day: number; slot: "morning" | "afternoon" }> | null;
  eliminated?: boolean | null;
};

const DAILY_DECAY = {
  academics: -0.5,
  social: -0.5,
  wellbeing: -0.5,
  money: -0.5,
} as const;

const PUBLIC_EVENT_POOL: DayPublicEvent[] = [
  {
    name: "Heatwave",
    flavor:
      "The quad is basically a frying pan. Even the squirrels look miserable.",
    effect: "Exercise effectiveness halved today",
  },
  {
    name: "Cram Season",
    flavor:
      "The library is packed, energy-drink cans litter every table, and someone is definitely crying in the stacks.",
    effect: "Study actions boosted 1.5x today",
  },
  {
    name: "Frat Row Block Party",
    flavor:
      "Speakers the size of cars. The bass is rattling windows three blocks away.",
    effect: "Night Socialize boosted 1.5x",
  },
  {
    name: "Campus Power Outage",
    flavor:
      "The lights flickered and died. Half the dorm is outside with flashlights; the other half is already napping.",
    effect: "Morning Study halved",
  },
  {
    name: "Hiring Spree",
    flavor:
      "Every coffee shop and bookstore on campus put up 'Help Wanted' signs overnight.",
    effect: "Work effectiveness boosted 1.5x",
  },
  {
    name: "Wellness Week",
    flavor:
      "Free yoga on the lawn, meditation sessions in the chapel, and somehow the dining hall is serving actual vegetables.",
    effect: "Rest and Sleep boosted 1.5x",
  },
  {
    name: "Snow Day",
    flavor:
      "Two feet of snow. The provost gave up. The dining hall is somehow still open.",
    effect: "Classes cancelled",
  },
  {
    name: "Flu Outbreak",
    flavor:
      "The health center line wraps around the building. Everyone is either sick or pretending to be.",
    effect: "Wellbeing decay -1.5 today",
  },
  {
    name: "Career Fair",
    flavor:
      "Recruiters in matching polos are handing out stress balls and collecting resumes like trading cards.",
    effect: "Work boosted, also gives Academics",
  },
  {
    name: "Coffee Shop Promo",
    flavor:
      "The campus cafe is running a 'study marathon' deal - unlimited refills if you stay four hours.",
    effect: "Coffee Socialize cost waived",
  },
];

const PRIVATE_EVENT_POOL: DayPrivateEvent[] = [
  {
    id: "p1",
    name: "Secret Study Group",
    code: "STUDY-01",
    flavor:
      "A grad student posted a cryptic flyer in the STEM building basement. Word is they cracked next week's problem set.",
    effect: "Academics +1.75",
    prereq: "Academics >= 3",
  },
  {
    id: "p2",
    name: "Underground Poker",
    code: "POKER-02",
    flavor:
      "Someone slid a chip under your door with an address and a time. Buy-in is steep, but the pot is steeper.",
    effect: "Money +3 or -2",
    prereq: "Money >= 2",
  },
  {
    id: "p3",
    name: "VIP Concert",
    code: "VIP-03",
    flavor:
      "A friend-of-a-friend works venue security and has two backstage passes burning a hole in their pocket.",
    effect: "Social +1.75, Wellbeing +0.5",
    prereq: "Social >= 3",
  },
  {
    id: "p4",
    name: "Office Hours Invite",
    code: "OFFICE-04",
    flavor:
      "The professor you've been avoiding emailed you directly. Subject line: 'We need to talk.' It might be good.",
    effect: "Academics +2, costs $25",
    prereq: "CS / Pre-Med",
  },
  {
    id: "p5",
    name: "Greek Mixer",
    code: "GREEK-05",
    flavor:
      "A handwritten invitation taped to your dorm door. Dress code: 'try harder than usual.'",
    effect: "Social +1.75",
    prereq: "Business / Arts",
  },
  {
    id: "p6",
    name: "Insider Internship",
    code: "INTERN-06",
    flavor:
      "Your advisor forwarded an email with the subject 'URGENT - not a mass email.' It actually wasn't.",
    effect: "Money +1.75",
    prereq: "Academics >= 5",
  },
];

function hashString(str: string): number {
  let hash = 0;
  for (let index = 0; index < str.length; index += 1) {
    hash = str.charCodeAt(index) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function toNumber(value: number | string | null | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function buildDayPlanningContext({
  roomCode,
  currentDay,
  players,
  playerId,
}: {
  roomCode: string;
  currentDay: number;
  players: DayPlanningPlayer[];
  playerId: string;
}): DayPlanningContext | null {
  const currentPlayer = players.find((player) => player.id === playerId);
  if (!currentPlayer) {
    return null;
  }

  const classSchedule = Array.isArray(currentPlayer.class_schedule)
    ? currentPlayer.class_schedule
    : [];
  const currentDayIndex = (currentDay - 1) % 7;
  const hasClassMorning = classSchedule.some(
    (entry) => entry.day === currentDayIndex && entry.slot === "morning"
  );
  const hasClassAfternoon = classSchedule.some(
    (entry) => entry.day === currentDayIndex && entry.slot === "afternoon"
  );
  const privateSeed = hashString(`${roomCode}:${playerId}:day:${currentDay}:private`);
  const firstPrivateEvent = PRIVATE_EVENT_POOL[privateSeed % PRIVATE_EVENT_POOL.length];
  const secondPrivateEvent =
    PRIVATE_EVENT_POOL[(privateSeed + 3) % PRIVATE_EVENT_POOL.length];
  const privateEvents =
    firstPrivateEvent.id === secondPrivateEvent.id
      ? [firstPrivateEvent]
      : [firstPrivateEvent, secondPrivateEvent];

  return {
    character: {
      major: currentPlayer.major ?? null,
      posTrait: currentPlayer.pos_trait ?? null,
      negTrait: currentPlayer.neg_trait ?? null,
    },
    stats: {
      academics: toNumber(currentPlayer.academics, 2),
      social: toNumber(currentPlayer.social, 2),
      wellbeing: toNumber(currentPlayer.wellbeing, 5),
      money: toNumber(currentPlayer.money, 2),
    },
    dailyDecay: { ...DAILY_DECAY },
    classSchedule,
    hasClassMorning,
    hasClassAfternoon,
    workAvailability: {
      morning: !hasClassMorning,
      afternoon: !hasClassAfternoon,
      night: true,
    },
    publicEvent:
      PUBLIC_EVENT_POOL[
        hashString(`${roomCode}:day:${currentDay}:public`) % PUBLIC_EVENT_POOL.length
      ] ?? null,
    privateEvents,
    heldCodes: privateEvents.map((event) => ({ code: event.code, name: event.name })),
    relationships: players
      .filter((player) => player.id !== playerId)
      .map((player) => ({
        playerId: player.id,
        name: player.name,
        level: hashString(`${roomCode}:${playerId}:${player.id}:relationship`) % 4,
      }))
      .sort((left, right) => right.level - left.level || left.name.localeCompare(right.name)),
  };
}
