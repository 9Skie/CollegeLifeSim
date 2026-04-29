"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MAJORS,
  MAJOR_DATA,
  POSITIVE_TRAITS,
  POSITIVE_TRAIT_DATA,
  NEGATIVE_TRAITS,
  NEGATIVE_TRAIT_DATA,
} from "./gameData";

const ITEM_HEIGHT = 64;
const CONTAINER_HEIGHT = 180;
const PAD = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;

/* ------------------------------------------------------------------ */
// Roulette hook

function useRoulette<T>(items: T[], targetIndex: number, durationMs: number) {
  const [landed, setLanded] = useState(false);
  const [offset, setOffset] = useState(0);

  const { strip, finalIndex } = useMemo(() => {
    const cycles = Math.max(12, Math.ceil(60 / items.length));
    const strip = Array.from({ length: cycles }, () => items).flat();
    const landCycle = cycles - 2;
    const finalIndex = landCycle * items.length + targetIndex;
    return { strip, finalIndex };
  }, [items, targetIndex]);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setOffset(-finalIndex * ITEM_HEIGHT);
    }, 80);
    const t2 = setTimeout(() => {
      setLanded(true);
    }, durationMs + 80);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [finalIndex, durationMs]);

  return {
    strip,
    offset,
    landed,
    winner: items[targetIndex],
  };
}

/* ------------------------------------------------------------------ */
// Component

