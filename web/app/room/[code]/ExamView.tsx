"use client";

import { useMemo, useState } from "react";
import { resolveExamForRoom } from "@/utils/exam-resolution";
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
  B: "#8fb58e",
  C: "#F3E5AB",
  D: "#d99f4f",
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

  const [continuing, setContinuing] = useState(false);

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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center pt-6 mb-8">
          <p className="text-muted text-sm uppercase tracking-widest mb-2">
            Week {isFinal ? 3 : 2} · Day {currentDay}
          </p>
          <h1 className="text-4xl font-bold text-paper">{title}</h1>
          <p className="text-muted text-sm mt-2">
            Academics + Wellbeing determine your grade
          </p>
        </div>

        {/* Collective report board */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {results.map((result) => {
            const color = getAvatarColor(result.playerName);
            const gradeColor = GRADE_COLORS[result.grade];

            return (
              <div
                key={result.playerId}
                className="rounded-2xl border border-card-border bg-card p-4 flex flex-col items-center text-center"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white mb-3"
                  style={{ backgroundColor: color }}
                >
                  {getInitials(result.playerName)}
                </div>
                <p className="text-sm font-semibold text-paper mb-1">
                  {result.playerName}
                </p>

                {/* Grade circle */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mb-3"
                  style={{
                    backgroundColor: gradeColor + "18",
                    border: `2px solid ${gradeColor}50`,
                    color: gradeColor,
                  }}
                >
                  {result.grade}
                </div>

                {/* Stats */}
                <div className="w-full space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Academics</span>
                    <span className="text-paper font-medium">
                      {result.oldAcademics.toFixed(2)}
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
          })}
        </div>

        {/* Continue button */}
        <div className="mt-10 text-center">
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
      </div>
    </div>
  );
}
