"use client";

import { useEffect, useMemo, useState } from "react";
import ActionPicker, { Selection } from "./ActionPicker";
import { getDummyBehavior } from "./dummyPlayers";
import {
  MAJORS,
  MAJOR_DATA,
  POSITIVE_TRAITS,
  POSITIVE_TRAIT_DATA,
  NEGATIVE_TRAITS,
  NEGATIVE_TRAIT_DATA,
} from "@/data/game";

/* ------------------------------------------------------------------ */
// Types

type Player = {
  id: string;
  name: string;
  major?: string | null;
  pos_trait?: string | null;
  neg_trait?: string | null;
  academics?: number;
  social?: number;
  wellbeing?: number;
  money?: number;
  eliminated?: boolean;
  class_schedule?: Array<{ day: number; slot: "morning" | "afternoon" }>;
};
type PublicEvent = { name: string; flavor: string; effect: string };
type PrivateEvent = {
  id: string;
  name: string;
  code: string;
  flavor: string;
  effect: string;
  prereq: string;
};
type Relationship = { playerId: string; name: string; level: number };

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ------------------------------------------------------------------ */
// Event data

const PUBLIC_EVENT_POOL: PublicEvent[] = [
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
    effect: "Study actions boosted 1.5× today",
  },
  {
    name: "Frat Row Block Party",
    flavor:
      "Speakers the size of cars. The bass is rattling windows three blocks away.",
    effect: "Night Socialize boosted 1.5×",
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
    effect: "Work effectiveness boosted 1.5×",
  },
  {
    name: "Wellness Week",
    flavor:
      "Free yoga on the lawn, meditation sessions in the chapel, and somehow the dining hall is serving actual vegetables.",
    effect: "Rest & Sleep boosted 1.5×",
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
    effect: "Wellbeing decay −1.5 today",
  },
  {
    name: "Career Fair",
    flavor:
      "Recruiters in matching polos are handing out stress balls and collecting résumés like trading cards.",
    effect: "Work boosted, also gives Academics",
  },
  {
    name: "Coffee Shop Promo",
    flavor:
      "The campus café is running a 'study marathon' deal — unlimited refills if you stay four hours.",
    effect: "Coffee Socialize cost waived",
  },
];

const PRIVATE_EVENT_POOL: PrivateEvent[] = [
  {
    id: "p1",
    name: "Secret Study Group",
    code: "STUDY-01",
    flavor:
      "A grad student posted a cryptic flyer in the STEM building basement. Word is they cracked next week’s problem set.",
    effect: "Academics +1.75",
    prereq: "Academics ≥ 3",
  },
  {
    id: "p2",
    name: "Underground Poker",
    code: "POKER-02",
    flavor:
      "Someone slid a chip under your door with an address and a time. Buy-in is steep, but the pot is steeper.",
    effect: "Money +3 or −2",
    prereq: "Money ≥ 2",
  },
  {
    id: "p3",
    name: "VIP Concert",
    code: "VIP-03",
    flavor:
      "A friend-of-a-friend works venue security and has two backstage passes burning a hole in their pocket.",
    effect: "Social +1.75, Wellbeing +0.5",
    prereq: "Social ≥ 3",
  },
  {
    id: "p4",
    name: "Office Hours Invite",
    code: "OFFICE-04",
    flavor:
      "The professor you’ve been avoiding emailed you directly. Subject line: 'We need to talk.' It might be good.",
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
      "Your advisor forwarded an email with the subject 'URGENT — not a mass email.' It actually wasn't.",
    effect: "Money +1.75",
    prereq: "Academics ≥ 5",
  },
];

