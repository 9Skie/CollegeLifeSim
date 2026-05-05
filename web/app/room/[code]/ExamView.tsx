"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import type { ExamResult, ExamGrade } from "@/utils/exam-resolution";

const GRADE_RANK: Record<ExamGrade, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 };
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
  results,
  isHost,
  onContinue,
  myName,
}: {
  currentDay: number;
  results: ExamResult[] | null;
  isHost: boolean;
  onContinue: () => Promise<void>;
  myName: string;
}) {
  const isFinal = currentDay >= 19;
  const title = isFinal ? "Finals" : "Midterm";

  const allResults = useMemo(() => results || [], [results]);

  // Sort by grade rank descending (A first, F last)
  const sortedResults = useMemo(() => {
    return [...allResults].sort(
      (a, b) => GRADE_RANK[b.grade] - GRADE_RANK[a.grade]
    );
  }, [allResults]);

  const myResult = allResults.find((r) => r.playerName === myName);

  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const [showButton, setShowButton] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const didAnimate = useRef(false);

  useEffect(() => {
    if (didAnimate.current || sortedResults.length === 0) return;
    didAnimate.current = true;

    const timers: NodeJS.Timeout[] = [];
    const total = myResult ? 1 + sortedResults.length : sortedResults.length;
    for (let i = 0; i < total; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleCards((prev) => [...prev, i]);
        }, 300 + i * 400)
      );
    }
    timers.push(
      setTimeout(() => {
        setShowButton(true);
      }, 300 + total * 400 + 600)
    );
    return () => timers.forEach(clearTimeout);
  }, [sortedResults.length, myResult]);

  const handleContinue = async () => {
    setContinuing(true);
    try {
      await onContinue();
    } finally {
      setContinuing(false);
    }
  };

  function ResultCard({
    result,
    isVisible,
    isMe,
    size = "normal",
  }: {
    result: ExamResult;
    isVisible: boolean;
    isMe: boolean;
    size?: "hero" | "normal";
  }) {
    const color = getAvatarColor(result.playerName);
    const gradeColor = GRADE_COLORS[result.grade];
    const isHero = size === "hero";

    return (
      <div
        className={`rounded-2xl border bg-card flex items-center transition-all duration-500 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        } ${isMe ? "border-[#F3E5AB]/60" : "border-card-border"}`}
        style={isHero ? { padding: "1.75rem", flexDirection: "column", textAlign: "center" } : { padding: "0.875rem 1rem" }}
      >
        {isHero ? (
          <>
            <div
              className="rounded-full flex items-center justify-center font-bold text-white mb-3 w-16 h-16 text-lg"
              style={{ backgroundColor: color }}
            >
              {getInitials(result.playerName)}
            </div>
            <p className="font-semibold text-paper mb-1 text-lg">
              {result.playerName}
              <span className="ml-1.5 text-[10px] font-bold text-[#F3E5AB] uppercase tracking-wider">
                You
              </span>
            </p>
            <div
              className="rounded-full flex items-center justify-center font-black mb-3 w-20 h-20 text-3xl"
              style={{
                backgroundColor: gradeColor + "18",
                border: `2px solid ${gradeColor}50`,
                color: gradeColor,
              }}
            >
              {result.grade}
            </div>
            <div className="w-full space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Academics</span>
                <span className="text-paper font-medium">
                  {result.oldAcademics.toFixed(2)}
                  {result.academicsChange !== 0 && (
                    <span
                      className="ml-1 font-bold"
                      style={{ color: result.academicsChange > 0 ? "#5b8c5a" : "#d94f4f" }}
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
                  {result.wellbeingChange !== 0 && (
                    <span
                      className="font-bold ml-1"
                      style={{ color: result.wellbeingChange > 0 ? "#5b8c5a" : "#d94f4f" }}
                    >
                      {result.wellbeingChange > 0 ? "+" : ""}
                      {result.wellbeingChange.toFixed(2)}
                    </span>
                  )}
                  <span className="text-paper font-bold ml-1">
                    → {result.newWellbeing.toFixed(2)}
                  </span>
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              className="rounded-full flex items-center justify-center font-bold text-white shrink-0 w-10 h-10 text-xs"
              style={{ backgroundColor: color }}
            >
              {getInitials(result.playerName)}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="font-semibold text-paper text-sm truncate">
                {result.playerName}
                {isMe && (
                  <span className="ml-1.5 text-[10px] font-bold text-[#F3E5AB] uppercase tracking-wider">
                    You
                  </span>
                )}
              </p>
            </div>
            <div
              className="rounded-full flex items-center justify-center font-black shrink-0 ml-3 w-12 h-12 text-lg"
              style={{
                backgroundColor: gradeColor + "18",
                border: `2px solid ${gradeColor}50`,
                color: gradeColor,
              }}
            >
              {result.grade}
            </div>
          </>
        )}
      </div>
    );
  }

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

        {/* Your grade — hero card */}
        {myResult && (
          <div className="mb-6">
            <p className="text-center text-[10px] uppercase tracking-widest text-[#F3E5AB] mb-3">
              Your Result
            </p>
            <div className="max-w-xs mx-auto">
              <ResultCard
                result={myResult}
                isVisible={visibleCards.includes(0)}
                isMe={true}
                size="hero"
              />
            </div>
          </div>
        )}

        {/* Full class roster — ranked by grade */}
        <div className="mb-2">
          <p className="text-center text-[10px] uppercase tracking-widest text-muted mb-3">
            Full Class Rankings
          </p>
        </div>
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          {sortedResults.map((result, i) => {
            const index = myResult ? i + 1 : i;
            const isMe = result.playerName === myName;
            return (
              <ResultCard
                key={result.playerId}
                result={result}
                isVisible={visibleCards.includes(index)}
                isMe={isMe}
                size="normal"
              />
            );
          })}
        </div>

        {/* Continue button */}
        {showButton && (
          <div className="mt-10 text-center transition-all duration-500 opacity-100 translate-y-0">
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
