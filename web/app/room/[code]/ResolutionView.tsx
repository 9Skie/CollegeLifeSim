"use client";

import { useEffect, useMemo, useState } from "react";
import { Selection } from "./ActionPicker";

type Player = { id: string; name: string };

const DAILY_DECAY = {
  academics: -0.5,
  social: -0.5,
  wellbeing: -0.5,
  money: -1.0,
};

const OUTCOMES = [
  { key: "bad", label: "Bad", color: "#d94f4f", mult: 0.75, icon: "💀" },
  { key: "normal", label: "Normal", color: "#F3E5AB", mult: 1.0, icon: "😐" },
  { key: "good", label: "Good", color: "#5b8c5a", mult: 1.25, icon: "✨" },
] as const;

const PRIVATE_EVENT_POOL = [
  { id: "p1", name: "Secret Study Group", code: "STUDY-01", flavor: "A grad student posted a cryptic flyer in the STEM building basement.", effect: "Academics +1.75", color: "#4f8cd9", icon: "📚" },
  { id: "p2", name: "Underground Poker", code: "POKER-02", flavor: "Someone slid a chip under your door with an address and a time.", effect: "Money +3 or −2", color: "#f0a868", icon: "🎰" },
  { id: "p3", name: "VIP Concert", code: "VIP-03", flavor: "A friend-of-a-friend works venue security and has two backstage passes.", effect: "Social +1.75, Wellbeing +0.5", color: "#9d4edd", icon: "🎫" },
  { id: "p4", name: "Office Hours Invite", code: "OFFICE-04", flavor: "The professor you've been avoiding emailed you directly.", effect: "Academics +2, Money −0.25", color: "#4f8cd9", icon: "🎓" },
  { id: "p5", name: "Greek Mixer", code: "GREEK-05", flavor: "A handwritten invitation taped to your dorm door.", effect: "Social +1.75", color: "#9d4edd", icon: "🍾" },
  { id: "p6", name: "Insider Internship", code: "INTERN-06", flavor: "Your advisor forwarded an email with the subject 'URGENT — not a mass email.'", effect: "Money +1.75", color: "#f0a868", icon: "💼" },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getActionLabel(id: string): string {
  const map: Record<string, string> = {
    class: "Class", study: "Study", studyTogether: "Study Together",
    work: "Work", exercise: "Exercise", socialize: "Socialize",
    rest: "Rest", sleep: "Sleep", wildcard: "Wildcard",
  };
  return map[id] || id;
}

function getActionIcon(id: string): string {
  const map: Record<string, string> = {
    class: "🎓", study: "📚", studyTogether: "👥",
    work: "💼", exercise: "🏃", socialize: "💬",
    rest: "🛋️", sleep: "😴", wildcard: "🃏",
  };
  return map[id] || "❓";
}

function getActionEffect(id: string, spend?: number): string {
  switch (id) {
    case "class": return "Academics +0.75, Social +0.25";
    case "study": return "Academics +1";
    case "studyTogether": return "Academics +0.75, Social +0.5";
    case "work": return "Money +1";
    case "exercise": return "Wellbeing +1";
    case "socialize":
      if (spend === 1) return "Social +1.25, Money −0.25";
      if (spend === 2) return "Social +1.5, Money −0.5";
      return "Social +1";
    case "rest": return "Wellbeing +0.5";
    case "sleep": return "Wellbeing +1";
    case "wildcard": return "Random event card";
    default: return "";
  }
}

function calculateSlotGain(
  sel: Selection | null,
  slot: string,
  hasClass: boolean
): Record<string, number> {
  const gain = { academics: 0, social: 0, wellbeing: 0, money: 0 };
  if (!sel) return gain;
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
      if (spend === 2) { gain.social += 1.5; gain.money -= 0.5; }
      else if (spend === 1) { gain.social += 1.25; gain.money -= 0.25; }
      else { gain.social += 1; }
      break;
    }
    case "rest":
      gain.wellbeing += 0.5;
      break;
    case "sleep":
      gain.wellbeing += 1;
      break;
  }
  if (hasClass && sel.actionId !== "class") {
    gain.academics -= 0.5;
  }
  return gain;
}

function applyMultiplier(
  gain: Record<string, number>,
  mult: number
): Record<string, number> {
  return {
    academics: gain.academics * mult,
    social: gain.social * mult,
    wellbeing: gain.wellbeing * mult,
    money: gain.money * mult,
  };
}

/* ------------------------------------------------------------------ */

