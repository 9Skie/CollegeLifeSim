/**
 * Campus Highlight Event System
 * ===============================
 *
 * This file defines the "interesting event picker" that scans all player
 * resolutions for a day and extracts up to 8 notable events.
 *
 * Text generation is handled by the message banks in ./messages/ — each
 * event type pulls from a rich pool of flavor text.
 *
 * Guaranteed every day:
 *   - 2× "general" campus flavor events
 *   - 0-6 additional events picked by priority from the room's actions
 */

import type {
  ResolutionHighlight,
  StoredResolution,
} from "@/utils/day-resolution";

import {
  GOOD_ACTION_MESSAGES,
  BAD_ACTION_MESSAGES,
} from "./messages/actions";
import { WILDCARD_TIER_MESSAGES } from "./messages/wildcards";
import {
  ELIMINATION_MESSAGES,
  RELATIONSHIP_FRIEND_MESSAGES,
  RELATIONSHIP_SOULMATE_MESSAGES,
  DITCHING_MESSAGES,
  PRIVATE_EVENT_MESSAGES,
  STAT_CRASH_MESSAGES,
  STAT_SWING_MESSAGES,
} from "./messages/events";
import { GENERAL_MESSAGES } from "./messages/general";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export type InterestingEventType =
  | "good_action"
  | "bad_action"
  | "ditched"
  | "wildcard"
  | "stat_drama"
  | "elimination"
  | "relationship_up"
  | "private_event"
  | "general";

export type InterestingEvent = {
  type: InterestingEventType;
  priority: number;

  /** Player who this event is about */
  playerName: string;
  playerId: string;

  /** Action that triggered this (if applicable) */
  action?: string;

  /** Time slot (morning/afternoon/night) */
  slot?: string;

  /** Outcome tier for action events */
  outcomeTier?: "bad" | "normal" | "good";

  /** For socialize/ditching events */
  targetName?: string;
  targetId?: string;

  /** For wildcard events */
  wildcardTitle?: string;
  wildcardEmoji?: string;
  wildcardTier?: string;

  /** For relationship events */
  relationshipPartnerName?: string;
  relationshipLevel?: number;

  /** For stat drama events */
  statKey?: "academics" | "social" | "wellbeing" | "money";
  statLabel?: string;
  oldValue?: number;
  newValue?: number;
  change?: number;

  /** Context string for text generator (freeform hint) */
  contextHint: string;
};

export type HighlightContext = {
  roomCode: string;
  currentDay: number;
  players: Array<{
    id: string;
    name: string;
    pos_trait?: string | null;
    neg_trait?: string | null;
    major?: string | null;
  }>;
  resolutions: StoredResolution[];
  relationshipUpdates: Array<{
    player_a: string;
    player_b: string;
    progress: number;
    level: number;
  }>;
  publicEvent: {
    effectType: string;
    actionModifiers: Record<string, Record<string, number>>;
  } | null;
  privateEvent: {
    name: string;
    holders: string[];
  } | null;
};

// ------------------------------------------------------------------
// Priority constants — higher = more interesting
// ------------------------------------------------------------------

const PRIORITY = {
  elimination: 100,
  relationship_soulmate: 95,
  relationship_friend: 80,
  ditched: 70,
  wildcard: 65,
  public_event_major: 60,
  private_event: 58,
  bad_action: 55,
  good_action: 50,
  stat_drama_crash: 45,
  stat_drama_swing: 40,
  trait_visible: 35,
  general: 10,
} as const;

// ------------------------------------------------------------------
// Helper: deterministic random selection
// ------------------------------------------------------------------

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pickOne<T>(arr: T[], seed: string): T {
  return arr[hashString(seed) % arr.length];
}

