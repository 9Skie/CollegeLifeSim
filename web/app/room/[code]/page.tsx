"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CharacterSetup, { CharacterSetupResult } from "./CharacterSetup";
import DayView from "./DayView";
import ResolutionView from "./ResolutionView";
import ExamView from "./ExamView";
import WeekResolutionView from "./WeekResolutionView";
import SpectatorView from "./SpectatorView";
import EliminationScreen from "./EliminationScreen";
import { getAvatarColor, getInitials } from "@/utils/player-avatar";

import {
  createEmptySelectionRecord,
  type SelectionRecord,
} from "@/utils/day-actions";
import type { StoredResolution } from "@/utils/day-resolution";
import type { ExamResult } from "@/utils/exam-resolution";
import type { RoomDayState } from "@/utils/room-day-state";

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
  class_schedule?: Array<{ day: number; slot: "morning" | "afternoon" }>;
  eliminated?: boolean;
  created_at?: string;
};

type GamePhase = "lobby" | "setup" | "day" | "resolution" | "week_resolution" | "exam" | "end";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = ((params?.code as string | undefined) ?? "").toUpperCase();

  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [players, setPlayers] = useState<Player[]>([]);
  const [daySelections, setDaySelections] = useState<SelectionRecord>(
    createEmptySelectionRecord()
  );
  const [dayState, setDayState] = useState<RoomDayState | null>(null);
  const [currentResolution, setCurrentResolution] = useState<StoredResolution | null>(null);
  const [allResolutions, setAllResolutions] = useState<StoredResolution[] | null>(null);
  const [currentExamResults, setCurrentExamResults] = useState<ExamResult[] | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [roomStatus, setRoomStatus] = useState<string>("lobby");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupReady, setSetupReady] = useState(false);
  const [statsPopupPlayer, setStatsPopupPlayer] = useState<Player | null>(null);
  const isSpectatorRef = useRef(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEliminationScreen, setShowEliminationScreen] = useState(false);

  // Derived player state (must be before the polling effect)
  const currentPlayer = myId
    ? players.find((player) => player.id === myId) ?? null
    : null;
  const isSpectator = currentPlayer?.eliminated === true;
  isSpectatorRef.current = isSpectator;

  /* ------------------------------------------------------------------ */
  // Hydrate my player ID from localStorage + fetch room state
  useEffect(() => {
    const storedId = localStorage.getItem("cls.playerId");
    if (storedId) setMyId(storedId);

    const fetchRoom = async () => {
      try {
        const activePlayerId = localStorage.getItem("cls.playerId") || storedId;
        const query = activePlayerId
          ? `?playerId=${encodeURIComponent(activePlayerId)}`
          : "";
        const res = await fetch(`/api/room/${code}${query}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Room not found");
          setLoading(false);
          return;
        }
        setPlayers(data.players || []);
        setHostId(data.room.host_id);
        const incomingDay = data.room.current_day || 1;
        if (incomingDay !== currentDay) {
          setDaySelections(data.dayState?.mySelections || createEmptySelectionRecord());
        }
        setCurrentDay(incomingDay);
        setRoomStatus(data.room.status);
        setDayState(data.dayState || null);
        setCurrentResolution(data.currentResolution || null);
        setAllResolutions(data.allResolutions || null);
        setCurrentExamResults(data.currentExamResults || null);
        if (data.room.current_phase) {
          setPhase((prev) =>
            prev === "lobby" ||
            (prev === "setup" && ["day", "resolution", "exam"].includes(data.room.current_phase)) ||
            (prev === "day" && data.room.current_phase === "resolution") ||
            (prev === "resolution" && ["day", "week_resolution", "exam"].includes(data.room.current_phase)) ||
            (prev === "week_resolution" && ["day", "exam"].includes(data.room.current_phase)) ||
            (prev === "exam" && ["day", "end"].includes(data.room.current_phase))
              ? (data.room.current_phase as GamePhase)
              : prev
          );
        }
        if (
          data.dayState?.myStatus &&
          ["done", "goner"].includes(data.dayState.myStatus)
        ) {
          setDaySelections(data.dayState.mySelections);
        }
        if (data.room.current_phase === "day") {
          setSetupReady(false);
          setSetupSubmitting(false);
        }
        setLoading(false);
      } catch {
        setError("Failed to load room");
        setLoading(false);
      }
    };

    fetchRoom();

    // Spectators don't poll during day phase — they only see updates when
    // the day resolves (or when currentDay changes). Everyone else polls
    // every 3s. Spectators in resolution/exam also poll every 3s.
    const shouldPoll = !isSpectator || phase !== "day";
    const interval = shouldPoll ? setInterval(fetchRoom, 1000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [code, currentDay, phase, isSpectator]);

  // Clear storage when game ends
  useEffect(() => {
    if (phase === "end") {
      clearGameStorage();
    }
  }, [phase]);

  // Detect first-time elimination and show the elimination screen
  useEffect(() => {
    if (!myId || !currentPlayer) return;
    if (currentPlayer.eliminated) {
      const key = `cls.eliminationSeen_${code}_${myId}`;
      const alreadySeen = localStorage.getItem(key);
      if (!alreadySeen) {
        setShowEliminationScreen(true);
      }
    }
  }, [currentPlayer?.eliminated, myId, code]);

  // Clear elimination screen flag when a new game starts
  useEffect(() => {
    if ((phase === "lobby" || phase === "setup") && myId) {
      localStorage.removeItem(`cls.eliminationSeen_${code}_${myId}`);
      setShowEliminationScreen(false);
    }
  }, [phase, myId, code]);

  const dismissEliminationScreen = () => {
    if (myId) {
      localStorage.setItem(`cls.eliminationSeen_${code}_${myId}`, "1");
    }
    setShowEliminationScreen(false);
  };

  /* ------------------------------------------------------------------ */
  const isHost = myId === hostId;
  const canStart = players.length >= 3 && players.length <= 12;

  const myName = currentPlayer?.name ||
    (typeof window !== "undefined" ? localStorage.getItem("cls.name") || "You" : "You");

  const submitDaySelections = async (
    selections: SelectionRecord
  ) => {
    if (!myId) {
      throw new Error("Missing player identity");
    }

    const res = await fetch(`/api/room/${code}/day-actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: myId, selections }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to submit day actions");
    }

    setDaySelections(selections);
    setDayState(data.dayState || null);
    setCurrentResolution(data.currentResolution || null);
    setCurrentExamResults(null);
    if (data.room) {
      setCurrentDay(data.room.current_day || currentDay);
      setRoomStatus(data.room.status);
      if (data.room.current_phase === "resolution") {
        setPhase("resolution");
      }
    }
  };

  const startNextDay = async () => {
    if (!myId) {
      throw new Error("Missing player identity");
    }

    const isEndOfWeek = currentDay === 7 || currentDay === 14;
    if (isEndOfWeek) {
      const res = await fetch(`/api/room/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: myId,
          currentPhase: "week_resolution",
          status: "week_resolution",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to advance to week summary");
      }
      setRoomStatus(data.room.status);
      setPhase(data.room.current_phase || "week_resolution");
      return;
    }

    const nextDay = currentDay + 1;
    const isExamDay = nextDay === 12 || nextDay === 19;
    const nextPhase = isExamDay ? "exam" : "day";

    const res = await fetch(`/api/room/${code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: myId,
        currentPhase: nextPhase,
        status: nextPhase,
        currentDay: nextDay,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to start next day");
    }

    setCurrentDay(data.room.current_day || nextDay);
    setRoomStatus(data.room.status);
    setDaySelections(createEmptySelectionRecord());
    setDayState(null);
    setCurrentResolution(null);
    setCurrentExamResults(null);
    setPhase(data.room.current_phase || nextPhase);
  };

  const continueFromWeekResolution = async () => {
    if (!myId) {
      throw new Error("Missing player identity");
    }

    const nextDay = currentDay + 1;
    const isExamDay = nextDay === 12 || nextDay === 19;
    const nextPhase = isExamDay ? "exam" : "day";

    const res = await fetch(`/api/room/${code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: myId,
        currentPhase: nextPhase,
        status: nextPhase,
        currentDay: nextDay,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to start next day");
    }

    setCurrentDay(data.room.current_day || nextDay);
    setRoomStatus(data.room.status);
    setDaySelections(createEmptySelectionRecord());
    setDayState(null);
    setCurrentResolution(null);
    setCurrentExamResults(null);
    setPhase(data.room.current_phase || nextPhase);
  };

  const resolveExam = async () => {
    if (!myId) {
      throw new Error("Missing player identity");
    }

    const res = await fetch(`/api/room/${code}/exam`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: myId }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to resolve exam");
    }

    setCurrentDay(data.room.current_day || currentDay);
    setRoomStatus(data.room.status);
    setPlayers(data.players || []);
    setCurrentExamResults(null);
    setPhase(data.room.current_phase || "day");
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const eliminationSeenKey = myId ? `cls.eliminationSeen_${code}_${myId}` : null;

  const clearGameStorage = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("cls.playerId");
      localStorage.removeItem("cls.name");
      localStorage.removeItem("cls.role");
      localStorage.removeItem("cls.roomCode");
      if (eliminationSeenKey) {
        localStorage.removeItem(eliminationSeenKey);
      }
    }
  };

  const leaveRoom = () => {
    clearGameStorage();
    router.push("/");
  };

  const startGame = async () => {
    if (!myId || !canStart || starting) return;

    setStarting(true);
    setError(null);

    try {
      const res = await fetch(`/api/room/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: myId,
          currentPhase: "setup",
          status: "setup",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start game");
        setStarting(false);
        return;
      }

	      setRoomStatus(data.room.status);
	      if (data.players) {
	        setPlayers(data.players);
	      }
	      setPhase("setup");
    } catch {
      setError("Failed to start game");
    } finally {
      setStarting(false);
    }
  };

  const finishSetup = async (setup: CharacterSetupResult) => {
    setError(null);

    if (!myId || setupSubmitting) return;

    setSetupSubmitting(true);

    try {
      const setupRes = await fetch(`/api/room/${code}/player/${myId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setup),
      });

      const setupData = await setupRes.json();
      if (!setupRes.ok) {
        setError(setupData.error || "Failed to save setup");
        setSetupSubmitting(false);
        return;
      }

      setPlayers((prev) =>
        prev.map((player) =>
          player.id === setupData.player.id ? setupData.player : player
        )
      );

      if (!isHost) {
        setSetupReady(true);
        return;
      }

      const res = await fetch(`/api/room/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: myId,
          currentPhase: "day",
          status: "day",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start day");
        setSetupSubmitting(false);
        return;
      }

      setRoomStatus(data.room.status);
      setPhase("day");
      setSetupReady(false);
    } catch {
      setError("Failed to save setup");
    } finally {
      setSetupSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------ */
  if (phase === "setup") {
    const initialSetup = currentPlayer
      ? {
          major: currentPlayer.major ?? null,
          posTrait: currentPlayer.pos_trait ?? null,
          negTrait: currentPlayer.neg_trait ?? null,
          stats:
            typeof currentPlayer.academics === "number" &&
            typeof currentPlayer.social === "number" &&
            typeof currentPlayer.wellbeing === "number" &&
            typeof currentPlayer.money === "number"
              ? {
                  academics: currentPlayer.academics,
                  social: currentPlayer.social,
                  wellbeing: currentPlayer.wellbeing,
                  money: currentPlayer.money,
                }
              : null,
        }
      : null;

    return (
      <main className="flex-1 flex items-start justify-center p-6 overflow-auto">
        <div className="w-full">
          {error && (
            <div className="mx-auto mb-4 max-w-4xl rounded-xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent">
              {error}
            </div>
          )}
          <CharacterSetup
            key={`${initialSetup?.major ?? "pending"}:${initialSetup?.posTrait ?? "pending"}:${initialSetup?.negTrait ?? "pending"}`}
            onReady={finishSetup}
            initialSetup={initialSetup}
            readyDisabled={setupReady || setupSubmitting}
            readyLabel={
              isHost
                ? setupSubmitting
                  ? "Starting Day..."
                  : "Start Day →"
                : setupReady
                ? "Waiting for Host..."
                : "I'm Ready →"
            }
            statusMessage={
              isHost
                ? "When you're ready, starting the day advances everyone in the room."
                : setupReady
                ? "Your character is locked in. Waiting for the host to start the day."
                : null
            }
          />
        </div>
      </main>
    );
  }

  if (showEliminationScreen && currentPlayer) {
    return <EliminationScreen onContinue={dismissEliminationScreen} />;
  }

  if (isSpectator && phase !== "lobby") {
    return (
      <div className="flex-1 flex overflow-hidden">
        <SpectatorView
          roomCode={code}
          currentDay={currentDay}
          phase={phase}
          players={players}
          currentPlayer={currentPlayer}
          allResolutions={allResolutions}
          currentExamResults={currentExamResults}
        />
      </div>
    );
  }

  if (phase === "day") {
    return (
      <div className="flex-1 flex overflow-hidden">
        <DayView
          roomCode={code}
          currentDay={currentDay}
          players={players}
          currentPlayer={currentPlayer}
          dayState={dayState}
          initialSelections={daySelections}
          onSubmit={submitDaySelections}
        />
      </div>
    );
  }

  if (phase === "resolution") {
    return (
      <div className="flex-1 flex overflow-hidden">
        <ResolutionView
          roomCode={code}
          currentDay={currentDay}
          selections={daySelections}
          players={players}
          currentPlayer={currentPlayer}
          currentResolution={currentResolution}
          isHost={isHost}
          onNextDay={startNextDay}
        />
      </div>
    );
  }

  if (phase === "week_resolution") {
    return (
      <div className="flex-1 flex overflow-hidden">
        <WeekResolutionView
          roomCode={code}
          currentDay={currentDay}
          playerId={myId ?? ""}
          myName={myName}
          players={players}
          isHost={isHost}
          onContinue={continueFromWeekResolution}
        />
      </div>
    );
  }

  if (phase === "exam") {
    return (
      <div className="flex-1 flex overflow-hidden">
        <ExamView
          currentDay={currentDay}
          results={currentExamResults}
          isHost={isHost}
          onContinue={resolveExam}
          myName={myName}
        />
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  // Lobby
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Room code */}
        <div className="text-center mb-10">
          <p className="text-muted text-sm uppercase tracking-widest mb-3">
            Room Code
          </p>
          <button
            onClick={copyCode}
            className="group inline-flex items-center gap-3 rounded-2xl border border-card-border bg-card px-8 py-5 transition hover:border-accent active:translate-y-0.5"
            title="Click to copy"
          >
            <span className="text-5xl font-black tracking-[0.5rem] text-paper font-mono">
              {code}
            </span>
            <span className="text-muted text-sm group-hover:text-accent transition min-w-[3.5rem]">
              {copied ? "Copied!" : "Copy"}
            </span>
          </button>
          <p className="mt-3 text-muted text-sm">
            Share this code so friends can join
          </p>
        </div>

        {/* Player roster */}
        <div className="rounded-2xl border border-card-border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-paper">Players</h2>
            <span
              className={`text-sm font-semibold ${
                players.length < 3 ? "text-accent" : "text-muted"
              }`}
            >
              {players.length} / 12
            </span>
          </div>

          {loading ? (
            <p className="text-muted text-sm">Loading…</p>
          ) : error ? (
            <p className="text-accent text-sm">{error}</p>
          ) : (
            <ul className="space-y-2">
              {players.map((player) => {
                const isMe = player.id === myId;
                const color = getAvatarColor(player.name);
                const isGoner = player.eliminated;
                return (
                  <li
                    key={player.id}
                    className="flex items-center gap-3 rounded-xl border border-card-border bg-background/50 px-4 py-3"
                  >
                    <button
                      onClick={() => { if (!isMe) setStatsPopupPlayer(player); }}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shrink-0 select-none transition ${
                        isGoner ? "grayscale opacity-50" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {getInitials(player.name)}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate ${isGoner ? "text-muted line-through" : "text-paper"}`}>
                        {player.name}
                        {isMe && (
                          <span className="ml-2 text-xs text-muted font-normal">
                            (You)
                          </span>
                        )}
                      </p>
                      {isGoner && (
                        <p className="text-[10px] text-muted">Spectator</p>
                      )}
                    </div>
                    {player.id === hostId && !isGoner && (
                      <span className="text-xs font-bold uppercase tracking-wider text-accent-soft bg-accent-soft/10 px-2 py-1 rounded-md">
                        Host
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {players.length < 3 && roomStatus === "lobby" && (
            <p className="mt-4 text-sm text-accent">
              Need at least 3 players to start
            </p>
          )}
        </div>

        {/* Player Stats Popup */}
        {statsPopupPlayer && (
          <PlayerStatsPopup
            player={statsPopupPlayer}
            onClose={() => setStatsPopupPlayer(null)}
          />
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={leaveRoom}
            className="px-5 py-3 rounded-xl text-muted hover:text-paper transition border border-card-border hover:border-muted"
          >
            ← Leave
          </button>

          {isHost ? (
            <button
              onClick={startGame}
              disabled={!canStart || starting}
              title={
                canStart
                  ? "Start the game"
                  : `Need ${3 - players.length} more player${
                      players.length === 2 ? "" : "s"
                    }`
              }
              className={`ml-auto px-6 py-3 rounded-xl font-semibold transition active:translate-y-0.5 ${
                canStart && !starting
                  ? "bg-accent text-paper hover:bg-accent/90 shadow-lg shadow-accent/20"
                  : "bg-card-border text-muted cursor-not-allowed"
              }`}
            >
              {starting ? "Starting..." : "Start Game →"}
            </button>
          ) : (
            <p className="ml-auto text-sm text-muted">
              Waiting for host to start…
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
/* ------------------------------------------------------------------ */
// Player Stats Popup (shared)

function PlayerStatsPopup({
  player,
  onClose,
}: {
  player: {
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
  onClose: () => void;
}) {
  const mockStats = {
    academics: player.academics ?? 2 + ((player.name.charCodeAt(0) * 7) % 50) / 10,
    social: player.social ?? 2 + ((player.name.charCodeAt(1) * 5) % 50) / 10,
    wellbeing: player.wellbeing ?? 3 + ((player.name.charCodeAt(2) * 3) % 50) / 10,
    money: player.money ?? ((player.name.charCodeAt(3) * 2) % 40) / 10,
  };
  const isGoner = player.eliminated;

  const color = getAvatarColor(player.name);
  const avatarContent = getInitials(player.name);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 rounded-xl border border-card-border bg-card p-4 shadow-xl"
        style={{ top: "14rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-l border-t border-card-border rotate-45" />

        <div className="flex items-center gap-2 mb-3">
          <div
            className={`w-8 h-8 rounded-full border border-background flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
              isGoner ? "grayscale opacity-50" : ""
            }`}
            style={{ backgroundColor: color }}
          >
            {avatarContent}
          </div>
          <div>
            <p className={`text-sm font-bold leading-tight ${isGoner ? "text-muted line-through" : "text-paper"}`}>
              {player.name}
            </p>
            {isGoner && <p className="text-[10px] text-muted">Eliminated</p>}
            {player.major && !isGoner && <p className="text-[10px] text-[#F3E5AB]">{player.major}</p>}
          </div>
        </div>

        <div className="space-y-2">
          {(
            [
              ["Academics", mockStats.academics] as const,
              ["Social", mockStats.social] as const,
              ["Money", mockStats.money] as const,
              ["Wellbeing", mockStats.wellbeing] as const,
            ] as const
          ).map(([label, val]) => (
            <div key={label}>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-muted">{label}</span>
                <span className="text-paper font-medium">{val.toFixed(2)}</span>
              </div>
              <div className="h-1.5 bg-background rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isGoner ? "bg-muted" : "bg-accent"}`}
                  style={{ width: `${Math.max(0, Math.min((val / 10) * 100, 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {(player.pos_trait || player.neg_trait) && !isGoner && (
          <div className="mt-2 pt-2 border-t border-card-border space-y-1">
            {player.pos_trait && <p className="text-[10px] text-green-400">● {player.pos_trait}</p>}
            {player.neg_trait && <p className="text-[10px] text-accent">● {player.neg_trait}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
