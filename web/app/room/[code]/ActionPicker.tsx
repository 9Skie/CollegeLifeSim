"use client";

import { useState } from "react";
import type { Selection } from "@/utils/day-actions";

export type { Selection } from "@/utils/day-actions";

type ActionDef = {
  id: string;
  label: string;
  icon: string;
  desc: string;
  needsTarget?: boolean;
  hasTiers?: boolean;
};

function getActions(
  slot: string,
  hasClass: boolean,
  workAvailable: boolean
): ActionDef[] {
  const base: ActionDef[] = [
    {
      id: "socialize",
      label: "Socialize",
      icon: "💬",
      desc: "Social +1, spend boosts target",
      needsTarget: true,
      hasTiers: true,
    },
    { id: "wildcard", label: "Wildcard", icon: "🃏", desc: "Random event card" },
  ];

  if (slot === "morning") {
    if (hasClass) {
      return [
        { id: "class", label: "Class", icon: "🎓", desc: "Academics +0.75, Social +0.25" },
        ...base,
        { id: "exercise", label: "Exercise", icon: "🏃", desc: "Wellbeing +1" },
        { id: "rest", label: "Rest", icon: "🛋️", desc: "Wellbeing +0.75" },
      ];
    }
    return [
      { id: "study", label: "Study", icon: "📚", desc: "Academics +1" },
      ...base,
      ...(workAvailable ? [{ id: "work", label: "Work", icon: "💼", desc: "Money +1" }] : []),
      { id: "exercise", label: "Exercise", icon: "🏃", desc: "Wellbeing +1" },
      { id: "rest", label: "Rest", icon: "🛋️", desc: "Wellbeing +0.75" },
    ];
  }

  if (slot === "afternoon") {
    const actions: ActionDef[] = [];
    if (hasClass) {
      actions.push({
        id: "class",
        label: "Class",
        icon: "🎓",
        desc: "Academics +0.75, Social +0.25",
      });
    } else {
      actions.push({ id: "study", label: "Study", icon: "📚", desc: "Academics +1" });
    }
    actions.push(...base);
    actions.push({ id: "exercise", label: "Exercise", icon: "🏃", desc: "Wellbeing +1" });
    actions.push({ id: "rest", label: "Rest", icon: "🛋️", desc: "Wellbeing +0.75" });
    if (workAvailable) {
      actions.push({ id: "work", label: "Work", icon: "💼", desc: "Money +1" });
    }
    return actions;
  }

  // night
  return [
    { id: "study", label: "Study", icon: "📚", desc: "Academics +1" },
    ...base,
    { id: "sleep", label: "Sleep", icon: "😴", desc: "Wellbeing +1" },
    { id: "work", label: "Work", icon: "💼", desc: "Money +1" },
  ];
}

const SPEND_TIERS = [
  { value: 0 as const, label: "Free", cost: "0 Money" },
  { value: 1 as const, label: "Coffee", cost: "0.25 Money" },
  { value: 2 as const, label: "Food", cost: "0.5 Money" },
];

