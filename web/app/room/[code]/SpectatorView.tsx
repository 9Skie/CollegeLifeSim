"use client";

import { useMemo } from "react";
import type { StoredResolution } from "@/utils/day-resolution";

import { resolveExamForRoom } from "@/utils/exam-resolution";
import type { ExamResult, ExamGrade } from "@/utils/exam-resolution";

/* ------------------------------------------------------------------ */
// Types

type Player = {
  id: string;
  name: string;
  eliminated?: boolean;
  academics?: number | string | null;
  social?: number | string | null;
  wellbeing?: number | string | null;
  money?: number | string | null;
};

type SpectatorViewProps = {
  roomCode: string;
  currentDay: number;
  phase: string;
  players: Player[];
  currentPlayer: Player | null;
  allResolutions: StoredResolution[] | null;
};

type PublicEvent = { name: string; flavor: string; effect: string };

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
    "#d94f4f",
    "#f0a868",
    "#5b8c5a",
    "#4f8cd9",
    "#d94fb8",
    "#a17b1a",
    "#8a8579",
    "#4fd9c9",
    "#d96f4f",
  ];
  return colors[hashString(name) % colors.length];
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function getActionLabel(id: string): string {
  const map: Record<string, string> = {
    class: "Class",
    study: "Study",
    work: "Work",
    exercise: "Exercise",
    socialize: "Socialize",
    rest: "Rest",
    sleep: "Sleep",
    wildcard: "Wildcard",
  };
  return map[id] || id;
}

function getActionIcon(id: string): string {
  const map: Record<string, string> = {
    class: "🎓",
    study: "📚",
    work: "💼",
    exercise: "🏃",
    socialize: "💬",
    rest: "🛋️",
    sleep: "😴",
    wildcard: "🃏",
  };
  return map[id] || "❓";
}

function toNumber(value: number | string | null | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/* ------------------------------------------------------------------ */
// Event data (mirrors DayView)

const PUBLIC_EVENT_POOL: PublicEvent[] = [
  {
    name: "Heatwave",
    flavor: "The quad is basically a frying pan. Even the squirrels look miserable.",
    effect: "Exercise effectiveness halved today",
  },
  {
    name: "Cram Season",
    flavor: "The library is packed, energy-drink cans litter every table, and someone is definitely crying in the stacks.",
    effect: "Study actions boosted 1.5× today",
  },
  {
    name: "Frat Row Block Party",
    flavor: "Speakers the size of cars. The bass is rattling windows three blocks away.",
    effect: "Night Socialize boosted 1.5×",
  },
  {
    name: "Campus Power Outage",
    flavor: "The lights flickered and died. Half the dorm is outside with flashlights; the other half is already napping.",
    effect: "Morning Study halved",
  },
  {
    name: "Hiring Spree",
    flavor: "Every coffee shop and bookstore on campus put up 'Help Wanted' signs overnight.",
    effect: "Work effectiveness boosted 1.5×",
  },
  {
    name: "Wellness Week",
    flavor: "Free yoga on the lawn, meditation sessions in the chapel, and somehow the dining hall is serving actual vegetables.",
    effect: "Rest & Sleep boosted 1.5×",
  },
  {
    name: "Snow Day",
    flavor: "Two feet of snow. The provost gave up. The dining hall is somehow still open.",
    effect: "Classes cancelled",
  },
  {
    name: "Flu Outbreak",
    flavor: "The health center line wraps around the building. Everyone is either sick or pretending to be.",
    effect: "Wellbeing decay −1.5 today",
  },
  {
    name: "Career Fair",
    flavor: "Recruiters in matching polos are handing out stress balls and collecting résumés like trading cards.",
    effect: "Work boosted, also gives Academics",
  },
  {
    name: "Coffee Shop Promo",
    flavor: "The campus café is running a 'study marathon' deal — unlimited refills if you stay four hours.",
    effect: "Coffee Socialize cost waived",
  },
];

const OUTCOME_BADGES: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  bad: { label: "Bad", color: "#d94f4f", icon: "🥀" },
  normal: { label: "Normal", color: "#F3E5AB", icon: "😐" },
  good: { label: "Good", color: "#5b8c5a", icon: "✨" },
};

const STAT_LABELS = [
  ["Academics", "academics"] as const,
  ["Social", "social"] as const,
  ["Money", "money"] as const,
  ["Wellbeing", "wellbeing"] as const,
];

/* ------------------------------------------------------------------ */
// Main component