export default function CharacterSetup({ onReady }: { onReady: () => void }) {
  const [majorIndex] = useState(() =>
    Math.floor(Math.random() * MAJORS.length)
  );
  const [posIndex] = useState(() =>
    Math.floor(Math.random() * POSITIVE_TRAITS.length)
  );
  const [negIndex] = useState(() =>
    Math.floor(Math.random() * NEGATIVE_TRAITS.length)
  );

  const majorR = useRoulette([...MAJORS], majorIndex, 2000);
  const posR = useRoulette([...POSITIVE_TRAITS], posIndex, 3000);
  const negR = useRoulette([...NEGATIVE_TRAITS], negIndex, 4000);

  const allLanded = majorR.landed && posR.landed && negR.landed;

  const [allocated, setAllocated] = useState({
    academics: 0,
    social: 0,
    wellbeing: 0,
    money: 0,
  });

  const spent = Object.values(allocated).reduce((a, b) => a + b, 0);
  const remaining = 3 - spent;
  const canReady = allLanded && remaining === 0;

  const adjust = (key: keyof typeof allocated, delta: number) => {
    if (delta > 0 && remaining <= 0) return;
    if (delta < 0 && allocated[key] <= 0) return;
    setAllocated((p) => ({ ...p, [key]: p[key] + delta }));
  };

  const handleReady = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cls.major", MAJORS[majorIndex]);
      localStorage.setItem("cls.posTrait", POSITIVE_TRAITS[posIndex]);
      localStorage.setItem("cls.negTrait", NEGATIVE_TRAITS[negIndex]);
      localStorage.setItem("cls.stats", JSON.stringify(allocated));
    }
    onReady();
  };

  const majorName = MAJORS[majorIndex];
  const posName = POSITIVE_TRAITS[posIndex];
  const negName = NEGATIVE_TRAITS[negIndex];

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-paper text-center mb-2">
        Character Creation
      </h1>
      <p className="text-muted text-center mb-8">
        Your semester identity is being dealt…
      </p>

      {/* Roulettes — side by side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <RouletteCard title="Major" roulette={majorR} landedClass="text-[#F3E5AB]">
          {majorR.landed && (
            <div className="mt-3 pt-3 border-t border-card-border">
              <p className="text-sm text-paper/80 leading-snug mb-2">
                {MAJOR_DATA[majorName]?.focus}
              </p>
              <div className="rounded-md bg-[#F3E5AB]/10 border border-[#F3E5AB]/20 px-2.5 py-1.5">
                <p className="text-xs text-[#F3E5AB] font-medium">
                  {MAJOR_DATA[majorName]?.weights}
                </p>
              </div>
            </div>
          )}
        </RouletteCard>

        <RouletteCard
          title="Positive Trait"
          roulette={posR}
          landedClass="text-green-400"
        >
          {posR.landed && (
            <div className="mt-3 pt-3 border-t border-card-border">
              <p className="text-sm text-paper/80 leading-snug mb-2">
                {POSITIVE_TRAIT_DATA[posName]?.desc}
              </p>
              <div className="rounded-md bg-green-400/10 border border-green-400/20 px-2.5 py-1.5">
                <p className="text-xs text-green-400 font-medium">
                  {POSITIVE_TRAIT_DATA[posName]?.effect}
                </p>
              </div>
            </div>
          )}
        </RouletteCard>

        <RouletteCard
          title="Negative Trait"
          roulette={negR}
          landedClass="text-accent"
        >
          {negR.landed && (
            <div className="mt-3 pt-3 border-t border-card-border">
              <p className="text-sm text-paper/80 leading-snug mb-2">
                {NEGATIVE_TRAIT_DATA[negName]?.desc}
              </p>
              <div className="rounded-md bg-accent/10 border border-accent/20 px-2.5 py-1.5">
                <p className="text-xs text-accent font-medium">
                  {NEGATIVE_TRAIT_DATA[negName]?.effect}
                </p>
              </div>
            </div>
          )}
        </RouletteCard>
      </div>

      {/* Stat distribution */}
      {allLanded && (
        <div
          className="rounded-2xl border border-card-border bg-card p-6 mb-6"
          style={{ animation: "fadeUp 0.5s ease-out both" }}
        >
          <h2 className="text-lg font-bold text-paper mb-1">
            Distribute 3 Stat Points
          </h2>
          <p className="text-muted text-sm mb-6">
            {remaining > 0
              ? `${remaining} point${remaining !== 1 ? "s" : ""} remaining`
              : "All points spent — you're ready"}
          </p>

          <div className="space-y-4">
            {(
              [
                ["academics", "Academics"],
                ["social", "Social"],
                ["wellbeing", "Wellbeing"],
                ["money", "Money"],
              ] as const
            ).map(([key, label]) => {
              const base = { academics: 1, social: 1, wellbeing: 5, money: 2 }[
                key
              ];
              const added = allocated[key];
              const value = base + added;
              const basePct = (base / 10) * 100;
              const addedPct = (added / 10) * 100;

              return (
                <div key={key} className="flex items-center gap-4">
                  <div className="w-28 shrink-0">
                    <p className="text-sm font-semibold text-paper">{label}</p>
                    <p className="text-xs text-muted tabular-nums">
                      {value.toFixed(1)}
                    </p>
                  </div>

                  <div className="flex-1 h-3 bg-background rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${basePct}%` }}
                    />
                    <div
                      className="h-full bg-paper transition-all duration-300"
                      style={{ width: `${addedPct}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => adjust(key, -1)}
                      disabled={allocated[key] <= 0}
                      className="w-8 h-8 rounded-lg bg-background border border-card-border text-paper hover:border-muted disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-mono text-paper">
                      +{allocated[key]}
                    </span>
                    <button
                      onClick={() => adjust(key, 1)}
                      disabled={remaining <= 0}
                      className="w-8 h-8 rounded-lg bg-background border border-card-border text-paper hover:border-muted disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ready */}
      {allLanded && (
        <div className="flex justify-end">
          <button
            onClick={handleReady}
            disabled={!canReady}
            title={
              canReady ? "Lock in your character" : "Spend all 3 points first"
            }
            className={`px-8 py-3 rounded-xl font-semibold transition active:translate-y-0.5 ${
              canReady
                ? "bg-accent text-paper hover:bg-accent/90 shadow-lg shadow-accent/20"
                : "bg-card-border text-muted cursor-not-allowed"
            }`}
          >
            I'm Ready →
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
// Roulette sub-component

function RouletteCard<T>({
  title,
  roulette,
  landedClass = "text-paper",
  children,
}: {
  title: string;
  roulette: ReturnType<typeof useRoulette<T>>;
  landedClass?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-card-border bg-card p-5">
      <p className="text-xs uppercase tracking-widest text-muted mb-3">
        {title}
      </p>

      {roulette.landed ? (
        <div>
          <div
            className="flex items-center justify-center px-2"
            style={{ height: CONTAINER_HEIGHT }}
          >
            <span
              className={`text-xl font-bold text-center ${landedClass}`}
              style={{ animation: "popIn 0.35s ease-out" }}
            >
              {String(roulette.winner)}
            </span>
          </div>
          {children}
        </div>
      ) : (
        <div
          className="relative overflow-hidden"
          style={{
            height: CONTAINER_HEIGHT,
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)",
          }}
        >
          <div
            className="absolute left-4 right-4 top-1/2 -translate-y-1/2 rounded-lg border border-accent/10 pointer-events-none"
            style={{ height: ITEM_HEIGHT }}
          />

          <div
            className="will-change-transform"
            style={{
              paddingTop: PAD,
              paddingBottom: PAD,
              transform: `translateY(${roulette.offset}px)`,
              transition: `transform ${
                title === "Major" ? 2000 : title === "Positive Trait" ? 3000 : 4000
              }ms cubic-bezier(0.25, 1, 0.5, 1)`,
            }}
          >
            {roulette.strip.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-center text-base font-semibold text-paper/30 select-none px-2 text-center"
                style={{ height: ITEM_HEIGHT }}
              >
                {String(item)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
