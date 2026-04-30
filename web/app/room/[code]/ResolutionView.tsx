"use client";

import { useEffect, useMemo, useState } from "react";
import { Selection } from "./ActionPicker";
import type { StoredResolution } from "@/utils/day-resolution";

type Player = { id: string; name: string; eliminated?: boolean };
type CurrentPlayer = {
  id: string;
  name: string;
  academics?: number;
  social?: number;
  wellbeing?: number;
  money?: number;
  class_schedule?: Array<{ day: number; slot: "morning" | "afternoon" }>;
} | null;

const DAILY_DECAY = {
  academics: -0.5,
  social: -0.5,
  wellbeing: -0.5,
  money: -1.0,
};

const OUTCOMES = [
  { key: "bad", label: "Bad", color: "#d94f4f", mult: 0.75, icon: "🥀" },
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

function quantizeQuarter(value: number) {
  const quantized = Math.round(Math.abs(value) * 4) / 4;
  return Math.sign(value) * quantized;
}

function quantizeStats(stats: Record<string, number>) {
  return {
    academics: quantizeQuarter(stats.academics),
    social: quantizeQuarter(stats.social),
    wellbeing: quantizeQuarter(stats.wellbeing),
    money: quantizeQuarter(stats.money),
  };
}

function clampStatsToBounds(stats: Record<string, number>) {
  return {
    academics: Math.min(10, Math.max(0, stats.academics)),
    social: Math.min(10, Math.max(0, stats.social)),
    wellbeing: Math.min(10, Math.max(0, stats.wellbeing)),
    money: Math.min(10, Math.max(0, stats.money)),
  };
}

function getActionLabel(id: string): string {
  const map: Record<string, string> = {
    class: "Class", study: "Study",
    work: "Work", exercise: "Exercise", socialize: "Socialize",
    rest: "Rest", sleep: "Sleep", wildcard: "Wildcard",
  };
  return map[id] || id;
}

function getActionIcon(id: string): string {
  const map: Record<string, string> = {
    class: "🎓", study: "📚",
    work: "💼", exercise: "🏃", socialize: "💬",
    rest: "🛋️", sleep: "😴", wildcard: "🃏",
  };
  return map[id] || "❓";
}

function getActionEffect(id: string, spend?: number): string {
  switch (id) {
    case "class": return "Academics +0.75, Social +0.25";
    case "study": return "Academics +1";
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
  return quantizeStats({
    academics: gain.academics * mult,
    social: gain.social * mult,
    wellbeing: gain.wellbeing * mult,
    money: gain.money * mult,
  });
}

/* ------------------------------------------------------------------ */

export default function ResolutionView({
  roomCode,
  currentDay,
  selections,
  players,
  currentPlayer,
  currentResolution,
  isHost,
  onNextDay,
}: {
  roomCode: string;
  currentDay: number;
  selections: Record<string, Selection | null>;
  players: Player[];
  currentPlayer: CurrentPlayer;
  currentResolution: StoredResolution | null;
  isHost: boolean;
  onNextDay: () => Promise<void>;
}) {
  const myName = currentPlayer?.name ||
    (typeof window !== "undefined" ? localStorage.getItem("cls.name") || "You" : "You");

  const seed = hashString(`${roomCode}:day:${currentDay}`);
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
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
        out.push({ day: d, slot: s % 2 === 0 ? "morning" : "afternoon" });
      }
    }
    return out;
  }, [currentPlayer?.class_schedule, seed]);

  const currentDayIndex = (currentDay - 1) % 7;
  const hasClassMorning = classSchedule.some(
    (c) => c.day === currentDayIndex && c.slot === "morning"
  );
  const hasClassAfternoon = classSchedule.some(
    (c) => c.day === currentDayIndex && c.slot === "afternoon"
  );
  const resolvedSlotResults = currentResolution?.changes?.slotResults || [];

  const outcomeTierToIndex = (tier: string | null | undefined) => {
    if (tier === "bad") return 0;
    if (tier === "good") return 2;
    return 1;
  };

  const resolvedMorning = resolvedSlotResults.find((slot) => slot.slot === "morning");
  const resolvedAfternoon = resolvedSlotResults.find((slot) => slot.slot === "afternoon");
  const resolvedNight = resolvedSlotResults.find((slot) => slot.slot === "night");

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

  const startStats = currentResolution?.old_stats || {
    academics: currentPlayer?.academics ?? 2 + (fallbackAllocated.academics || 0),
    social: currentPlayer?.social ?? 2 + (fallbackAllocated.social || 0),
    wellbeing: currentPlayer?.wellbeing ?? 5 + (fallbackAllocated.wellbeing || 0),
    money: currentPlayer?.money ?? 2 + (fallbackAllocated.money || 0),
  };

  /* ---- outcomes: 20% bad, 60% normal, 20% good --------------------- */
  const morningOutcomeIdx = hashString(`${myName}:${roomCode}:day:${currentDay}:morning`) % 100;
  const afternoonOutcomeIdx = hashString(`${myName}:${roomCode}:day:${currentDay}:afternoon`) % 100;
  const nightOutcomeIdx = hashString(`${myName}:${roomCode}:day:${currentDay}:night`) % 100;

  const toOutcomeIndex = (n: number) => {
    if (n < 20) return 0;
    if (n < 80) return 1;
    return 2;
  };

  const morningOI = resolvedMorning
    ? outcomeTierToIndex(resolvedMorning.outcomeTier)
    : toOutcomeIndex(morningOutcomeIdx);
  const afternoonOI = resolvedAfternoon
    ? outcomeTierToIndex(resolvedAfternoon.outcomeTier)
    : toOutcomeIndex(afternoonOutcomeIdx);
  const nightOI = resolvedNight
    ? outcomeTierToIndex(resolvedNight.outcomeTier)
    : toOutcomeIndex(nightOutcomeIdx);

  /* ---- gains ------------------------------------------------------- */
  const morningGain = calculateSlotGain(selections.morning, "morning", hasClassMorning);
  const afternoonGain = calculateSlotGain(selections.afternoon, "afternoon", hasClassAfternoon);
  const nightGain = calculateSlotGain(selections.night, "night", false);

  const morningFinal = applyMultiplier(morningGain, OUTCOMES[morningOI].mult);
  const afternoonFinal = applyMultiplier(afternoonGain, OUTCOMES[afternoonOI].mult);
  const nightFinal = applyMultiplier(nightGain, OUTCOMES[nightOI].mult);

  const totalGain = useMemo(
    () =>
      quantizeStats({
        academics: morningFinal.academics + afternoonFinal.academics + nightFinal.academics,
        social: morningFinal.social + afternoonFinal.social + nightFinal.social,
        wellbeing: morningFinal.wellbeing + afternoonFinal.wellbeing + nightFinal.wellbeing,
        money: morningFinal.money + afternoonFinal.money + nightFinal.money,
      }),
    [morningFinal, afternoonFinal, nightFinal]
  );

  const hadRestOrSleep = ["morning", "afternoon", "night" as const].some(
    (slot) =>
      selections[slot]?.actionId === "rest" || selections[slot]?.actionId === "sleep"
  );
  const sleepDeprivationPenalty = hadRestOrSleep ? 0 : 1.5;

  const computedEndStats = {
    academics: startStats.academics + DAILY_DECAY.academics + totalGain.academics,
    social: startStats.social + DAILY_DECAY.social + totalGain.social,
    wellbeing: startStats.wellbeing + DAILY_DECAY.wellbeing + totalGain.wellbeing - sleepDeprivationPenalty,
    money: startStats.money + DAILY_DECAY.money + totalGain.money,
  };

  const endStats =
    currentResolution?.new_stats || quantizeStats(clampStatsToBounds(computedEndStats));

  /* ---- wildcard ---------------------------------------------------- */
  const wildcardSlot = useMemo(() => {
    for (const slot of ["morning", "afternoon", "night"] as const) {
      if (selections[slot]?.actionId === "wildcard") return slot;
    }
    return null;
  }, [selections]);

  const wildcardEvent = useMemo(() => {
    if (!wildcardSlot) return null;
    const idx = hashString(`${myName}:${roomCode}:day:${currentDay}:wildcard`) % PRIVATE_EVENT_POOL.length;
    return PRIVATE_EVENT_POOL[idx];
  }, [currentDay, wildcardSlot, myName, roomCode]);

  /* ---- sequential fade-in + landing states ------------------------- */
  const [showSlots, setShowSlots] = useState(false);
  const [rouletteShows, setRouletteShows] = useState([false, false, false]);
  const [slotsLanded, setSlotsLanded] = useState(false);
  const [showWildcard, setShowWildcard] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [visibleHighlights, setVisibleHighlights] = useState<number[]>([]);

  useEffect(() => {
    const t1 = setTimeout(() => setShowSlots(true), 200);
    const r1 = setTimeout(() => setRouletteShows((p) => [true, p[1], p[2]]), 200);
    const r2 = setTimeout(() => setRouletteShows((p) => [p[0], true, p[2]]), 700);
    const r3 = setTimeout(() => setRouletteShows((p) => [p[0], p[1], true]), 1200);
    const t1b = setTimeout(() => setSlotsLanded(true), 3200);
    const t2 = setTimeout(() => {
      if (wildcardSlot) setShowWildcard(true);
      else setShowStats(true);
    }, 3600);
    const t3 = setTimeout(() => setShowStats(true), wildcardSlot ? 4400 : 3600);
    const t4 = setTimeout(() => setShowHighlights(true), wildcardSlot ? 5200 : 4400);
    return () => [t1, r1, r2, r3, t1b, t2, t3, t4].forEach(clearTimeout);
  }, [wildcardSlot]);

  /* ---- daily highlights (dummy) ---------------------------------- */
  const highlights = useMemo(() => {
    if (currentResolution?.highlights?.length) {
      return currentResolution.highlights as Highlight[];
    }

    try {
      return generateDailyHighlights({
        myName,
        selections,
        morningOI,
        afternoonOI,
        nightOI,
        wildcardEvent,
        players,
      });
    } catch {
      return [
        { text: "Campus was quiet today.", icon: "🍃", color: "#8a8579" },
        { text: "The dining hall ran out of pizza again.", icon: "🍕", color: "#8a8579" },
        { text: "Someone left a mysterious note in the library.", icon: "📝", color: "#8a8579" },
        { text: "The squirrels are getting bolder.", icon: "🐿️", color: "#8a8579" },
        { text: "A freshman got lost in the STEM building for 3 hours.", icon: "🏗️", color: "#8a8579" },
      ];
    }
  }, [currentResolution?.highlights, myName, selections, morningOI, afternoonOI, nightOI, wildcardEvent, players]);

  const slotData = [
    { key: "morning" as const, label: "Morning", icon: "☀️", hasClass: resolvedMorning?.hasClass ?? hasClassMorning, sel: selections.morning, gain: resolvedMorning?.finalGain ?? morningGain, oi: morningOI },
    { key: "afternoon" as const, label: "Afternoon", icon: "🌤", hasClass: resolvedAfternoon?.hasClass ?? hasClassAfternoon, sel: selections.afternoon, gain: resolvedAfternoon?.finalGain ?? afternoonGain, oi: afternoonOI },
    { key: "night" as const, label: "Night", icon: "🌙", hasClass: resolvedNight?.hasClass ?? false, sel: selections.night, gain: resolvedNight?.finalGain ?? nightGain, oi: nightOI },
  ];

  useEffect(() => {
    if (!showHighlights) return;
    const timers: NodeJS.Timeout[] = [];
    for (let i = 0; i < highlights.length; i++) {
      timers.push(setTimeout(() => {
        setVisibleHighlights((prev) => [...prev, i]);
      }, 150 + i * 300));
    }
    return () => timers.forEach(clearTimeout);
  }, [showHighlights, highlights.length]);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-[1fr_42rem_1fr] gap-16 items-start">
        {/* Left floating bubbles */}
        <div className="flex flex-col items-end gap-20 pt-40">
          {[0, 2, 4].map((idx) => {
            const h = highlights[idx];
            if (!h) return null;
            const pads = ["pt-0", "pt-14", "pt-10"];
            const angle = ((hashString(h.text + idx + "L") % 91) - 45) / 2; // -22.5 to +22.5
            return (
              <div
                key={idx}
                className={`${pads[idx / 2 | 0]}`}
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <div
                  className={`max-w-[280px] rounded-2xl px-5 py-3.5 border text-sm transition-all duration-500 ${
                    visibleHighlights.includes(idx)
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-85 translate-y-4"
                  }`}
                  style={{
                    backgroundColor: h.color + "12",
                    borderColor: h.color + "28",
                    animation: visibleHighlights.includes(idx)
                      ? `messagePop 0.5s ease-out ${idx * 120}ms both`
                      : "none",
                  }}
                >
                  <p className="leading-relaxed" style={{ color: h.color }}>
                    <span className="mr-1.5 text-base">{h.icon}</span>
                    {h.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center column — main content */}
        <div className="w-full space-y-5 pb-8">
          {/* Header */}
          <div className="text-center pt-4">
              <p className="text-muted text-sm uppercase tracking-widest mb-2">
                Day {currentDay} Resolved
              </p>
            <h1 className="text-3xl font-bold text-paper">How did it go?</h1>
          </div>

          {/* Slot sections — fade in one at a time */}
          {slotData.map((s, i) => {
            const targetName = s.sel?.targetId
              ? players.find((p) => p.id === s.sel?.targetId)?.name
              : null;
            const outcome = OUTCOMES[s.oi];
            const meEliminated = players.find((p) => p.name === myName)?.eliminated;
            return (
              <div
                key={s.key}
                className={`rounded-2xl border border-card-border bg-card p-5 transition-all duration-500 ${
                  showSlots ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
                style={{ transitionDelay: showSlots ? `${i * 350}ms` : "0ms" }}
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
                    {meEliminated ? (
                      <div className="flex items-center gap-3 rounded-xl border border-card-border bg-background/50 px-4 py-3 min-h-[66px]">
                        <span className="text-2xl shrink-0 grayscale opacity-50">
                          {s.sel ? getActionIcon(s.sel.actionId) : "❓"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-muted line-through">
                            {s.sel ? getActionLabel(s.sel.actionId) : "No action"}
                          </p>
                          <p className="text-xs text-muted">Eliminated</p>
                        </div>
                      </div>
                    ) : s.sel ? (
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
                        {slotsLanded && (
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
                    <SlotRoulette outcomeIndex={s.oi} show={rouletteShows[i]} />
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
                ["Academics", "academics", { warnAt: 1, emoji: "😰" }],
                ["Social", "social", { warnAt: 1, emoji: "🌧️" }],
                ["Money", "money", { warnAt: 0, emoji: "🍽️" }],
                ["Wellbeing", "wellbeing", { warnAt: 1, emoji: "🚨" }],
              ] as const
            ).map(([label, key, warn]) => {
              const rawStart = startStats[key];
              const rawEnd = endStats[key];
              const start = Math.max(0, Math.min(rawStart, 10));
              const end = Math.max(0, Math.min(rawEnd, 10));
              const change = end - start;
              const barMax = 10;
              const isWarned = end <= warn.warnAt;
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-paper font-medium">{label}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-muted">{start.toFixed(2)}</span>
                      <span className="text-muted">
                        ({change >= 0 ? "+" : ""}
                        {change.toFixed(2)})
                      </span>
                      <span className="text-paper font-bold">
                        → {end.toFixed(2)}
                      </span>
                      {isWarned && (
                        <span className="text-[10px]" title={label + " critical"}>
                          {warn.emoji}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-2.5 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-700 ease-out"
                      style={{
                        width: showStats
                          ? `${Math.max(0, Math.min((end / barMax) * 100, 100))}%`
                          : `${Math.max(0, Math.min((start / barMax) * 100, 100))}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Next Day button — directly under stats */}
            <div className="pt-3 text-center border-t border-card-border">
              {advanceError && (
                <p className="mb-3 text-sm text-accent">{advanceError}</p>
              )}
              {isHost ? (
                <button
                  onClick={async () => {
                    setAdvanceError(null);
                    setAdvancing(true);
                    try {
                      await onNextDay();
                    } catch (err) {
                      setAdvanceError(
                        err instanceof Error ? err.message : "Failed to start next day"
                      );
                    } finally {
                      setAdvancing(false);
                    }
                  }}
                  disabled={advancing}
                  className={`px-8 py-3 rounded-xl font-semibold transition active:translate-y-0.5 shadow-lg shadow-accent/20 ${
                    advancing
                      ? "bg-card-border text-muted cursor-not-allowed shadow-none"
                      : "bg-accent text-paper hover:bg-accent/90"
                  }`}
                >
                  {advancing ? "Starting Next Day..." : "Next Day →"}
                </button>
              ) : (
                <p className="text-sm text-muted">Waiting for the host to start the next day.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right floating bubbles */}
        <div className="flex flex-col items-start gap-20 pt-52">
          {[1, 3, 5].map((idx) => {
            const h = highlights[idx];
            if (!h) return null;
            const pads = ["pt-0", "pt-16", "pt-8"];
            const angle = ((hashString(h.text + idx + "R") % 91) - 45) / 2; // -22.5 to +22.5
            return (
              <div
                key={idx}
                className={`${pads[(idx - 1) / 2 | 0]}`}
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <div
                  className={`max-w-[280px] rounded-2xl px-5 py-3.5 border text-sm transition-all duration-500 ${
                    visibleHighlights.includes(idx)
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-85 translate-y-4"
                  }`}
                  style={{
                    backgroundColor: h.color + "12",
                    borderColor: h.color + "28",
                    animation: visibleHighlights.includes(idx)
                      ? `messagePop 0.5s ease-out ${idx * 120}ms both`
                      : "none",
                  }}
                >
                  <p className="leading-relaxed" style={{ color: h.color }}>
                    <span className="mr-1.5 text-base">{h.icon}</span>
                    {h.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
// Daily highlights generator (dummy / placeholder)

type Highlight = { text: string; icon: string; color: string };

function generateDailyHighlights({
  myName,
  selections,
  morningOI,
  afternoonOI,
  nightOI,
  wildcardEvent,
  players,
}: {
  myName: string;
  selections: Record<string, Selection | null>;
  morningOI: number;
  afternoonOI: number;
  nightOI: number;
  wildcardEvent: (typeof PRIVATE_EVENT_POOL)[0] | null;
  players: Player[];
}): Highlight[] {
  const out: Highlight[] = [];

  const others = players.filter((p) => p.name !== myName);
  const randOther = () =>
    others.length > 0
      ? others[hashString(myName + "rand") % others.length].name
      : "someone";

  // Slot highlights — Bad (red) / Good (green)
  const slotInfo = [
    { label: "morning", sel: selections.morning, oi: morningOI, icon: "☀️" },
    { label: "afternoon", sel: selections.afternoon, oi: afternoonOI, icon: "🌤" },
    { label: "night", sel: selections.night, oi: nightOI, icon: "🌙" },
  ];

  for (const s of slotInfo) {
    if (!s.sel) continue;
    const action = getActionLabel(s.sel.actionId);
    const targetName = s.sel.targetId
      ? players.find((p) => p.id === s.sel?.targetId)?.name
      : null;

    if (s.oi === 0) {
      const lines = [
        `${myName} tried to ${action.toLowerCase()}, but the universe had other plans.`,
        `${myName}'s ${action.toLowerCase()} session went off the rails.`,
        `Nothing about ${myName}'s ${action.toLowerCase()} went right today.`,
      ];
      out.push({ text: lines[hashString(myName + s.label) % lines.length], icon: s.icon, color: "#d94f4f" });
    } else if (s.oi === 2) {
      const lines = targetName
        ? [
            `${myName} and ${targetName} absolutely crushed their ${action.toLowerCase()}.`,
            `${myName} and ${targetName} had a magical ${action.toLowerCase()} session.`,
            `${targetName} and ${myName} were in perfect sync during ${action.toLowerCase()}.`,
          ]
        : [
            `${myName} had an incredible ${action.toLowerCase()} session.`,
            `${myName} absolutely crushed it during ${action.toLowerCase()}.`,
            `${myName}'s ${action.toLowerCase()} was the highlight of the day.`,
          ];
      out.push({ text: lines[hashString(myName + s.label) % lines.length], icon: s.icon, color: "#5b8c5a" });
    }
  }

  // Wildcard highlight — neutral (vanilla)
  if (wildcardEvent) {
    out.push({
      text: `${myName} stumbled into ${wildcardEvent.name.toLowerCase()}.`,
      icon: wildcardEvent.icon,
      color: "#F3E5AB",
    });
  }

  // Generic campus events — mixed sentiment colors
  const generic: Highlight[] = [
    { text: `${randOther()} was spotted crying in the library at 2am.`, icon: "😢", color: "#d94f4f" },
    { text: `The dining hall ran out of pizza. Again.`, icon: "🍕", color: "#F3E5AB" },
    { text: `A squirrel stole ${randOther()}'s bagel. No one intervened.`, icon: "🐿️", color: "#F3E5AB" },
    { text: `The STEM building elevator got stuck for 20 minutes.`, icon: "🏗️", color: "#F3E5AB" },
    { text: `${randOther()} showed up to class in pajamas. Respect.`, icon: "😴", color: "#5b8c5a" },
    { text: `Someone started a rumor that the final got cancelled. It didn't.`, icon: "📢", color: "#d94f4f" },
    { text: `The campus Wi-Fi went down during registration. Chaos ensued.`, icon: "📶", color: "#d94f4f" },
    { text: `${randOther()} lost their ID card for the third time this week.`, icon: "🪪", color: "#d94f4f" },
    { text: `A stray cat has taken up residence in the humanities building.`, icon: "🐈", color: "#5b8c5a" },
    { text: `${randOther()} accidentally replied-all to a department email.`, icon: "📧", color: "#F3E5AB" },
    { text: `Free donuts appeared in the student lounge. No questions asked.`, icon: "🍩", color: "#5b8c5a" },
    { text: `The coffee shop started accepting dining dollars again.`, icon: "☕", color: "#5b8c5a" },
  ];

  // Shuffle generics deterministically
  const shuffled = generic
    .map((g, i) => ({ ...g, sortKey: hashString(myName + "campus" + i) }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ sortKey: _, ...rest }) => rest);

  while (out.length < 6 && shuffled.length > 0) {
    const next = shuffled.shift()!;
    if (!out.some((o) => o.text === next.text)) {
      out.push(next);
    }
  }

  return out.slice(0, 6);
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