function formatMessage(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

// ------------------------------------------------------------------
// Wildcard tier normalization
// ------------------------------------------------------------------

function normalizeWildcardTier(tier?: string): string {
  if (!tier) return "neutral";
  const t = tier.toLowerCase();
  if (t.includes("catastroph") || t.includes("disaster") || t.includes("worst")) return "catastrophic";
  if (t.includes("bad") || t.includes("poor") || t.includes("terrible")) return "bad";
  if (t.includes("amazing") || t.includes("great") || t.includes("best") || t.includes("excellent")) return "amazing";
  if (t.includes("good") || t.includes("positive")) return "good";
  return "neutral";
}

// ------------------------------------------------------------------
// Extractor: scan resolutions and build InterestingEvent[]
// ------------------------------------------------------------------

export function extractInterestingEvents(ctx: HighlightContext): InterestingEvent[] {
  const events: InterestingEvent[] = [];
  const playerById = new Map(ctx.players.map((p) => [p.id, p]));
  const nameOf = (id: string) => playerById.get(id)?.name ?? "Someone";

  // --- 1. Eliminations ---
  for (const res of ctx.resolutions) {
    if (res.new_stats.wellbeing <= 0 && res.old_stats.wellbeing > 0) {
      events.push({
        type: "elimination",
        priority: PRIORITY.elimination,
        playerName: nameOf(res.player_id),
        playerId: res.player_id,
        oldValue: res.old_stats.wellbeing,
        newValue: res.new_stats.wellbeing,
        contextHint: "Player's wellbeing hit zero and they were eliminated",
      });
    }
  }

  // --- 2. Relationship milestones ---
  for (const rel of ctx.relationshipUpdates) {
    if (rel.level >= 2) {
      events.push({
        type: "relationship_up",
        priority: rel.level >= 3 ? PRIORITY.relationship_soulmate : PRIORITY.relationship_friend,
        playerName: nameOf(rel.player_a),
        playerId: rel.player_a,
        relationshipPartnerName: nameOf(rel.player_b),
        relationshipLevel: rel.level,
        contextHint: rel.level >= 3
          ? `Two players reached Soul Mate (level 3)`
          : `Two players reached Friend (level 2)`,
      });
    }
  }

  // --- 3. Private events ---
  if (ctx.privateEvent) {
    for (const holderId of ctx.privateEvent.holders) {
      events.push({
        type: "private_event",
        priority: PRIORITY.private_event,
        playerName: nameOf(holderId),
        playerId: holderId,
        contextHint: `${nameOf(holderId)} received private event: ${ctx.privateEvent.name}`,
      });
    }
  }

  // --- 4. Action outcomes (good/bad/ditched/wildcard) + stat drama ---
  for (const res of ctx.resolutions) {
    const playerName = nameOf(res.player_id);

    for (const slot of res.changes.slotResults) {
      if (!slot.actionId) continue;

      // Ditched
      if (slot.ditched && slot.targetName) {
        events.push({
          type: "ditched",
          priority: PRIORITY.ditched,
          playerName,
          playerId: res.player_id,
          action: slot.actionId,
          slot: slot.slot,
          targetName: slot.targetName,
          targetId: slot.targetId ?? undefined,
          contextHint: `Player tried to socialize with ${slot.targetName} but got ditched`,
        });
        continue;
      }

      // Wildcard
      if (slot.actionId === "wildcard" && slot.wildcardCard) {
        events.push({
          type: "wildcard",
          priority: PRIORITY.wildcard,
          playerName,
          playerId: res.player_id,
          action: "wildcard",
          slot: slot.slot,
          wildcardTitle: slot.wildcardCard.title,
          wildcardEmoji: slot.wildcardCard.emoji,
          wildcardTier: slot.wildcardCard.tier,
          contextHint: `Player drew wildcard card: ${slot.wildcardCard.title}`,
        });
        continue;
      }

      // Good outcome
      if (slot.outcomeTier === "good") {
        events.push({
          type: "good_action",
          priority: PRIORITY.good_action,
          playerName,
          playerId: res.player_id,
          action: slot.actionId,
          slot: slot.slot,
          outcomeTier: "good",
          contextHint: `Player had a good outcome while doing ${slot.actionId}`,
        });
      }

      // Bad outcome
      if (slot.outcomeTier === "bad") {
        events.push({
          type: "bad_action",
          priority: PRIORITY.bad_action,
          playerName,
          playerId: res.player_id,
          action: slot.actionId,
          slot: slot.slot,
          outcomeTier: "bad",
          contextHint: `Player had a bad outcome while doing ${slot.actionId}`,
        });
      }
    }

    // --- Stat drama: net change across the whole day ---
    const net = res.changes.netChange;
    const stats: Array<{
      key: "academics" | "social" | "wellbeing" | "money";
      label: string;
    }> = [
      { key: "academics", label: "Academics" },
      { key: "social", label: "Social" },
      { key: "wellbeing", label: "Wellbeing" },
      { key: "money", label: "Money" },
    ];

    for (const s of stats) {
      const change = net[s.key];
      const oldVal = res.old_stats[s.key];
      const newVal = res.new_stats[s.key];

      // Crash: dropped below critical threshold
      if (oldVal > 1 && newVal <= 1 && s.key !== "money") {
        events.push({
          type: "stat_drama",
          priority: PRIORITY.stat_drama_crash,
          playerName,
          playerId: res.player_id,
          statKey: s.key,
          statLabel: s.label,
          oldValue: oldVal,
          newValue: newVal,
          change,
          contextHint: `Player's ${s.label} crashed to critical level`,
        });
      }
      if (oldVal > 0 && newVal <= 0 && s.key === "money") {
        events.push({
          type: "stat_drama",
          priority: PRIORITY.stat_drama_crash,
          playerName,
          playerId: res.player_id,
          statKey: s.key,
          statLabel: s.label,
          oldValue: oldVal,
          newValue: newVal,
          change,
          contextHint: `Player's Money crashed to zero`,
        });
      }

      // Big swing: ±2.0 or more in a single day
      if (Math.abs(change) >= 2.0) {
        events.push({
          type: "stat_drama",
          priority: PRIORITY.stat_drama_swing,
          playerName,
          playerId: res.player_id,
          statKey: s.key,
          statLabel: s.label,
          oldValue: oldVal,
          newValue: newVal,
          change,
          contextHint: `Player had a massive ${change > 0 ? "gain" : "loss"} in ${s.label}`,
        });
      }
    }
  }

  // --- 4. General campus (add up to 8 so we always fill the slots) ---
  for (let i = 0; i < 8; i++) {
    events.push({
      type: "general",
      priority: PRIORITY.general,
      playerName: "",
      playerId: "",
      contextHint: "Generic campus flavor event",
    });
  }

  // --- 5. Sort by priority, dedupe by (player + type + action/slot), pick top 10 ---
  const seen = new Set<string>();
  const deduped: InterestingEvent[] = [];

  for (const ev of events.sort((a, b) => b.priority - a.priority)) {
    const key = ev.type === "general"
      ? `general:${deduped.filter((e) => e.type === "general").length}`
      : `${ev.playerId}:${ev.type}:${ev.action ?? ""}:${ev.slot ?? ""}:${ev.statKey ?? ""}`;

    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(ev);
    if (deduped.length >= 8) break;
  }

  return deduped;
}

// ------------------------------------------------------------------
// Text generator: converts InterestingEvent[] → ResolutionHighlight[]
// ------------------------------------------------------------------

export function eventsToHighlights(
  events: InterestingEvent[],
  seed: string
): ResolutionHighlight[] {
  const highlights: ResolutionHighlight[] = [];
  let generalIndex = 0;

  for (const ev of events) {
    // General campus events — always vanilla/neutral
    if (ev.type === "general") {
      const msg = GENERAL_MESSAGES[hashString(seed + ":general:" + generalIndex) % GENERAL_MESSAGES.length];
      generalIndex++;
      highlights.push({ text: msg.text, icon: msg.icon, color: "#F3E5AB" });
      continue;
    }

    let text = "";
    let icon = "🍃";
    let color = "#F3E5AB";

    switch (ev.type) {
      case "elimination": {
        const pool = ELIMINATION_MESSAGES;
        text = formatMessage(pickOne(pool, `${seed}:elim:${ev.playerId}`), { name: ev.playerName });
        icon = "😵"; color = "#d94f4f";
        break;
      }

      case "relationship_up": {
        const pool = ev.relationshipLevel && ev.relationshipLevel >= 3
          ? RELATIONSHIP_SOULMATE_MESSAGES
          : RELATIONSHIP_FRIEND_MESSAGES;
        text = formatMessage(pickOne(pool, `${seed}:rel:${ev.playerId}`), {
          a: ev.playerName,
          b: ev.relationshipPartnerName ?? "someone",
        });
        icon = ev.relationshipLevel && ev.relationshipLevel >= 3 ? "💫" : "💛";
        color = "#5b8c5a"; // positive event = green
        break;
      }

      case "ditched": {
        const pool = DITCHING_MESSAGES;
        text = formatMessage(pickOne(pool, `${seed}:ditch:${ev.playerId}`), {
          name: ev.playerName,
          target: ev.targetName ?? "someone",
        });
        icon = "💔"; color = "#d94f4f";
        break;
      }

      case "wildcard": {
        const tier = normalizeWildcardTier(ev.wildcardTier);
        const pool = WILDCARD_TIER_MESSAGES[tier] ?? WILDCARD_TIER_MESSAGES.neutral;
        text = formatMessage(pickOne(pool, `${seed}:wc:${ev.playerId}:${ev.wildcardTitle ?? ""}`), {
          name: ev.playerName,
          card: ev.wildcardTitle ?? "a wildcard",
        });
        icon = ev.wildcardEmoji || "🃏";
        // Good = green, Bad = red, Neutral = vanilla
        color = tier === "catastrophic" || tier === "bad"
          ? "#d94f4f"
          : tier === "good" || tier === "amazing"
          ? "#5b8c5a"
          : "#F3E5AB";
        break;
      }

      case "good_action": {
        const action = ev.action ?? "study";
        const pool = GOOD_ACTION_MESSAGES[action] ?? GOOD_ACTION_MESSAGES.study;
        text = formatMessage(pickOne(pool, `${seed}:good:${ev.playerId}:${action}`), {
          name: ev.playerName,
          target: ev.targetName ?? "someone",
        });
        icon = "✨"; color = "#5b8c5a";
        break;
      }

      case "bad_action": {
        const action = ev.action ?? "study";
        const pool = BAD_ACTION_MESSAGES[action] ?? BAD_ACTION_MESSAGES.study;
        text = formatMessage(pickOne(pool, `${seed}:bad:${ev.playerId}:${action}`), {
          name: ev.playerName,
          target: ev.targetName ?? "someone",
        });
        icon = "🥀"; color = "#d94f4f";
        break;
      }

      case "private_event": {
        text = formatMessage(pickOne(PRIVATE_EVENT_MESSAGES, `${seed}:priv:${ev.playerId}`), {
          name: ev.playerName,
        });
        icon = "🎟"; color = "#5b8c5a";
        break;
      }

      case "stat_drama": {
        const isCrash = Math.abs(ev.change || 0) < 2.0;
        const pool = isCrash ? STAT_CRASH_MESSAGES : STAT_SWING_MESSAGES;
        text = formatMessage(pickOne(pool, `${seed}:stat:${ev.playerId}:${ev.statKey ?? ""}`), {
          name: ev.playerName,
          stat: ev.statLabel ?? "Stats",
        });
        icon = "📉"; color = "#d94f4f";
        break;
      }
    }

    if (text) {
      highlights.push({ text, icon, color });
    }
  }

  return highlights;
}