export default function SpectatorView({
  roomCode,
  currentDay,
  phase,
  players,
  currentPlayer,
  allResolutions,
}: SpectatorViewProps) {
  const myName = currentPlayer?.name || "You";

  const seed = hashString(`${roomCode}:day:${currentDay}`);
  const publicEvent = PUBLIC_EVENT_POOL[seed % PUBLIC_EVENT_POOL.length];

  if (phase === "resolution") {
    return (
      <SpectatorResolutionView
        roomCode={roomCode}
        currentDay={currentDay}
        players={players}
        myName={myName}
        publicEvent={publicEvent}
        allResolutions={allResolutions}
      />
    );
  }

  if (phase === "exam") {
    return (
      <SpectatorExamView
        currentDay={currentDay}
        players={players}
        myName={myName}
      />
    );
  }

  // Default: day phase (or any other) — show passive spectating view
  return (
    <SpectatorDayView
      roomCode={roomCode}
      currentDay={currentDay}
      players={players}
      myName={myName}
      publicEvent={publicEvent}
    />
  );
}

/* ------------------------------------------------------------------ */
// Day phase — passive watch

function SpectatorDayView({
  roomCode,
  currentDay,
  players,
  myName,
  publicEvent,
}: {
  roomCode: string;
  currentDay: number;
  players: Player[];
  myName: string;
  publicEvent: PublicEvent;
}) {
  const currentWeek = Math.floor((currentDay - 1) / 7) + 1;
  const currentDayIndex = (currentDay - 1) % 7;
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayLabel = `Week ${currentWeek} · ${dayNames[currentDayIndex]}`;

  const activePlayers = players.filter((p) => !p.eliminated);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <p className="text-muted text-sm uppercase tracking-widest mb-2">
            {dayLabel} · Room {roomCode}
          </p>
          <h1 className="text-3xl font-bold text-paper">You&apos;re Out</h1>
          <p className="text-muted text-sm mt-2">
            Your semester ended early. Results will appear here once the day resolves.
          </p>
        </div>

        {/* Public Event */}
        <div className="rounded-xl overflow-hidden border border-[#F3E5AB]/20 bg-gradient-to-br from-[#F3E5AB]/10 via-[#F3E5AB]/5 to-transparent p-4">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#F3E5AB]/60 via-[#F3E5AB]/40 to-[#F3E5AB]/30" />
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0 mt-0.5">📢</span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F3E5AB]">
                Public Event
              </span>
              <h3 className="text-lg font-bold text-paper mt-0.5 mb-1">
                {publicEvent.name}
              </h3>
              <p className="text-sm text-paper/70 leading-relaxed">
                {publicEvent.flavor}
              </p>
              <p className="text-xs font-semibold mt-2 text-[#F3E5AB]/80">
                Effect: {publicEvent.effect}
              </p>
            </div>
          </div>
        </div>

        {/* Still-in roster — static, no live statuses */}
        <div className="rounded-2xl border border-card-border bg-card p-5">
          <h2 className="text-sm font-bold text-paper uppercase tracking-widest mb-4">
            Who&apos;s Still In
          </h2>
          <div className="flex flex-wrap gap-2">
            {activePlayers.map((player) => {
              const color = getAvatarColor(player.name);
              return (
                <div
                  key={player.id}
                  className="flex items-center gap-2 rounded-lg border border-card-border bg-background/50 px-3 py-2"
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {getInitials(player.name)}
                  </div>
                  <span className="text-xs font-medium text-paper">
                    {player.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Standings */}
        <div className="rounded-2xl border border-card-border bg-card p-5">
          <h2 className="text-sm font-bold text-paper uppercase tracking-widest mb-4">
            Current Standings
          </h2>
          <div className="space-y-3">
            {[...players]
              .sort((a, b) => {
                const scoreA =
                  toNumber(a.academics, 0) +
                  toNumber(a.social, 0) +
                  toNumber(a.wellbeing, 0) +
                  toNumber(a.money, 0);
                const scoreB =
                  toNumber(b.academics, 0) +
                  toNumber(b.social, 0) +
                  toNumber(b.wellbeing, 0) +
                  toNumber(b.money, 0);
                return scoreB - scoreA;
              })
              .map((player, idx) => {
                const color = getAvatarColor(player.name);
                const isMe = player.name === myName;
                const isGoner = player.eliminated;
                const stats = {
                  academics: toNumber(player.academics, 2),
                  social: toNumber(player.social, 2),
                  wellbeing: toNumber(player.wellbeing, 5),
                  money: toNumber(player.money, 2),
                };
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                      isMe
                        ? "border-accent/30 bg-accent/5"
                        : "border-card-border bg-background/50"
                    }`}
                  >
                    <span className="text-xs font-bold text-muted w-4">
                      {idx + 1}
                    </span>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0 ${
                        isGoner ? "grayscale opacity-50" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {getInitials(player.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isGoner ? "text-muted line-through" : "text-paper"
                        }`}
                      >
                        {player.name}
                        {isMe && (
                          <span className="ml-1.5 text-[10px] text-muted font-normal">
                            (You)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted tabular-nums">
                      {(
                        [
                          ["A", stats.academics],
                          ["S", stats.social],
                          ["M", stats.money],
                          ["W", stats.wellbeing],
                        ] as const
                      ).map(([label, val]) => (
                        <span key={label}>
                          {label}:{" "}
                          <span className="text-paper">{val.toFixed(1)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
// Resolution phase — full results for all players

function SpectatorResolutionView({
  roomCode,
  currentDay,
  players,
  myName,
  publicEvent,
  allResolutions,
}: {
  roomCode: string;
  currentDay: number;
  players: Player[];
  myName: string;
  publicEvent: PublicEvent;
  allResolutions: StoredResolution[] | null;
}) {
  const activePlayers = players.filter((p) => !p.eliminated);
  const eliminatedPlayers = players.filter((p) => p.eliminated);

  // Build a map of playerId -> resolution
  const resolutionMap = useMemo(() => {
    const map = new Map<string, StoredResolution>();
    if (allResolutions) {
      for (const res of allResolutions) {
        map.set(res.player_id, res);
      }
    }
    return map;
  }, [allResolutions]);

  const hasData = allResolutions && allResolutions.length > 0;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <p className="text-muted text-sm uppercase tracking-widest mb-2">
            Day {currentDay} Results · Room {roomCode}
          </p>
          <h1 className="text-3xl font-bold text-paper">The Dust Settles</h1>
          <p className="text-muted text-sm mt-2">
            You&apos;re watching from the sidelines.
          </p>
        </div>

        {/* Public Event */}
        <div className="rounded-xl overflow-hidden border border-[#F3E5AB]/20 bg-gradient-to-br from-[#F3E5AB]/10 via-[#F3E5AB]/5 to-transparent p-4">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#F3E5AB]/60 via-[#F3E5AB]/40 to-[#F3E5AB]/30" />
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0 mt-0.5">📢</span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F3E5AB]">
                Public Event
              </span>
              <h3 className="text-lg font-bold text-paper mt-0.5 mb-1">
                {publicEvent.name}
              </h3>
              <p className="text-sm text-paper/70 leading-relaxed">
                {publicEvent.flavor}
              </p>
              <p className="text-xs font-semibold mt-2 text-[#F3E5AB]/80">
                Effect: {publicEvent.effect}
              </p>
            </div>
          </div>
        </div>

        {/* Player result cards */}
        {!hasData ? (
          <div className="rounded-2xl border border-card-border bg-card p-10 text-center">
            <p className="text-muted text-sm">Waiting for resolution data…</p>
          </div>
        ) : (
          <>
            {/* Active players */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activePlayers.map((player) => (
                <PlayerResultCard
                  key={player.id}
                  player={player}
                  resolution={resolutionMap.get(player.id) || null}
                  isMe={player.name === myName}
                />
              ))}
            </div>

            {/* Eliminated players (if any besides self) */}
            {eliminatedPlayers.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-muted uppercase tracking-widest">
                  Eliminated
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {eliminatedPlayers.map((player) => (
                    <PlayerResultCard
                      key={player.id}
                      player={player}
                      resolution={resolutionMap.get(player.id) || null}
                      isMe={player.name === myName}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Highlights */}
            <SpectatorHighlights
              allResolutions={allResolutions}
              players={players}
            />
          </>
        )}
      </div>
    </div>
  );
}

function PlayerResultCard({
  player,
  resolution,
  isMe,
}: {
  player: Player;
  resolution: StoredResolution | null;
  isMe: boolean;
}) {
  const color = getAvatarColor(player.name);
  const isGoner = player.eliminated;

  const oldStats = resolution?.old_stats || {
    academics: toNumber(player.academics, 2),
    social: toNumber(player.social, 2),
    wellbeing: toNumber(player.wellbeing, 5),
    money: toNumber(player.money, 2),
  };

  const newStats = resolution?.new_stats || oldStats;

  const slotResults = resolution?.changes?.slotResults || [];

  return (
    <div
      className={`rounded-2xl border bg-card p-4 space-y-3 ${
        isMe ? "border-accent/40" : "border-card-border"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shrink-0 ${
            isGoner ? "grayscale opacity-50" : ""
          }`}
          style={{ backgroundColor: color }}
        >
          {getInitials(player.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-bold truncate ${
              isGoner ? "text-muted line-through" : "text-paper"
            }`}
          >
            {player.name}
            {isMe && (
              <span className="ml-1.5 text-[10px] text-muted font-normal">
                (You)
              </span>
            )}
          </p>
          {isGoner && (
            <p className="text-[10px] text-accent font-bold">Eliminated</p>
          )}
        </div>
      </div>

      {/* Slots */}
      <div className="space-y-1.5">
        {slotResults.length > 0 ? (
          slotResults.map((slot) => (
            <SlotRow key={slot.slot} slot={slot} />
          ))
        ) : (
          <p className="text-xs text-muted">No actions recorded.</p>
        )}
      </div>

      {/* Stat changes */}
      <div className="pt-2 border-t border-card-border space-y-1.5">
        {STAT_LABELS.map(([label, key]) => {
          const start = Math.max(0, Math.min(oldStats[key as keyof typeof oldStats], 10));
          const end = Math.max(0, Math.min(newStats[key as keyof typeof newStats], 10));
          const change = end - start;
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[10px] text-muted w-16">{label}</span>
              <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${Math.max(0, Math.min((end / 10) * 100, 100))}%` }}
                />
              </div>
              <span className="text-[10px] text-paper tabular-nums w-16 text-right">
                {start.toFixed(1)}
                {change !== 0 && (
                  <span
                    className="ml-1 font-bold"
                    style={{ color: change > 0 ? "#5b8c5a" : "#d94f4f" }}
                  >
                    {change > 0 ? "+" : ""}
                    {change.toFixed(1)}
                  </span>
                )}
                <span className="text-muted ml-1">→ {end.toFixed(1)}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlotRow({ slot }: { slot: { slot: string; actionId: string | null; outcomeTier: string | null; ditched?: boolean } }) {
  const label = slot.slot.charAt(0).toUpperCase() + slot.slot.slice(1);
  if (!slot.actionId) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="w-16 font-medium">{label}</span>
        <span>No action</span>
      </div>
    );
  }

  const badge = slot.outcomeTier
    ? OUTCOME_BADGES[slot.outcomeTier]
    : null;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 font-medium text-paper">{label}</span>
      <span className="text-base">{getActionIcon(slot.actionId)}</span>
      <span className="text-paper">{getActionLabel(slot.actionId)}</span>
      {slot.ditched && (
        <span className="text-[10px] font-bold text-accent">Ditched</span>
      )}
      {badge && (
        <span
          className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{
            color: badge.color,
            backgroundColor: badge.color + "18",
          }}
        >
          {badge.icon} {badge.label}
        </span>
      )}
    </div>
  );
}

function SpectatorHighlights({
  allResolutions,
  players,
}: {
  allResolutions: StoredResolution[];
  players: Player[];
}) {
  // Collect all unique highlights across players
  const seen = new Set<string>();
  const highlights: { text: string; icon: string; color: string; playerName: string }[] = [];

  for (const res of allResolutions) {
    const player = players.find((p) => p.id === res.player_id);
    const playerName = player?.name || "Someone";
    for (const h of res.highlights || []) {
      const key = `${h.text}-${h.icon}`;
      if (!seen.has(key)) {
        seen.add(key);
        highlights.push({ ...h, playerName });
      }
    }
  }

  if (highlights.length === 0) return null;

  return (
    <div className="rounded-2xl border border-card-border bg-card p-5">
      <h2 className="text-sm font-bold text-paper uppercase tracking-widest mb-4">
        Today&apos;s Highlights
      </h2>
      <div className="space-y-2">
        {highlights.slice(0, 8).map((h, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl px-4 py-3 border"
            style={{
              backgroundColor: h.color + "10",
              borderColor: h.color + "20",
            }}
          >
            <span className="text-base shrink-0">{h.icon}</span>
            <p className="text-sm leading-relaxed" style={{ color: h.color }}>
              {h.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
// Exam phase

const GRADE_COLORS: Record<ExamGrade, string> = {
  A: "#5b8c5a",
  B: "#8fb58e",
  C: "#F3E5AB",
  D: "#d99f4f",
  F: "#d94f4f",
};

function SpectatorExamView({
  currentDay,
  players,
  myName,
}: {
  currentDay: number;
  players: Player[];
  myName: string;
}) {
  const isFinal = currentDay >= 19;
  const title = isFinal ? "Finals" : "Midterm";

  const allResults = useMemo(() => {
    return resolveExamForRoom({ currentDay, players }).results;
  }, [currentDay, players]);

  const sortedResults = useMemo(() => {
    return [...allResults].sort(
      (a, b) =>
        ({ A: 5, B: 4, C: 3, D: 2, F: 1 }[b.grade] -
        { A: 5, B: 4, C: 3, D: 2, F: 1 }[a.grade])
    );
  }, [allResults]);

  const myResult = allResults.find((r) => r.playerName === myName);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center pt-6 mb-8">
          <p className="text-muted text-sm uppercase tracking-widest mb-2">
            Week {isFinal ? 3 : 2} · Day {currentDay}
          </p>
          <h1 className="text-4xl font-bold text-paper">{title}</h1>
          <p className="text-muted text-sm mt-2">
            You&apos;re spectating from the sidelines.
          </p>
        </div>

        {/* Eliminated self card */}
        {myResult && (
          <div className="mb-6">
            <p className="text-center text-[10px] uppercase tracking-widest text-accent mb-3">
              Your Result
            </p>
            <div className="max-w-xs mx-auto">
              <EliminatedExamCard result={myResult} />
            </div>
          </div>
        )}

        {/* Full roster */}
        <div className="mb-2">
          <p className="text-center text-[10px] uppercase tracking-widest text-muted mb-3">
            Full Class Rankings
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {sortedResults.map((result) => {
            const isMe = result.playerName === myName;
            if (isMe) return null; // already shown above
            return (
              <ExamResultCard key={result.playerId} result={result} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ExamResultCard({ result }: { result: ExamResult }) {
  const color = getAvatarColor(result.playerName);
  const gradeColor = GRADE_COLORS[result.grade];

  return (
    <div className="rounded-2xl border border-card-border bg-card flex flex-col items-center text-center p-4">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white mb-3"
        style={{ backgroundColor: color }}
      >
        {getInitials(result.playerName)}
      </div>
      <p className="text-sm font-semibold text-paper mb-1">
        {result.playerName}
      </p>

      <div
        className="w-14 h-14 rounded-full flex items-center justify-center font-black text-xl mb-3"
        style={{
          backgroundColor: gradeColor + "18",
          border: `2px solid ${gradeColor}50`,
          color: gradeColor,
        }}
      >
        {result.grade}
      </div>

      <div className="w-full space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-muted">Academics</span>
          <span className="text-paper font-medium">
            {result.oldAcademics.toFixed(2)}
            {result.academicsChange !== 0 && (
              <span
                className="ml-1 font-bold"
                style={{
                  color: result.academicsChange > 0 ? "#5b8c5a" : "#d94f4f",
                }}
              >
                {result.academicsChange > 0 ? "+" : ""}
                {result.academicsChange.toFixed(2)}
              </span>
            )}
            <span className="text-paper font-bold ml-1">
              → {result.newAcademics.toFixed(2)}
            </span>
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Wellbeing</span>
          <span className="text-paper font-medium">
            {result.oldWellbeing.toFixed(2)}
            <span className="text-[#5b8c5a] font-bold ml-1">+1.00</span>
            <span className="text-paper font-bold ml-1">
              → {result.newWellbeing.toFixed(2)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function EliminatedExamCard({ result }: { result: ExamResult }) {
  const color = getAvatarColor(result.playerName);

  return (
    <div className="rounded-2xl border border-accent/40 bg-card flex flex-col items-center text-center p-6">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white mb-3 grayscale opacity-50"
        style={{ backgroundColor: color }}
      >
        {getInitials(result.playerName)}
      </div>
      <p className="text-lg font-semibold text-paper mb-1">
        {result.playerName}
        <span className="ml-1.5 text-[10px] font-bold text-accent uppercase tracking-wider">
          You
        </span>
      </p>

      <div className="w-20 h-20 rounded-full flex items-center justify-center font-black text-3xl mb-3 border-2 border-accent/30 text-accent bg-accent/10">
        —
      </div>

      <p className="text-sm text-accent font-medium">Eliminated</p>
      <p className="text-xs text-muted mt-1">
        Academics {result.oldAcademics.toFixed(2)} · Wellbeing{" "}
        {result.oldWellbeing.toFixed(2)}
      </p>
    </div>
  );
}