export default function ResolutionView({
  selections,
  players,
  onNextDay,
}: {
  selections: Record<string, Selection | null>;
  players: Player[];
  onNextDay: () => void;
}) {
  const roomCode = "ABCD";
  const myName =
    typeof window !== "undefined"
      ? localStorage.getItem("cls.name") || "You"
      : "You";

  const seed = hashString(roomCode + "day1");
  const classSchedule = useMemo(() => {
    const days = [0, 1, 2, 3];
    const out: { day: number; slot: "morning" | "afternoon" }[] = [];
    let s = seed;
    const used = new Set<number>();
    while (out.length < 3 && used.size < days.length) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const d = days[s % days.length];
      if (!used.has(d)) {
        used.add(d);
        out.push({ day: d, slot: s % 2 === 0 ? "morning" : "afternoon" });
      }
    }
    return out;
  }, [seed]);

  const hasClassMorning = classSchedule.some((c) => c.day === 0 && c.slot === "morning");
  const hasClassAfternoon = classSchedule.some((c) => c.day === 0 && c.slot === "afternoon");

  const allocated = useMemo(() => {
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

  const startStats = {
    academics: 1 + (allocated.academics || 0),
    social: 1 + (allocated.social || 0),
    wellbeing: 5 + (allocated.wellbeing || 0),
    money: 2 + (allocated.money || 0),
  };

  /* ---- outcomes: 20% bad, 60% normal, 20% good --------------------- */
  const morningOutcomeIdx = hashString(myName + roomCode + "morning") % 100;
  const afternoonOutcomeIdx = hashString(myName + roomCode + "afternoon") % 100;
  const nightOutcomeIdx = hashString(myName + roomCode + "night") % 100;

  const toOutcomeIndex = (n: number) => {
    if (n < 20) return 0;
    if (n < 80) return 1;
    return 2;
  };

  const morningOI = toOutcomeIndex(morningOutcomeIdx);
  const afternoonOI = toOutcomeIndex(afternoonOutcomeIdx);
  const nightOI = toOutcomeIndex(nightOutcomeIdx);

  /* ---- gains ------------------------------------------------------- */
  const morningGain = calculateSlotGain(selections.morning, "morning", hasClassMorning);
  const afternoonGain = calculateSlotGain(selections.afternoon, "afternoon", hasClassAfternoon);
  const nightGain = calculateSlotGain(selections.night, "night", false);

  const morningFinal = applyMultiplier(morningGain, OUTCOMES[morningOI].mult);
  const afternoonFinal = applyMultiplier(afternoonGain, OUTCOMES[afternoonOI].mult);
  const nightFinal = applyMultiplier(nightGain, OUTCOMES[nightOI].mult);

  const totalGain = useMemo(() => ({
    academics: morningFinal.academics + afternoonFinal.academics + nightFinal.academics,
    social: morningFinal.social + afternoonFinal.social + nightFinal.social,
    wellbeing: morningFinal.wellbeing + afternoonFinal.wellbeing + nightFinal.wellbeing,
    money: morningFinal.money + afternoonFinal.money + nightFinal.money,
  }), [morningFinal, afternoonFinal, nightFinal]);

  const endStats = {
    academics: startStats.academics + DAILY_DECAY.academics + totalGain.academics,
    social: startStats.social + DAILY_DECAY.social + totalGain.social,
    wellbeing: startStats.wellbeing + DAILY_DECAY.wellbeing + totalGain.wellbeing,
    money: startStats.money + DAILY_DECAY.money + totalGain.money,
  };

  /* ---- wildcard ---------------------------------------------------- */
  const wildcardSlot = useMemo(() => {
    for (const slot of ["morning", "afternoon", "night"] as const) {
      if (selections[slot]?.actionId === "wildcard") return slot;
    }
    return null;
  }, [selections]);

  const wildcardEvent = useMemo(() => {
    if (!wildcardSlot) return null;
    const idx = hashString(myName + roomCode + "wildcard") % PRIVATE_EVENT_POOL.length;
    return PRIVATE_EVENT_POOL[idx];
  }, [wildcardSlot, myName, roomCode]);

  /* ---- sequential fade-in + landing states ------------------------- */
  const [showMorning, setShowMorning] = useState(false);
  const [morningLanded, setMorningLanded] = useState(false);
  const [showAfternoon, setShowAfternoon] = useState(false);
  const [afternoonLanded, setAfternoonLanded] = useState(false);
  const [showNight, setShowNight] = useState(false);
  const [nightLanded, setNightLanded] = useState(false);
  const [showWildcard, setShowWildcard] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowMorning(true), 200);
    const t1b = setTimeout(() => setMorningLanded(true), 2000);
    const t2 = setTimeout(() => setShowAfternoon(true), 2200);
    const t2b = setTimeout(() => setAfternoonLanded(true), 4000);
    const t3 = setTimeout(() => setShowNight(true), 4200);
    const t3b = setTimeout(() => setNightLanded(true), 6000);
    const t4 = setTimeout(() => {
      if (wildcardSlot) setShowWildcard(true);
      else setShowStats(true);
    }, 7200);
    const t5 = setTimeout(() => setShowStats(true), wildcardSlot ? 10200 : 7200);
    return () =>
      [t1, t1b, t2, t2b, t3, t3b, t4, t5].forEach(clearTimeout);
  }, [wildcardSlot]);

  const slotData = [
    { key: "morning" as const, label: "Morning", icon: "☀️", hasClass: hasClassMorning, sel: selections.morning, gain: morningGain, oi: morningOI, show: showMorning, landed: morningLanded },
    { key: "afternoon" as const, label: "Afternoon", icon: "🌤", hasClass: hasClassAfternoon, sel: selections.afternoon, gain: afternoonGain, oi: afternoonOI, show: showAfternoon, landed: afternoonLanded },
    { key: "night" as const, label: "Night", icon: "🌙", hasClass: false, sel: selections.night, gain: nightGain, oi: nightOI, show: showNight, landed: nightLanded },
  ];

  return (
    <div className="flex-1 flex flex-col items-center p-6 overflow-auto">
      <div className="w-full max-w-xl space-y-5 pb-8">
        {/* Header */}
        <div className="text-center pt-4">
          <p className="text-muted text-sm uppercase tracking-widest mb-2">
            Day 1 Resolved
          </p>
          <h1 className="text-3xl font-bold text-paper">How did it go?</h1>
        </div>

        {/* Slot sections — fade in one at a time */}
        {slotData.map((s) => {
          const targetName = s.sel?.targetId
            ? players.find((p) => p.id === s.sel?.targetId)?.name
            : null;
          const outcome = OUTCOMES[s.oi];
          return (
            <div
              key={s.key}
              className={`rounded-2xl border border-card-border bg-card p-5 transition-all duration-500 ${
                s.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              {/* Slot header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{s.icon}</span>
                <span className="font-bold text-paper">{s.label}</span>
              </div>

              {/* Action card + roulette row, matched height */}
              <div className="flex gap-3 items-stretch">
                {/* Action card with result badge inside */}
                <div className="flex-1 min-w-0">
                  {s.sel ? (
                    <div className="flex items-center gap-3 rounded-xl border border-card-border bg-background/50 px-4 py-3 min-h-[66px]">
                      <span className="text-2xl shrink-0">{getActionIcon(s.sel.actionId)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-paper">
                          {getActionLabel(s.sel.actionId)}
                          {s.sel.spend === 1 && " · Coffee"}
                          {s.sel.spend === 2 && " · Dinner"}
                        </p>
                        <p className="text-xs text-muted">
                          {getActionEffect(s.sel.actionId, s.sel.spend)}
                        </p>
                        {targetName && (
                          <p className="text-xs text-muted">with {targetName}</p>
                        )}
                      </div>

                      {/* Result badge — inside card, right side */}
                      {s.landed && (
                        <div className="shrink-0 flex flex-col items-end gap-0.5">
                          <span
                            className="text-xs font-bold"
                            style={{ color: outcome.color }}
                          >
                            {outcome.icon} {outcome.label}
                          </span>
                          <span className="text-[10px] text-muted">
                            ×{outcome.mult}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted min-h-[66px] flex items-center">
                      No action selected
                    </p>
                  )}
                </div>

                {/* Roulette — stretches to match action card height */}
                <div className="shrink-0 w-28 h-full">
                  <SlotRoulette outcomeIndex={s.oi} show={s.show} />
                </div>
              </div>
            </div>
          );
        })}

        {/* Wildcard */}
        {wildcardSlot && wildcardEvent && (
          <div
            className={`rounded-2xl border border-card-border bg-card p-5 transition-all duration-500 ${
              showWildcard ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🃏</span>
              <span className="font-bold text-paper">Wildcard</span>
            </div>
            <div className="flex justify-center">
              <CardFlip event={wildcardEvent} show={showWildcard} />
            </div>
          </div>
        )}

        {/* Stats */}
        <div
          className={`rounded-2xl border border-card-border bg-card p-6 space-y-4 transition-all duration-500 ${
            showStats ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <p className="text-sm text-muted uppercase tracking-widest text-center">
            Updated Stats
          </p>
          {(
            [
              ["Academics", "academics"] as const,
              ["Social", "social"] as const,
              ["Wellbeing", "wellbeing"] as const,
              ["Money", "money"] as const,
            ] as const
          ).map(([label, key]) => {
            const start = startStats[key];
            const end = endStats[key];
            const change = end - start;
            const barMax = 10;
            return (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-paper font-medium">{label}</span>
                  <span>
                    <span className="text-muted">{start.toFixed(2)}</span>
                    <span className="text-muted ml-1.5">
                      ({change >= 0 ? "+" : ""}
                      {change.toFixed(2)})
                    </span>
                    <span className="text-paper font-bold ml-1.5">
                      → {end.toFixed(2)}
                    </span>
                  </span>
                </div>
                <div className="h-2.5 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-700 ease-out"
                    style={{
                      width: showStats
                        ? `${Math.min((end / barMax) * 100, 100)}%`
                        : `${Math.min((start / barMax) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}

          <div className="text-center pt-2">
            <button
              onClick={onNextDay}
              className="px-8 py-3 rounded-xl font-semibold bg-accent text-paper hover:bg-accent/90 transition active:translate-y-0.5 shadow-lg shadow-accent/20"
            >
              Next Day →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
// Vertical roulette (right side of each slot)

function SlotRoulette({
  outcomeIndex,
  show,
}: {
  outcomeIndex: number;
  show: boolean;
}) {
  const repeat = 12;
  const strip = Array.from({ length: repeat * 3 }, (_, i) => OUTCOMES[i % 3]);
  const targetIdx = (repeat - 1) * 3 + outcomeIndex;

  const tileH = 66; // px, matches min-h of action card
  const containerH = tileH;
  const startOffset = -(Math.floor(strip.length / 2) * tileH) + containerH / 2 - tileH / 2;
  const endOffset = -(targetIdx * tileH) + containerH / 2 - tileH / 2;

  return (
    <div
      className="relative rounded-xl border border-card-border overflow-hidden mx-auto"
      style={{ height: containerH, width: 112 }}
    >
      <div
        className="absolute left-0 w-full"
        style={{
          transform: show ? `translateY(${endOffset}px)` : `translateY(${startOffset}px)`,
          transition: show
            ? "transform 1.8s cubic-bezier(0.25, 1, 0.5, 1)"
            : "none",
        }}
      >
        {strip.map((o, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center gap-0.5 font-bold text-xs"
            style={{
              height: tileH,
              color: o.color,
              backgroundColor: o.color + "12",
              borderBottom: "1px solid " + o.color + "20",
            }}
          >
            <span className="text-lg">{o.icon}</span>
            <span>{o.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
// Card flip

function CardFlip({
  event,
  show,
}: {
  event: (typeof PRIVATE_EVENT_POOL)[0];
  show: boolean;
}) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setFlipped(true), 600);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <div
      className="relative w-56 h-72"
      style={{ perspective: "1000px" }}
    >
      <div
        className="w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl border-2 border-card-border flex flex-col items-center justify-center gap-3"
          style={{
            background: "linear-gradient(135deg, #1a1d24 0%, #0e1014 100%)",
            backfaceVisibility: "hidden",
          }}
        >
          <div className="w-14 h-14 rounded-full border-2 border-card-border flex items-center justify-center text-2xl">
            🃏
          </div>
          <p className="text-base font-bold text-paper">Wildcard</p>
          <div className="absolute inset-3 rounded-xl border border-dashed border-card-border" />
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl border-2 flex flex-col overflow-hidden"
          style={{
            backgroundColor: event.color + "08",
            borderColor: event.color + "40",
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="h-1.5 w-full" style={{ backgroundColor: event.color }} />
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{event.icon}</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: event.color }}>
                  Private Event
                </p>
                <h3 className="text-sm font-bold text-paper leading-tight">{event.name}</h3>
              </div>
            </div>
            <p className="text-xs text-paper/70 leading-relaxed mb-3 flex-1">
              {event.flavor}
            </p>
            <div
              className="rounded-lg p-2.5 border"
              style={{
                backgroundColor: event.color + "10",
                borderColor: event.color + "20",
              }}
            >
              <p className="text-[10px] text-muted mb-0.5">Effect</p>
              <p className="text-xs font-semibold" style={{ color: event.color }}>
                {event.effect}
              </p>
            </div>
            <p className="text-[10px] text-muted font-mono mt-2 text-center">
              {event.code}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
