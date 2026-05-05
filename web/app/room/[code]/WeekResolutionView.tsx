"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { StoredResolution } from "@/utils/day-resolution";
import { getAvatarColor, getInitials } from "@/utils/player-avatar";

type Player = { id: string; name: string; eliminated?: boolean };

type RelationshipRow = {
  player_a: string;
  player_b: string;
  level: number;
  progress: number;
};

type DayActionRow = {
  day: number;
  slot: string;
  action: string;
  target_id: string | null;
};

function getActionLabel(id: string): string {
  const map: Record<string, string> = {
    class: "Class", study: "Study", work: "Work",
    exercise: "Exercise", socialize: "Socialize",
    rest: "Rest", sleep: "Sleep", wildcard: "Wildcard",
  };
  return map[id] || id;
}

function getActionIcon(id: string): string {
  const map: Record<string, string> = {
    class: "🎓", study: "📚", work: "💼",
    exercise: "🏃", socialize: "💬",
    rest: "🛋️", sleep: "😴", wildcard: "🃏",
  };
  return map[id] || "❓";
}

function formatStatChange(val: number): string {
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(2).replace(/\.00$/, "").replace(/\.0$/, "")}`;
}

export default function WeekResolutionView({
  roomCode,
  currentDay,
  playerId,
  myName,
  players,
  isHost,
  onContinue,
}: {
  roomCode: string;
  currentDay: number;
  playerId: string;
  myName: string;
  players: Player[];
  isHost: boolean;
  onContinue: () => Promise<void>;
}) {
  const currentWeek = Math.floor((currentDay - 1) / 7) + 1;
  const weekStartDay = (currentWeek - 1) * 7 + 1;
  const weekEndDay = Math.min(weekStartDay + 6, currentDay);

  const [resolutions, setResolutions] = useState<StoredResolution[]>([]);
  const [actions, setActions] = useState<DayActionRow[]>([]);
  const [relationships, setRelationships] = useState<RelationshipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);

  const [showPenalties, setShowPenalties] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showRelationships, setShowRelationships] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const didAnimate = useRef(false);

  useEffect(() => {
    if (didAnimate.current) return;
    didAnimate.current = true;

    const t1 = setTimeout(() => setShowPenalties(true), 300);
    const t2 = setTimeout(() => setShowActions(true), 900);
    const t3 = setTimeout(() => setShowStats(true), 1800);
    const t4 = setTimeout(() => setShowRelationships(true), 2700);
    const t5 = setTimeout(() => setShowButton(true), 3500);

    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      setLoading(true);
      const [{ data: resData }, { data: actData }, { data: relData }] = await Promise.all([
        supabase
          .from("resolutions")
          .select("room_code, day, player_id, old_stats, new_stats, changes, highlights")
          .eq("room_code", roomCode)
          .eq("player_id", playerId)
          .gte("day", weekStartDay)
          .lte("day", weekEndDay)
          .order("day", { ascending: true }),
        supabase
          .from("day_actions")
          .select("day, slot, action, target_id")
          .eq("room_code", roomCode)
          .eq("player_id", playerId)
          .gte("day", weekStartDay)
          .lte("day", weekEndDay)
          .order("day", { ascending: true }),
        supabase
          .from("relationships")
          .select("player_a, player_b, level, progress")
          .eq("room_code", roomCode),
      ]);
      setResolutions((resData as StoredResolution[]) || []);
      setActions((actData as DayActionRow[]) || []);
      setRelationships((relData as RelationshipRow[]) || []);
      setLoading(false);
    }

    load();
  }, [roomCode, playerId, weekStartDay, weekEndDay]);

  const weekStats = useMemo(() => {
    if (resolutions.length === 0) return null;
    const first = resolutions[0];
    const last = resolutions[resolutions.length - 1];
    return {
      academics: {
        start: first.old_stats.academics as number,
        end: last.new_stats.academics as number,
        change: (last.new_stats.academics as number) - (first.old_stats.academics as number),
      },
      social: {
        start: first.old_stats.social as number,
        end: last.new_stats.social as number,
        change: (last.new_stats.social as number) - (first.old_stats.social as number),
      },
      wellbeing: {
        start: first.old_stats.wellbeing as number,
        end: last.new_stats.wellbeing as number,
        change: (last.new_stats.wellbeing as number) - (first.old_stats.wellbeing as number),
      },
      money: {
        start: first.old_stats.money as number,
        end: last.new_stats.money as number,
        change: (last.new_stats.money as number) - (first.old_stats.money as number),
      },
    };
  }, [resolutions]);

  const actionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const action of actions) {
      counts.set(action.action, (counts.get(action.action) || 0) + 1);
    }
    return counts;
  }, [actions]);

  const myRelationships = useMemo(() => {
    return relationships
      .filter((r) => r.player_a === playerId || r.player_b === playerId)
      .map((r) => {
        const otherId = r.player_a === playerId ? r.player_b : r.player_a;
        const other = players.find((p) => p.id === otherId);
        return {
          name: other?.name || "Unknown",
          level: r.level,
          progress: r.progress,
        };
      });
  }, [relationships, playerId, players]);

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
        <p className="text-muted text-sm">Loading week summary...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center pt-6 mb-8">
          <p className="text-muted text-sm uppercase tracking-widest mb-2">
            Week {currentWeek} Complete
          </p>
          <h1 className="text-4xl font-bold text-paper">Week in Review</h1>
          <p className="text-muted text-sm mt-2">
            Days {weekStartDay}–{weekEndDay}
          </p>
        </div>

        {/* 1. HW & Class Penalty */}
        {weekStats && (
          <div
            className={`rounded-2xl border border-card-border bg-card p-5 mb-4 transition-all duration-500 ${
              showPenalties ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <p className="text-[10px] uppercase tracking-widest text-accent mb-3">
              End-of-Week Penalties
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Homework quota</span>
                <span className="text-paper font-medium">
                  {(() => {
                    const studies = actions.filter((a) => a.action === "study").length;
                    const missed = Math.max(0, 4 - studies);
                    return missed > 0 ? `−${(missed * 1).toFixed(1)} Academics` : "Met ✓";
                  })()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Classes attended</span>
                <span className="text-paper font-medium">
                  {(() => {
                    const classes = actions.filter((a) => a.action === "class").length;
                    const scheduled = 3;
                    const missed = Math.max(0, scheduled - classes);
                    return missed > 0 ? `−${(missed * 1).toFixed(1)} Academics` : "All attended ✓";
                  })()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. All Actions */}
        <div
          className={`transition-all duration-500 mb-4 ${
            showActions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <p className="text-[10px] uppercase tracking-widest text-muted mb-3">
            Actions This Week
          </p>
          <div className="rounded-xl border border-card-border bg-card p-3">
            {actionCounts.size === 0 ? (
              <p className="text-sm text-muted text-center py-2">No actions this week</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Array.from(actionCounts.entries()).map(([action, count]) => (
                  <div
                    key={action}
                    className="flex items-center gap-2 rounded-lg border border-card-border bg-background/50 px-3 py-2"
                  >
                    <span className="text-lg">{getActionIcon(action)}</span>
                    <div>
                      <p className="text-[10px] text-paper font-medium">
                        {getActionLabel(action)}
                      </p>
                      <p className="text-[9px] text-muted">× {count}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. All Stats */}
        {weekStats && (
          <div
            className={`rounded-2xl border border-card-border bg-card p-5 mb-4 transition-all duration-500 ${
              showStats ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <p className="text-[10px] uppercase tracking-widest text-muted mb-3">
              Stat Changes This Week
            </p>
            <div className="space-y-3">
              {[
                { label: "Academics", ...weekStats.academics },
                { label: "Social", ...weekStats.social },
                { label: "Wellbeing", ...weekStats.wellbeing },
                { label: "Money", ...weekStats.money },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted">{stat.label}</span>
                    <span
                      className="font-bold"
                      style={{
                        color: stat.change > 0 ? "#5b8c5a" : stat.change < 0 ? "#d94f4f" : "#8a8579",
                      }}
                    >
                      {formatStatChange(stat.change)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-background overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, Math.max(0, (stat.end / 10) * 100))}%`,
                        backgroundColor:
                          stat.end >= 7
                            ? "#5b8c5a"
                            : stat.end >= 4
                            ? "#F3E5AB"
                            : "#d94f4f",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted mt-0.5">
                    <span>{stat.start.toFixed(1)}</span>
                    <span>{stat.end.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Relationship Changes */}
        <div
          className={`transition-all duration-500 mb-4 ${
            showRelationships ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <p className="text-[10px] uppercase tracking-widest text-muted mb-3">
            Relationships
          </p>
          {myRelationships.length === 0 ? (
            <div className="rounded-xl border border-dashed border-card-border bg-background/30 p-4 text-center">
              <p className="text-sm text-muted">No relationships formed this week</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {myRelationships.map((rel) => {
                const color = getAvatarColor(rel.name);
                const word =
                  rel.level === 0
                    ? "Stranger"
                    : rel.level === 1
                    ? "Acquaintance"
                    : rel.level === 2
                    ? "Friend"
                    : "Soul Mate";
                return (
                  <div
                    key={rel.name}
                    className="flex items-center gap-3 rounded-xl border border-card-border bg-card px-4 py-3"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {getInitials(rel.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-paper">{rel.name}</p>
                      <p className="text-[10px] text-muted">
                        Lv {rel.level} — {word}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#F3E5AB]">{rel.progress}</p>
                      <p className="text-[9px] text-muted">progress</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Continue button */}
        {showButton && (
          <div className="mt-10 text-center transition-all duration-500">
            {isHost ? (
              <button
                onClick={async () => {
                  setContinuing(true);
                  try {
                    await onContinue();
                  } finally {
                    setContinuing(false);
                  }
                }}
                disabled={continuing}
                className={`px-8 py-3 rounded-xl font-semibold transition active:translate-y-0.5 shadow-lg shadow-accent/20 ${
                  continuing
                    ? "bg-card-border text-muted cursor-not-allowed shadow-none"
                    : "bg-accent text-paper hover:bg-accent/90"
                }`}
              >
                {continuing ? "Continuing..." : "Continue →"}
              </button>
            ) : (
              <p className="text-sm text-muted">
                Waiting for the host to continue...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