export default function ActionPicker({
  slot,
  hasClass,
  workAvailable,
  players,
  currentPlayerId,
  heldCodes,
  usedWildcard,
  currentSelection,
  onSelect,
  onConfirm,
  onClose,
}: {
  slot: string;
  hasClass: boolean;
  workAvailable: boolean;
  players: Array<{ id: string; name: string; eliminated?: boolean }>;
  currentPlayerId: string | null;
  heldCodes: Array<{ code: string; name: string }>;
  usedWildcard: boolean;
  currentSelection: Selection | null;
  onSelect: (s: Selection | null) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const otherPlayers = players.filter((player) => player.id !== currentPlayerId && !player.eliminated);

  const actions = getActions(slot, hasClass, workAvailable);

  const [draft, setDraft] = useState<Selection | null>(currentSelection);

  const picked = actions.find((a) => a.id === draft?.actionId);

  const pickAction = (action: ActionDef) => {
    if (action.id === draft?.actionId) {
      setDraft(null);
      onSelect(null);
      return;
    }
    const base: Selection = { actionId: action.id };
    if (action.needsTarget && otherPlayers.length > 0) {
      base.targetId = otherPlayers[0].id;
    }
    if (action.hasTiers) {
      base.spend = 0;
    }
    setDraft(base);
    onSelect(base);
  };

  const updateDraft = (patch: Partial<Selection>) => {
    const next = { ...draft!, ...patch };
    setDraft(next);
    onSelect(next);
  };

  const canConfirm = !!draft && (!picked?.needsTarget || !!draft.targetId);
  const skippingClass = hasClass && draft?.actionId !== "class";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg rounded-2xl border border-card-border bg-card p-6 shadow-2xl"
        style={{ animation: "popIn 0.2s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-paper capitalize">{slot}</h2>
            <p className="text-sm text-muted">Pick an action</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-background border border-card-border text-muted hover:text-paper transition flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Class skip warning */}
        {skippingClass && (
        )}

        <div className="grid grid-cols-2 gap-3 mb-5">
          {actions.map((action) => {
            const selected = draft?.actionId === action.id;
            const wildcardBlocked = action.id === "wildcard" && usedWildcard;
            return (
              <button
                key={action.id}
                onClick={() => !wildcardBlocked && pickAction(action)}
                className={`rounded-xl border p-4 text-left transition active:translate-y-0.5 ${
                  selected
                    ? "border-[#F3E5AB] bg-[#F3E5AB]/5"
                    : wildcardBlocked
                    ? "border-card-border opacity-30 cursor-not-allowed"
                    : "border-card-border hover:border-muted"
                }`}
                disabled={wildcardBlocked}
              >
                <span className="text-2xl mb-1 block">{action.icon}</span>
                <p className="text-sm font-semibold text-paper">
                  {action.label}
                </p>
                <p className="text-xs text-muted mt-0.5">{action.desc}</p>
                {wildcardBlocked && (
                  <span className="text-[10px] text-muted mt-1 block">
                    Already used today
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {picked && (
          <div className="space-y-4 mb-6">
            {picked.id === "wildcard" && (
              <div>
                <p className="text-sm font-semibold text-paper mb-2">
                  Have an event code?
                </p>
                <input
                  type="text"
                  value={draft?.code || ""}
                  onChange={(e) =>
                    updateDraft({ code: e.target.value.toUpperCase() })
                  }
                  placeholder="Enter code..."
                  className="w-full rounded-lg bg-background border border-card-border px-3 py-2 text-paper placeholder:text-muted focus:outline-none focus:border-[#F3E5AB] text-sm font-mono tracking-wider"
                />
              </div>
            )}

            {picked.needsTarget && (
              <div>
                <p className="text-sm font-semibold text-paper mb-2">
                  With who?
                </p>
                {otherPlayers.length === 0 ? (
                  <p className="text-sm text-muted">No other players available</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {otherPlayers.map((p) => {
                      const selected = draft?.targetId === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => updateDraft({ targetId: p.id })}
                          className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                            selected
                              ? "border-[#F3E5AB] bg-[#F3E5AB]/10 text-paper"
                              : "border-card-border text-muted hover:border-muted hover:text-paper"
                          }`}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {picked.hasTiers && (
              <div>
                <p className="text-sm font-semibold text-paper mb-2">
                  Spend tier
                </p>
                <div className="flex gap-2">
                  {SPEND_TIERS.map((tier) => {
                    const selected = draft?.spend === tier.value;
                    return (
                      <button
                        key={tier.value}
                        onClick={() => updateDraft({ spend: tier.value })}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                          selected
                            ? "border-[#F3E5AB] bg-[#F3E5AB]/10 text-paper"
                            : "border-card-border text-muted hover:border-muted hover:text-paper"
                        }`}
                      >
                        <span className="block">{tier.label}</span>
                        <span className="block text-xs opacity-70">
                          {tier.cost}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-muted hover:text-paper transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`ml-auto px-6 py-2.5 rounded-xl font-semibold transition active:translate-y-0.5 ${
              canConfirm
                ? "bg-[#F3E5AB] text-background hover:bg-[#F3E5AB]/90"
                : "bg-card-border text-muted cursor-not-allowed"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
