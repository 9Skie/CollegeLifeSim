"use client";

import { useEffect, useMemo, useState } from "react";
import { resolveExamForRoom, computeExamResult } from "@/utils/exam-resolution";
import type { ExamResult, ExamGrade } from "@/utils/exam-resolution";

type Player = {
  id: string;
  name: string;
  academics?: number | string | null;
  wellbeing?: number | string | null;
  eliminated?: boolean;
};

const GRADE_COLORS: Record<ExamGrade, string> = {
  A: "#5b8c5a",
  B: "#F3E5AB",
  C: "#8a8579",
  D: "#d94f4f",
  F: "#d94f4f",
};

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

export default function ExamView({
  roomCode,
  currentDay,
  players,
  isHost,
  onContinue,
}: {
  roomCode: string;
  currentDay: number;
  players: Player[];
  isHost: boolean;
  onContinue: () => Promise<void>;
}) {
  const isFinal = currentDay >= 19;
  const title = isFinal ? "Finals" : "Midterm";

  const results = useMemo(() => {
    return resolveExamForRoom({ currentDay, players }).results;
  }, [currentDay, players]);

  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const [showButton, setShowButton] = useState(false);
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    for (let i = 0; i < results.length; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleCards((prev) => [...prev, i]);
        }, 400 + i * 500)
      );
    }
    timers.push(
      setTimeout(() => {
        setShowButton(true);
      }, 400 + results.length * 500 + 600)
    );
    return () => timers.forEach(clearTimeout);
  }, [results.length]);

  const handleContinue = async () => {
    setContinuing(true);
    try {
      await onContinue();
    } finally {
      setContinuing(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center pt-8 mb-10">
          <p className="text-muted text-sm uppercase tracking-widest mb-2">
            Week {isFinal ? 3 : 2} · Day {currentDay}
          </p>
          <h1 className="text-4xl font-bold text-paper">{title}</h1>
          <p className="text-muted text-sm mt-2">
            Academics + Wellbeing determine your grade
          </p>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {results.map((result, i) => {
            const color = getAvatarColor(result.playerName);
            const isVisible = visibleCards.includes(i);
            const gradeColor = GRADE_COLORS[result.grade];

            return (
              <div
                key={result.playerId}
                className={`rounded-2xl border border-card-border bg-card p-5 transition-all duration-500 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {getInitials(result.playerName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-paper">
                      {result.playerName}
                    </p>
                    <p className="text-xs text-muted">
                      Academics {result.oldAcademics.toFixed(2)} · Wellbeing{" "}
                      {result.oldWellbeing.toFixed(2)}
                    </p>
                  </div>
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black shrink-0"
                    style={{
                      backgroundColor: gradeColor + "18",
                      border: `2px solid ${gradeColor}40`,
                      color: gradeColor,
                    }}
                  >
                    {result.grade}
                  </div>
                </div>

                {/* Stat changes */}
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted">
                    Academics{" "}
                    <span className="text-paper font-medium">
                      {result.oldAcademics.toFixed(2)}
                    </span>
                    {result.academicsChange !== 0 && (
                      <span
                        className="ml-1 font-bold"
                        style={{
                          color:
                            result.academicsChange > 0 ? "#5b8c5a" : "#d94f4f",
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
                  <span className="text-muted">
                    Wellbeing{" "}
                    <span className="text-paper font-medium">
                      {result.oldWellbeing.toFixed(2)}
                    </span>
                    <span className="text-[#5b8c5a] font-bold ml-1">+1.00</span>
                    <span className="text-paper font-bold ml-1">
                      → {result.newWellbeing.toFixed(2)}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue button */}
        {showButton && (
          <div className="mt-8 text-center transition-all duration-500 opacity-100 translate-y-0">
            {isHost ? (
              <button
                onClick={handleContinue}
                disabled={continuing}
                className={`px-8 py-3 rounded-xl font-semibold transition active:translate-y-0.5 shadow-lg shadow-accent/20 ${
                  continuing
                    ? "bg-card-border text-muted cursor-not-allowed shadow-none"
                    : "bg-accent text-paper hover:bg-accent/90"
                }`}
              >
                {continuing
                  ? "Continuing..."
                  : isFinal
                  ? "See Final Results →"
                  : "Continue →"}
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
