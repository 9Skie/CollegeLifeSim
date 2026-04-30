"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CharacterSetup, { CharacterSetupResult } from "./CharacterSetup";
import DayView from "./DayView";
import ResolutionView from "./ResolutionView";
import { Selection } from "./ActionPicker";
import { DUMMY_PLAYERS } from "./dummyPlayers";

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

type GamePhase = "lobby" | "setup" | "day" | "resolution" | "exam" | "end";

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getAvatarColor(name: string): string {
  const colors = [
    "#d94f4f",
    "#f0a868",
    "#5b8c5a",
    "#4f8cd9",
    "#d94fb8",
    "#a17b1a",
    "#8a8579",
    "#4fd9c9",
    "#d96f4f",
  ];
  return colors[hashString(name) % colors.length];
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = ((params?.code as string | undefined) ?? "").toUpperCase();

  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [players, setPlayers] = useState<Player[]>([]);
  const [daySelections, setDaySelections] = useState<Record<string, Selection | null>>({});
  const [myId, setMyId] = useState<string | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState<string>("lobby");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupReady, setSetupReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------------------------------------------ */
  // Hydrate my player ID from localStorage + fetch room state
  useEffect(() => {
    const storedId = localStorage.getItem("cls.playerId");
    if (storedId) setMyId(storedId);

    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/room/${code}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Room not found");
          setLoading(false);
          return;
        }
        setPlayers(data.players || []);
        setHostId(data.room.host_id);
        setRoomStatus(data.room.status);
        if (data.room.current_phase) {
          setPhase((prev) =>
            prev === "lobby" || (prev === "setup" && data.room.current_phase === "day")
              ? (data.room.current_phase as GamePhase)
              : prev
          );
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
    const interval = setInterval(fetchRoom, 3000);
    return () => clearInterval(interval);
  }, [code]);

  /* ------------------------------------------------------------------ */
  const isHost = myId === hostId;
  const canStart = players.length >= 3 && players.length <= 12;
  const currentPlayer = myId
    ? players.find((player) => player.id === myId) ?? null
    : null;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const leaveRoom = () => {
    // TODO: broadcast leave to server
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
  // Emulate a room with four scripted dummy players for solo testing
  const emulateGame = async () => {
    const usedNames = new Set(players.map((p) => p.name));
    const namesToAdd = DUMMY_PLAYERS.map((player) => player.name).filter(
      (name) => !usedNames.has(name)
    );

    for (const name of namesToAdd) {
      try {
        await fetch(`/api/room/${code}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
      } catch {
        // ignore individual failures
      }
    }
    // Trigger immediate refresh
    const res = await fetch(`/api/room/${code}`);
    const data = await res.json();
    if (res.ok) setPlayers(data.players || []);
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

  if (phase === "day") {
    return (
      <div className="flex-1 flex overflow-hidden">
        <DayView
          roomCode={code}
          players={players}
          currentPlayer={currentPlayer}
          onSubmit={(sel) => {
            setDaySelections(sel);
            setPhase("resolution");
          }}
        />
      </div>
    );
  }

  if (phase === "resolution") {
    return (
      <div className="flex-1 flex overflow-hidden">
        <ResolutionView
          roomCode={code}
          selections={daySelections}
          players={players}
          currentPlayer={currentPlayer}
          onNextDay={() => setPhase("day")}
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
                      onClick={() => setStatsPopupPlayer(player)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shrink-0 select-none transition ${
                        isGoner ? "grayscale opacity-50" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {isGoner ? "🫥" : getInitials(player.name)}
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
                        <p className="text-[10px] text-muted">Goner</p>
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
            <div className="mt-4 flex items-center gap-3">
              <p className="text-sm text-accent">
                Need at least 3 players to start
              </p>
              <button
                onClick={emulateGame}
                className="text-xs px-3 py-1.5 rounded-md border border-card-border text-muted hover:text-paper hover:border-muted transition"
              >
                Emulate Game
              </button>
            </div>
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
    academics: player.academics ?? 1 + ((player.name.charCodeAt(0) * 7) % 50) / 10,
    social: player.social ?? 1 + ((player.name.charCodeAt(1) * 5) % 50) / 10,
    wellbeing: player.wellbeing ?? 3 + ((player.name.charCodeAt(2) * 3) % 50) / 10,
    money: player.money ?? ((player.name.charCodeAt(3) * 2) % 40) / 10,
  };
  const isGoner = player.eliminated;

  const colors = [
    "#d94f4f", "#f0a868", "#5b8c5a", "#4f8cd9",
    "#d94fb8", "#a17b1a", "#8a8579", "#4fd9c9", "#d96f4f",
  ];
  const color = colors[[...player.name].reduce((h, c) => c.charCodeAt(0) + ((h << 5) - h), 0) % colors.length];
  const initials = player.name.slice(0, 2).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xs rounded-2xl border border-card-border bg-card p-6 shadow-2xl"
        style={{ animation: "popIn 0.2s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className={`w-12 h-12 rounded-full border-2 border-background flex items-center justify-center text-sm font-bold text-white shrink-0 ${
              isGoner ? "grayscale opacity-50" : ""
            }`}
            style={{ backgroundColor: color }}
          >
            {isGoner ? "🫥" : initials}
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isGoner ? "text-muted line-through" : "text-paper"}`}>
              {player.name}
            </h3>
            {isGoner && <span className="text-xs text-muted font-medium">Eliminated</span>}
            {player.major && !isGoner && <span className="text-xs text-[#F3E5AB]">{player.major}</span>}
          </div>
        </div>

        <div className="space-y-3">
          {(
            [
              ["Academics", mockStats.academics, "#4f8cd9"] as const,
              ["Social", mockStats.social, "#9d4edd"] as const,
              ["Wellbeing", mockStats.wellbeing, "#5b8c5a"] as const,
              ["Money", mockStats.money, "#f0a868"] as const,
            ] as const
          ).map(([label, val, barColor]) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted">{label}</span>
                <span className="text-paper font-medium">{val.toFixed(2)}</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min((val / 10) * 100, 100)}%`,
                    backgroundColor: isGoner ? "#8a8579" : barColor,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {(player.pos_trait || player.neg_trait) && !isGoner && (
          <div className="mt-4 pt-4 border-t border-card-border space-y-2">
            {player.pos_trait && (
              <div className="flex items-center gap-2">
                <span className="text-green-400 text-xs">●</span>
                <span className="text-xs text-paper">{player.pos_trait}</span>
              </div>
            )}
            {player.neg_trait && (
              <div className="flex items-center gap-2">
                <span className="text-accent text-xs">●</span>
                <span className="text-xs text-paper">{player.neg_trait}</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full py-2 rounded-lg bg-background border border-card-border text-muted hover:text-paper transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
