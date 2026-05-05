"use client";

import { useEffect, useState } from "react";
import { getAvatarColor, getInitials } from "@/utils/player-avatar";
import { getWeightedScore, MAJOR_WEIGHTS } from "@/data/game/majors";

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
};

type ActionHistoryRow = {
  player_id: string;
  action: string;
  day: number;
  slot: string;
};

const AWARD_DELAY = 900;
const PODIUM_HOLD = 2500;

const ACTION_LABELS: Record<string, string> = {
  class: "Class",
  study: "Study",
  work: "Work",
  exercise: "Exercise",
  socialize: "Social",
  rest: "Rest",
  sleep: "Sleep",
  wildcard: "Wildcard",
};

export default function EndScreen({
  players,
  currentPlayer,
  actionHistory,
  onReturnHome,
}: {
  players: Player[];
  currentPlayer: Player | null;
  actionHistory: ActionHistoryRow[];
  onReturnHome: () => void;
}) {
  const [phase, setPhase] = useState<"intro" | "podium" | "leaderboard" | "done">("intro");
  const [revealedAwards, setRevealedAwards] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("podium"), 600);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== "podium") return;
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setRevealedAwards(count);
      if (count >= 5) {
        clearInterval(interval);
        setTimeout(() => setPhase("leaderboard"), PODIUM_HOLD);
      }
    }, AWARD_DELAY);
    return () => clearInterval(interval);
  }, [phase]);

  const score = (p: Player) => getWeightedScore(p);

  const ranked = [...players].sort((a, b) => score(b) - score(a));

  const actionCountsByPlayer = computeActionCounts(actionHistory);

  const awards = computeAwards(players);

  return (
    <main className="flex-1 flex flex-col items-center justify-start p-6 overflow-auto">
      {/* Header */}
      <div
        className={`text-center mb-8 transition-all duration-700 ${
          phase === "intro" ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        }`}
      >
        <p className="text-4xl sm:text-5xl font-black text-paper mb-2">
          Semester Complete
        </p>
        <p className="text-muted text-sm">
          {players.filter((p) => !p.eliminated).length} survived ·{" "}
          {players.filter((p) => p.eliminated).length} eliminated
        </p>
      </div>

      {/* Podium */}
      {phase !== "intro" && (
        <div className="w-full max-w-5xl mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {awards.map((award, i) => {
              const isRevealed = revealedAwards > i;
              return (
                <div
                  key={award.key}
                  className={`relative rounded-2xl border p-5 text-center transition-all duration-700 ${
                    isRevealed
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-6 scale-95"
                  } ${
                    award.winner?.id === currentPlayer?.id
                      ? "border-accent bg-accent/10"
                      : "border-card-border bg-card"
                  }`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  {/* Medal */}
                  <div className="text-3xl mb-3">{award.icon}</div>

                  {/* Category */}
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted mb-3">
                    {award.label}
                  </p>

                  {/* Winner */}
                  {award.winner ? (
                    <>
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white mx-auto mb-2"
                        style={{
                          backgroundColor: getAvatarColor(award.winner.name),
                        }}
                      >
                        {getInitials(award.winner.name)}
                      </div>
                      <p className="text-sm font-bold text-paper truncate px-1">
                        {award.winner.name}
                        {award.winner.id === currentPlayer?.id && (
                          <span className="ml-1 text-[10px] text-muted font-normal">
                            (You)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-accent-soft font-semibold mt-1">
                        {award.statLabel}: {formatStat(award.statValue)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted">No winner</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rolling Leaderboard */}
      <div
        className={`w-full max-w-xl transition-all duration-1000 ${
          phase === "leaderboard" || phase === "done"
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        <div className="rounded-2xl border border-card-border bg-card overflow-hidden">
          {/* Leaderboard header */}
          <div className="px-5 py-3 border-b border-card-border flex items-center justify-between">
            <p className="text-sm font-bold text-paper">Final Rankings</p>
            <p className="text-[10px] text-muted uppercase tracking-wider">
              Total Score
            </p>
          </div>

          {/* Animated rows */}
          <div className="p-2">
            {ranked.map((player, index) => {
              const color = getAvatarColor(player.name);
              const isMe = player.id === currentPlayer?.id;
              const total = score(player);
              const isGoner = player.eliminated;
              const delay = Math.min(index * 120, 1500);

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 mb-1.5 last:mb-0 transition-all duration-700 ${
                    phase === "leaderboard" || phase === "done"
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 -translate-y-6"
                  } ${
                    isMe
                      ? "border-accent bg-accent/5"
                      : "border-card-border bg-background/50"
                  } ${isGoner ? "opacity-50" : ""}`}
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  {/* Rank */}
                  <span
                    className={`w-6 text-sm font-bold shrink-0 text-center ${
                      index === 0
                        ? "text-amber-400"
                        : index === 1
                        ? "text-gray-300"
                        : index === 2
                        ? "text-amber-700"
                        : "text-muted"
                    }`}
                  >
                    {index + 1}
                  </span>

                  {/* Avatar */}
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shrink-0 select-none ${
                      isGoner ? "grayscale" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {getInitials(player.name)}
                  </div>

                  {/* Name + details */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold text-sm truncate ${
                        isGoner ? "text-muted line-through" : "text-paper"
                      }`}
                    >
                      {player.name}
                      {isMe && (
                        <span className="ml-1.5 text-xs text-muted font-normal">
                          (You)
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted truncate">
                      {player.major ?? "Undecided"}
                      {player.pos_trait && player.neg_trait
                        ? ` · ${player.pos_trait} / ${player.neg_trait}`
                        : ""}
                      {isGoner && " · Eliminated"}
                    </p>
                    {/* Action counts */}
                    {(() => {
                      const counts = actionCountsByPlayer.get(player.id);
                      if (!counts || counts.total === 0) return null;
                      const items = Object.entries(ACTION_LABELS)
                        .filter(([key]) => counts[key] > 0)
                        .map(([key, label]) => `${counts[key]} ${label}`)
                        .join(" · ");
                      return (
                        <p className="text-[9px] text-accent-soft/70 truncate mt-0.5">
                          {items}
                        </p>
                      );
                    })()}
                  </div>

                  {/* Stats */}
                  <div className="flex gap-2 text-right shrink-0">
                    <StatBadge label="Acd" value={player.academics} />
                    <StatBadge label="Soc" value={player.social} />
                    <StatBadge label="Wb" value={player.wellbeing} />
                    <StatBadge label="$" value={player.money} />
                  </div>

                  {/* Total */}
                  <div className="text-right shrink-0">
                    <span className="block text-[9px] text-muted opacity-60">Score</span>
                    <span className="w-12 text-right text-xs font-bold text-paper">
                      {formatStat(total)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Year-end essay */}
        <div
          className={`mt-10 text-center transition-all duration-1000 delay-700 ${
            phase === "leaderboard" || phase === "done"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6"
          }`}
        >
          <div className="rounded-2xl border border-card-border bg-card p-6 max-w-xl mx-auto">
            <p className="text-sm text-paper leading-relaxed italic">
              At the end of the semester, the dorms empty out in a hurry. Some
              people leave with their major still intact, others quietly switch
              tracks the moment the finals are over. The friends you thought would
              last forever already have new group chats you are not in. A few
              relationships that looked solid in October did not survive November.
              Someone made a small fortune from a side hustle and will never tell
              you how. Someone else burned out so hard they are still sleeping
              twelve hours a day. The campus looks the same, but nobody walks
              through it the same way they did on day one. That is the whole point.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div
          className={`text-center mt-8 mb-8 transition-all duration-700 delay-[1200ms] ${
            phase === "leaderboard" || phase === "done"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={onReturnHome}
            className="px-8 py-3 rounded-xl text-sm font-medium bg-accent text-paper hover:bg-accent/90 transition active:translate-y-0.5 shadow-lg shadow-accent/20"
          >
            Return Home
          </button>
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
// Helpers

function computeAwards(players: Player[]) {
  const all = [...players];

  const byTotal = [...all].sort(
    (a, b) => getWeightedScore(b) - getWeightedScore(a)
  );
  const byAcademics = [...all].sort(
    (a, b) => (b.academics ?? 0) - (a.academics ?? 0)
  );
  const bySocial = [...all].sort(
    (a, b) => (b.social ?? 0) - (a.social ?? 0)
  );
  const byMoney = [...all].sort(
    (a, b) => (b.money ?? 0) - (a.money ?? 0)
  );
  const byWellbeing = [...all].sort(
    (a, b) => (b.wellbeing ?? 0) - (a.wellbeing ?? 0)
  );

  return [
    {
      key: "mvp",
      label: "Semester MVP",
      icon: "🏆",
      winner: byTotal[0] ?? null,
      statLabel: "Total",
      statValue: byTotal[0] ? getWeightedScore(byTotal[0]) : 0,
    },
    {
      key: "valedictorian",
      label: "Valedictorian",
      icon: "🎓",
      winner: byAcademics[0] ?? null,
      statLabel: "Academics",
      statValue: byAcademics[0]?.academics ?? 0,
    },
    {
      key: "social",
      label: "Social Butterfly",
      icon: "🦋",
      winner: bySocial[0] ?? null,
      statLabel: "Social",
      statValue: bySocial[0]?.social ?? 0,
    },
    {
      key: "money",
      label: "Biggest Bag",
      icon: "💰",
      winner: byMoney[0] ?? null,
      statLabel: "Money",
      statValue: byMoney[0]?.money ?? 0,
    },
    {
      key: "wellbeing",
      label: "Zen Master",
      icon: "🧘",
      winner: byWellbeing[0] ?? null,
      statLabel: "Wellbeing",
      statValue: byWellbeing[0]?.wellbeing ?? 0,
    },
  ];
}

function computeActionCounts(history: ActionHistoryRow[]) {
  const map = new Map<
    string,
    Record<string, number> & { total: number }
  >();
  for (const row of history) {
    if (!map.has(row.player_id)) {
      map.set(row.player_id, {
        class: 0, study: 0, work: 0, exercise: 0,
        socialize: 0, rest: 0, sleep: 0, wildcard: 0,
        total: 0,
      });
    }
    const entry = map.get(row.player_id)!;
    if (row.action in entry) {
      entry[row.action] += 1;
      entry.total += 1;
    }
  }
  return map;
}

function formatStat(n: number | undefined) {
  if (typeof n !== "number") return "0";
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function StatBadge({ label, value }: { label: string; value?: number }) {
  const v = typeof value === "number" ? Math.round(value * 100) / 100 : 0;
  return (
    <span className="text-[10px] text-muted text-center min-w-[1.8rem]">
      <span className="block text-[9px] opacity-60">{label}</span>
      {v}
    </span>
  );
}