/* ------------------------------------------------------------------ */
// Helpers

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getAvatarColor(name: string): string {
  const colors = [
    "#d94f4f", "#f0a868", "#5b8c5a", "#4f8cd9",
    "#d94fb8", "#a17b1a", "#8a8579", "#4fd9c9",
    "#d96f4f",
  ];
  return colors[hashString(name) % colors.length];
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

const DAILY_DECAY = {
  academics: -0.5,
  social: -0.5,
  wellbeing: -0.5,
  money: -1.0,
};

function calculateDayGains(
  selections: Record<string, Selection | null>,
  hasClassMorning: boolean,
  hasClassAfternoon: boolean
): Record<string, number> {
  const gain = { academics: 0, social: 0, wellbeing: 0, money: 0 };

  for (const slot of ["morning", "afternoon", "night"] as const) {
    const sel = selections[slot];
    if (!sel) continue;
    const isNight = slot === "night";

    switch (sel.actionId) {
      case "class":
        gain.academics += 0.75;
        gain.social += 0.25;
        break;
      case "study":
        gain.academics += 1;
        break;
      case "studyTogether":
        gain.academics += 0.75;
        gain.social += 0.5;
        break;
      case "work":
        gain.money += 1;
        break;
      case "exercise":
        gain.wellbeing += 1;
        break;
      case "socialize": {
        const spend = sel.spend || 0;
        if (spend === 2) {
          gain.social += 1.5;
          gain.money -= 0.5;
        } else if (spend === 1) {
          gain.social += 1.25;
          gain.money -= 0.25;
        } else {
          gain.social += 1;
        }
        break;
      }
      case "rest":
        gain.wellbeing += 0.5;
        break;
      case "sleep":
        gain.wellbeing += 1;
        break;
      case "wildcard":
        // Unknown until resolution
        break;
    }
  }

  // Skip-class penalty
  if (hasClassMorning && selections.morning?.actionId !== "class") {
    gain.academics -= 0.5;
  }
  if (hasClassAfternoon && selections.afternoon?.actionId !== "class") {
    gain.academics -= 0.5;
  }

  return gain;
}

/* ------------------------------------------------------------------ */

export default function DayView({
  roomCode,
  players,
  currentPlayer,
  onSubmit,
}: {
  roomCode: string;
  players: Player[];
  currentPlayer: Player | null;
  onSubmit: (selections: Record<string, Selection | null>) => void;
}) {
  const seed = hashString(roomCode + "day1");

  const myName = currentPlayer?.name ||
    (typeof window !== "undefined" ? localStorage.getItem("cls.name") || "You" : "You");

  // Character data (from localStorage or regenerate from seed)
  const character = useMemo(() => {
    const savedMajor =
      typeof window !== "undefined"
        ? localStorage.getItem("cls.major")
        : null;
    const savedPos =
      typeof window !== "undefined"
        ? localStorage.getItem("cls.posTrait")
        : null;
    const savedNeg =
      typeof window !== "undefined"
        ? localStorage.getItem("cls.negTrait")
        : null;

    const major =
      currentPlayer?.major ||
      savedMajor ||
      MAJORS[hashString(myName + roomCode) % MAJORS.length];
    const posTrait =
      currentPlayer?.pos_trait ||
      savedPos ||
      POSITIVE_TRAITS[
        hashString(myName + roomCode + "pos") % POSITIVE_TRAITS.length
      ];
    const negTrait =
      currentPlayer?.neg_trait ||
      savedNeg ||
      NEGATIVE_TRAITS[
        hashString(myName + roomCode + "neg") % NEGATIVE_TRAITS.length
      ];

    return { major, posTrait, negTrait };
  }, [currentPlayer?.major, currentPlayer?.neg_trait, currentPlayer?.pos_trait, myName, roomCode]);

  const publicEvent = useMemo<PublicEvent | null>(
    () => PUBLIC_EVENT_POOL[seed % PUBLIC_EVENT_POOL.length],
    [seed]
  );

  const privateEvents = useMemo<PrivateEvent[]>(() => {
    const idx1 = seed % PRIVATE_EVENT_POOL.length;
    const idx2 = (seed + 3) % PRIVATE_EVENT_POOL.length;
    return idx1 === idx2
      ? [PRIVATE_EVENT_POOL[idx1]]
      : [PRIVATE_EVENT_POOL[idx1], PRIVATE_EVENT_POOL[idx2]];
  }, [seed]);

  const relationships = useMemo<Relationship[]>(() => {
    return players
      .map((p) => ({
        playerId: p.id,
        name: p.name,
        level: hashString(p.name + roomCode) % 4,
      }))
      .sort((a, b) => b.level - a.level);
  }, [players, roomCode]);

  /* ---- state ------------------------------------------------------- */
  const [selections, setSelections] = useState<Record<string, Selection | null>>({
    morning: null,
    afternoon: null,
    night: null,
  });
  const [pickingSlot, setPickingSlot] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [submitted, setSubmitted] = useState(false);
  const [statsPopupPlayer, setStatsPopupPlayer] = useState<Player | null>(null);
  // relationships always show top 3, no toggle needed
  const [infoPopup, setInfoPopup] = useState<
    | { type: "major"; name: string }
    | { type: "pos"; name: string }
    | { type: "neg"; name: string }
    | null
  >(null);

  useEffect(() => {
    if (submitted || timer <= 0) return;
    const t = setInterval(() => setTimer((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [submitted, timer]);

  /* ---- derived ----------------------------------------------------- */
  const currentWeek = 1;
  const currentDayIndex = 0;
  const currentDayName = DAY_NAMES[currentDayIndex];
  const dayLabel = `Week ${currentWeek} · ${currentDayName}`;

  const classSchedule = useMemo(() => {
    if (Array.isArray(currentPlayer?.class_schedule) && currentPlayer.class_schedule.length > 0) {
      return currentPlayer.class_schedule;
    }

    const days = [0, 1, 2, 3];
    const out: { day: number; slot: "morning" | "afternoon" }[] = [];
    let s = seed;
    const used = new Set<number>();
    while (out.length < 3 && used.size < days.length) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const d = days[s % days.length];
      if (!used.has(d)) {
        used.add(d);
        out.push({
          day: d,
          slot: s % 2 === 0 ? "morning" : "afternoon",
        });
      }
    }
    return out;
  }, [currentPlayer?.class_schedule, seed]);

  const hasClassMorning = classSchedule.some(
    (c) => c.day === currentDayIndex && c.slot === "morning"
  );
  const hasClassAfternoon = classSchedule.some(
    (c) => c.day === currentDayIndex && c.slot === "afternoon"
  );
  const workAvailability = {
    morning: !hasClassMorning,
    afternoon: !hasClassAfternoon,
  };
  const classesThisWeek = classSchedule.length;
  const classesAttended = 0; // TODO: track from resolved days
  const studiesThisWeek = 0;

  const fallbackAllocated = useMemo(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem("cls.stats")
          : null;
      return raw
        ? (JSON.parse(raw) as Record<string, number>)
        : { academics: 0, social: 0, wellbeing: 0, money: 0 };
    } catch {
      return { academics: 0, social: 0, wellbeing: 0, money: 0 };
    }
  }, []);

  const stats = {
    academics: currentPlayer?.academics ?? 1 + (fallbackAllocated.academics || 0),
    social: currentPlayer?.social ?? 1 + (fallbackAllocated.social || 0),
    wellbeing: currentPlayer?.wellbeing ?? 5 + (fallbackAllocated.wellbeing || 0),
    money: currentPlayer?.money ?? 2 + (fallbackAllocated.money || 0),
  };
  const baseStats = { academics: 1, social: 1, wellbeing: 5, money: 2 };
  const allFilled = selections.morning && selections.afternoon && selections.night;

  const dayGains = useMemo(
    () => calculateDayGains(selections, hasClassMorning, hasClassAfternoon),
    [selections, hasClassMorning, hasClassAfternoon]
  );

  const usedWildcardToday = pickingSlot
    ? Object.entries(selections).some(
        ([slot, sel]) => sel?.actionId === "wildcard" && slot !== pickingSlot
      )
    : false;

  const playerStatuses = useMemo(
    () =>
      players.map((p) => {
        if (p.eliminated) {
          return { ...p, status: "goner" as const };
        }
        const isMe = p.name === myName;
        if (isMe) {
          return { ...p, status: submitted ? ("done" as const) : ("thinking" as const) };
        }
        if (getDummyBehavior(p.name)) {
          return { ...p, status: "done" as const };
        }

        // Deterministic mock status for non-dummy players
        const done = hashString(p.name + roomCode + "status") % 3 !== 0;
        return { ...p, status: done ? ("done" as const) : ("thinking" as const) };
      }),
    [players, myName, submitted, roomCode]
  );

  /* ---- handlers ---------------------------------------------------- */
  const openPicker = (slot: string) => setPickingSlot(slot);
  const closePicker = () => setPickingSlot(null);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => onSubmit(selections), 800);
  };

  // always top 3

  /* ---- render ------------------------------------------------------ */
  return (
    <div className="flex flex-1 min-w-0">
      {/* LEFT SIDEBAR */}
      <aside className="w-72 shrink-0 overflow-y-auto border-r border-card-border bg-card/40 p-5 space-y-5">
        {/* Character */}
        <section>
          <p className="text-xs uppercase tracking-widest text-muted mb-3">
            Character: {myName}
          </p>
          <div className="space-y-2">
            <button
              onClick={() =>
                setInfoPopup({ type: "major", name: character.major })
              }
              className="w-full text-left rounded-lg border border-[#F3E5AB]/20 bg-[#F3E5AB]/5 px-3 py-2.5 hover:border-[#F3E5AB]/40 transition"
            >
              <p className="text-xs text-[#F3E5AB] mb-0.5">Major</p>
              <p className="text-sm text-paper font-medium truncate">
                {character.major}
              </p>
            </button>
            <button
              onClick={() =>
                setInfoPopup({ type: "pos", name: character.posTrait })
              }
              className="w-full text-left rounded-lg border border-green-400/20 bg-green-400/5 px-3 py-2.5 hover:border-green-400/40 transition"
            >
              <p className="text-xs text-green-400 mb-0.5">Positive Trait</p>
              <p className="text-sm text-paper font-medium truncate">
                {character.posTrait}
              </p>
            </button>
            <button
              onClick={() =>
                setInfoPopup({ type: "neg", name: character.negTrait })
              }
              className="w-full text-left rounded-lg border border-accent/20 bg-accent/5 px-3 py-2.5 hover:border-accent/40 transition"
            >
              <p className="text-xs text-accent mb-0.5">Negative Trait</p>
              <p className="text-sm text-paper font-medium truncate">
                {character.negTrait}
              </p>
            </button>
          </div>
        </section>

        {/* Stats */}
        <section>
          <p className="text-xs uppercase tracking-widest text-muted mb-3">
            Stats
          </p>
          <div className="space-y-2.5">
            {(
              [
                ["Academics", "academics"] as const,
                ["Social", "social"] as const,
                ["Wellbeing", "wellbeing"] as const,
                ["Money", "money"] as const,
              ] as const
            ).map(([label, key]) => {
              const value = stats[key as keyof typeof stats];
              const base = baseStats[key as keyof typeof baseStats];
              const added = value - base;
              const decay = DAILY_DECAY[key as keyof typeof DAILY_DECAY];
              const gain = dayGains[key] || 0;
              const netGain = gain + decay;
              const projected = value + netGain;
              const barMax = 10;

              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-paper font-medium">{label}</span>
                    <span className="text-muted">
                      {value.toFixed(2)}
                      <span className="text-red-900/40 ml-1.5">
                        ({decay.toFixed(2)})
                      </span>
                      {allFilled && (
                        <>
                          <span className="text-white ml-1.5">
                            {gain >= 0 ? "+" : ""}
                            {gain.toFixed(2)}
                          </span>
                          <span className="text-muted ml-1.5">
                            → {projected.toFixed(2)}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden relative">
                    <div className="h-full flex">
                      <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{ width: `${Math.min((base / barMax) * 100, 100)}%` }}
                      />
                      <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{ width: `${Math.min((added / barMax) * 100, 100)}%` }}
                      />
                    </div>
                    {allFilled && netGain > 0 && (
                      <div
                        className="absolute top-0 h-full bg-white/80 transition-all duration-300"
                        style={{
                          left: `${Math.min((value / barMax) * 100, 100)}%`,
                          width: `${Math.min((netGain / barMax) * 100, 100)}%`,
                        }}
                      />
                    )}
                    {allFilled && netGain < 0 && (
                      <div
                        className="absolute top-0 h-full bg-red-900/50 transition-all duration-300"
                        style={{
                          left: `${Math.max(0, (projected / barMax) * 100)}%`,
                          width: `${Math.min((Math.abs(netGain) / barMax) * 100, 100)}%`,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Calendar + trackers */}
        <section>
          <p className="text-xs uppercase tracking-widest text-muted mb-3">
            Calendar
          </p>
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-3">
            {DAY_NAMES.map((d, i) => (
              <div
                key={d}
                className={`py-1 rounded ${
                  i === currentDayIndex
                    ? "bg-accent text-paper font-bold"
                    : "text-muted"
                }`}
              >
                {d}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Classes this week</span>
                <span className="text-paper font-medium">
                  {classesAttended} / {classesThisWeek}
                </span>
              </div>
              <div className="h-1.5 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#4f8cd9]"
                  style={{
                    width: `${(classesAttended / Math.max(1, classesThisWeek)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Studies this week</span>
                <span className="text-paper font-medium">
                  {studiesThisWeek} / 4
                </span>
              </div>
              <div className="h-1.5 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent-soft"
                  style={{ width: `${(studiesThisWeek / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Relationships */}
        <section>
          <p className="text-xs uppercase tracking-widest text-muted mb-3">
            Relationships
          </p>
          <div className="space-y-2">
            {relationships.slice(0, 3).map((r) => (
              <div key={r.playerId} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: getAvatarColor(r.name) }}
                >
                  {getInitials(r.name)}
                </div>
                <span className="text-sm text-paper">{r.name}</span>
                <span className="ml-auto text-xs text-accent-soft font-bold">
                  Lvl {r.level}
                </span>
              </div>
            ))}
          </div>
        </section>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-card-border bg-background/80 backdrop-blur-sm">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted">
              {dayLabel}
            </p>
            <h1 className="text-lg font-bold text-paper">Plan Your Day</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 overflow-x-auto">
              {playerStatuses.map((p) => {
                const color = getAvatarColor(p.name);
                const isGoner = p.status === "goner";
                return (
                  <button
                    key={p.id}
                    className="flex items-center gap-2 shrink-0 text-left"
                    onClick={() => { if (!isMe) setStatsPopupPlayer(p); }}
                  >
                    <div
                      className={`relative w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-white transition ${
                        isGoner ? "grayscale opacity-50" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {getInitials(p.name)}
                      {p.status === "done" && !isGoner && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-background flex items-center justify-center">
                          <svg className="w-2 h-2 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                      {p.status === "thinking" && !isGoner && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent-soft border-2 border-background flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-background animate-pulse" />
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-xs font-medium leading-tight ${isGoner ? "text-muted line-through" : "text-paper"}`}>
                        {p.name}
                      </span>
                      <span
                        className={`text-[10px] leading-tight font-medium ${
                          isGoner ? "text-muted" : p.status === "thinking" ? "text-accent-soft" : "text-green-400"
                        }`}
                      >
                        {isGoner ? "Goner" : p.status === "thinking" ? "Thinking…" : "Done"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              className={`px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${
                timer <= 10
                  ? "bg-accent text-paper"
                  : "bg-card border border-card-border text-paper"
              }`}
            >
              0:{timer.toString().padStart(2, "0")}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Event Banners — side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publicEvent ? (
              <EventBanner event={publicEvent} type="public" />
            ) : (
              <div className="rounded-xl border border-dashed border-card-border bg-background/30 p-4 flex items-center justify-center min-h-[100px]">
                <p className="text-sm text-muted">No public events today</p>
              </div>
            )}
            {privateEvents[0] ? (
              <EventBanner event={privateEvents[0]} type="private" />
            ) : (
              <div className="rounded-xl border border-dashed border-card-border bg-background/30 p-4 flex items-center justify-center min-h-[100px]">
                <p className="text-sm text-muted">No private events today</p>
              </div>
            )}
          </div>

          {/* Slot Cards */}
          <SlotCard
            slot="morning"
            label="Morning"
            icon="☀️"
            selection={selections.morning}
            hasClass={hasClassMorning}
            players={players}
            onClick={() => openPicker("morning")}
          />
          <SlotCard
            slot="afternoon"
            label="Afternoon"
            icon="🌤"
            selection={selections.afternoon}
            hasClass={hasClassAfternoon}
            players={players}
            onClick={() => openPicker("afternoon")}
          />
          <SlotCard
            slot="night"
            label="Night"
            icon="🌙"
            selection={selections.night}
            hasClass={false}
            players={players}
            onClick={() => openPicker("night")}
          />

          {/* Submit */}
          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={!allFilled || submitted}
              className={`w-full py-3 rounded-xl font-semibold transition active:translate-y-0.5 ${
                allFilled && !submitted
                  ? "bg-accent text-paper hover:bg-accent/90 shadow-lg shadow-accent/20"
                  : "bg-card-border text-muted cursor-not-allowed"
              }`}
            >
              {submitted
                ? "Submitted"
                : allFilled
                ? "Submit Day →"
                : "Fill all 3 slots"}
            </button>
          </div>
        </div>
      </div>

      {/* Action Picker */}
      {pickingSlot && (
        <ActionPicker
          slot={pickingSlot}
          hasClass={
            pickingSlot === "morning"
              ? hasClassMorning
              : pickingSlot === "afternoon"
              ? hasClassAfternoon
              : false
          }
          workAvailable={
            pickingSlot === "morning"
              ? workAvailability.morning
              : pickingSlot === "afternoon"
              ? workAvailability.afternoon
              : false
          }
          players={players}
          heldCodes={privateEvents.map((e) => ({ code: e.code, name: e.name }))}
          usedWildcard={usedWildcardToday}
          currentSelection={selections[pickingSlot]}
          onSelect={(sel) => {
            setSelections((prev) => ({ ...prev, [pickingSlot]: sel }));
          }}
          onConfirm={() => closePicker()}
          onClose={closePicker}
        />
      )}

      {/* Info Popup */}
      {infoPopup && (
        <InfoPopup popup={infoPopup} onClose={() => setInfoPopup(null)} />
      )}

      {/* Player Stats Popup */}
      {statsPopupPlayer && (
        <PlayerStatsPopup player={statsPopupPlayer} onClose={() => setStatsPopupPlayer(null)} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
// Player Stats Popup

function PlayerStatsPopup({
  player,
  onClose,
}: {
  player: Player;
  onClose: () => void;
}) {
  const seed = hashString(player.name + "stats");
  const mockStats = {
    academics: 1 + (seed % 50) / 10,
    social: 1 + ((seed >> 4) % 50) / 10,
    wellbeing: 3 + ((seed >> 8) % 50) / 10,
    money: ((seed >> 12) % 40) / 10,
  };
  const stats = {
    academics: player.academics ?? mockStats.academics,
    social: player.social ?? mockStats.social,
    wellbeing: player.wellbeing ?? mockStats.wellbeing,
    money: player.money ?? mockStats.money,
  };
  const color = getAvatarColor(player.name);
  const isGoner = player.eliminated;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 rounded-xl border border-card-border bg-card p-4 shadow-xl"
        style={{ top: "4.5rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-l border-t border-card-border rotate-45" />

        <div className="flex items-center gap-2 mb-3">
          <div
            className={`w-8 h-8 rounded-full border border-background flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
              isGoner ? "grayscale opacity-50" : ""
            }`}
            style={{ backgroundColor: color }}
          >
            {getInitials(player.name)}
          </div>
          <div>
            <p className={`text-sm font-bold leading-tight ${isGoner ? "text-muted line-through" : "text-paper"}`}>
              {player.name}
            </p>
            {isGoner && <p className="text-[10px] text-muted">Eliminated</p>}
            {player.major && !isGoner && <p className="text-[10px] text-[#F3E5AB]">{player.major}</p>}
          </div>
        </div>

        <div className="space-y-2">
          {(
            [
              ["Academics", stats.academics] as const,
              ["Social", stats.social] as const,
              ["Wellbeing", stats.wellbeing] as const,
              ["Money", stats.money] as const,
            ] as const
          ).map(([label, val]) => (
            <div key={label}>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-muted">{label}</span>
                <span className="text-paper font-medium">{val.toFixed(2)}</span>
              </div>
              <div className="h-1.5 bg-background rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isGoner ? "bg-muted" : "bg-accent"}`}
                  style={{ width: `${Math.min((val / 10) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {(player.pos_trait || player.neg_trait) && !isGoner && (
          <div className="mt-2 pt-2 border-t border-card-border space-y-1">
            {player.pos_trait && <p className="text-[10px] text-green-400">● {player.pos_trait}</p>}
            {player.neg_trait && <p className="text-[10px] text-accent">● {player.neg_trait}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
// Info Popup

function InfoPopup({
  popup,
  onClose,
}: {
  popup: { type: "major" | "pos" | "neg"; name: string };
  onClose: () => void;
}) {
  const isMajor = popup.type === "major";
  const isPos = popup.type === "pos";

  let title = popup.name;
  let desc = "";
  let effect = "";
  let accentColor = "";
  let badgeColor = "";
  let badgeText = "";

  if (isMajor) {
    const data = MAJOR_DATA[popup.name];
    desc = data?.focus || "";
    effect = data?.weights || "";
    accentColor = "#F3E5AB";
    badgeColor = "bg-[#F3E5AB]/10 text-[#F3E5AB]";
    badgeText = "Major";
  } else if (isPos) {
    const data = POSITIVE_TRAIT_DATA[popup.name];
    desc = data?.desc || "";
    effect = data?.effect || "";
    accentColor = "#4ade80";
    badgeColor = "bg-green-400/10 text-green-400";
    badgeText = "Positive Trait";
  } else {
    const data = NEGATIVE_TRAIT_DATA[popup.name];
    desc = data?.desc || "";
    effect = data?.effect || "";
    accentColor = "#d94f4f";
    badgeColor = "bg-accent/10 text-accent";
    badgeText = "Negative Trait";
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute left-80 mt-16 w-64 rounded-xl border border-card-border bg-card p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="absolute -top-1.5 left-8 w-3 h-3 bg-card border-l border-t border-card-border rotate-45"
        />

        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${badgeColor}`}>
            {badgeText}
          </span>
        </div>

        <h3 className="text-base font-bold text-paper mb-2">{title}</h3>

        <p className="text-xs text-paper/80 leading-relaxed mb-3">{desc}</p>

        <div
          className="rounded-lg p-2.5 border"
          style={{
            backgroundColor: accentColor + "10",
            borderColor: accentColor + "20",
          }}
        >
          <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Effect</p>
          <p className="text-xs font-medium" style={{ color: accentColor }}>
            {effect}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
// Event Banner

function EventBanner({
  event,
  type,
}: {
  event: PublicEvent | PrivateEvent;
  type: "public" | "private";
}) {
  const isPublic = type === "public";

  const border = isPublic
    ? "border-[#f0a868]/20"
    : "border-[#4f8cd9]/20";
  const bg = isPublic
    ? "bg-gradient-to-br from-[#f0a868]/10 via-[#d94f4f]/5 to-transparent"
    : "bg-gradient-to-br from-[#4fd9c9]/10 via-[#4f8cd9]/5 to-transparent";
  const label = isPublic ? "text-[#f0a868]" : "text-[#7ab8e8]";
  const effect = isPublic ? "text-[#f0a868]" : "text-[#a8d5f0]";

  return (
    <div
      className={`relative rounded-xl overflow-hidden border ${border} ${bg} p-4`}
    >
      {/* gradient top strip */}
      <div
        className={`absolute top-0 left-0 w-full h-0.5 ${
          isPublic
            ? "bg-gradient-to-r from-[#f0a868]/60 via-[#d94f4f]/40 to-[#d94f4f]/30"
            : "bg-gradient-to-r from-[#4fd9c9]/60 via-[#4f8cd9]/40 to-[#4f8cd9]/30"
        }`}
      />

      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0 mt-0.5">
          {isPublic ? "📢" : "🔒"}
        </span>
        <div className="min-w-0">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${label}`}
          >
            {isPublic ? "Public Event" : "Private Event"}
          </span>
          <h3 className="text-lg font-bold text-paper mt-0.5 mb-1">
            {event.name}
          </h3>
          <p className="text-sm text-paper/70 leading-relaxed">
            {event.flavor}
          </p>
          <p className={`text-xs font-semibold mt-2 ${effect}`}>
            Effect: {event.effect}
          </p>
          {!isPublic && "code" in event && (
            <p className="text-xs text-muted font-mono mt-1">
              Code: {event.code}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
// Action effect helper

function getActionEffect(
  actionId: string,
  slot: string,
  spend?: number
): string {
  switch (actionId) {
    case "class":
      return "Academics +0.75, Social +0.25";
    case "study":
      return "Academics +1";
    case "studyTogether":
      return "Academics +0.75, Social +0.5";
    case "work":
      return "Money +1";
    case "exercise":
      return "Wellbeing +1";
    case "socialize": {
      if (spend === 1) return "Social +1.25, Money −0.25";
      if (spend === 2) return "Social +1.5, Money −0.5";
      return "Social +1";
    }
    case "rest":
      return "Wellbeing +0.5";
    case "sleep":
      return "Wellbeing +1";
    case "wildcard":
      return "Random event card";
    default:
      return "";
  }
}

/* ------------------------------------------------------------------ */
// Slot Card

function SlotCard({
  slot,
  label,
  icon,
  selection,
  hasClass,
  players,
  onClick,
}: {
  slot: string;
  label: string;
  icon: string;
  selection: Selection | null;
  hasClass: boolean;
  players: Player[];
  onClick: () => void;
}) {
  const targetName = selection?.targetId
    ? players.find((p) => p.id === selection.targetId)?.name
    : null;

  const spendLabel =
    selection?.spend === 1 ? "· Coffee" : selection?.spend === 2 ? "· Dinner" : "";

  const skippingClass = hasClass && selection?.actionId !== "class";
  const effectText = selection
    ? getActionEffect(selection.actionId, slot, selection.spend)
    : "";

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-card-border bg-card p-5 text-left transition hover:border-muted active:translate-y-0.5"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-bold text-paper">{label}</span>
          {hasClass && !selection && (
            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-md font-medium">
              Class scheduled
            </span>
          )}
        </div>
        {selection ? (
          skippingClass ? (
            <span className="text-xs text-accent font-medium">⚠️ Skip</span>
          ) : (
            <span className="text-xs text-green-400 font-medium">Set</span>
          )
        ) : (
          <span className="text-xs text-muted">Choose…</span>
        )}
      </div>

      {selection ? (
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">
            {selection.actionId === "class" && "🎓"}
            {selection.actionId === "study" && "📚"}
            {selection.actionId === "studyTogether" && "👥"}
            {selection.actionId === "work" && "💼"}
            {selection.actionId === "exercise" && "🏃"}
            {selection.actionId === "socialize" && "💬"}
            {selection.actionId === "rest" && "🛋️"}
            {selection.actionId === "sleep" && "😴"}
            {selection.actionId === "wildcard" && "🃏"}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-paper capitalize">
              {selection.actionId.replace(/([A-Z])/g, " $1").trim()}
              {spendLabel}
            </p>
            {effectText && (
              <p className="text-xs text-accent-soft font-medium mt-0.5">
                {effectText}
              </p>
            )}
            {targetName && (
              <p className="text-xs text-muted">with {targetName}</p>
            )}
            {selection.actionId === "wildcard" && selection.code && (
              <p className="text-xs text-accent font-mono">
                {selection.code}
              </p>
            )}
            {skippingClass && (
              <p className="text-xs text-accent mt-1">
                Skipping class — Academics −0.5
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">Tap to pick an action</p>
      )}
    </button>
  );
}
