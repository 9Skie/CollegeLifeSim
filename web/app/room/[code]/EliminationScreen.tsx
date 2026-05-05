"use client";

import { useState } from "react";

export default function EliminationScreen({
  onContinue,
}: {
  onContinue: () => void;
}) {
  const [dismissing, setDismissing] = useState(false);

  const handleContinue = () => {
    setDismissing(true);
    setTimeout(onContinue, 300);
  };

  return (
    <div
      className={`flex-1 flex items-center justify-center p-6 transition-opacity duration-300 ${
        dismissing ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="max-w-sm w-full text-center">
        <p className="text-4xl mb-4">😵</p>
        <p className="text-muted text-sm leading-relaxed mb-8">
          Your wellbeing was too low. You had to take a leave of absence.
        </p>

        <button
          onClick={handleContinue}
          className="px-6 py-2.5 rounded-xl text-sm font-medium bg-card border border-card-border text-paper hover:bg-card-border transition active:translate-y-0.5"
        >
          Continue as Spectator
        </button>
      </div>
    </div>
  );
}
