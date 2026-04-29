"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CharacterSetup from "./CharacterSetup";
import DayView from "./DayView";
import ResolutionView from "./ResolutionView";
import { Selection } from "./ActionPicker";

type Player = {
  id: string;
  name: string;
  isHost: boolean;
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
  const code = (params.code as string)?.toUpperCase() ?? "";

  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [players, setPlayers] = useState<Player[]>([]);
  const [daySelections, setDaySelections] = useState<Record<string, Selection | null>>({});
  const [myId, setMyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /* ------------------------------------------------------------------ */
  // Hydrate local player from localStorage
  useEffect(() => {
    const name = localStorage.getItem("cls.name") || "Anonymous";
    const role = localStorage.getItem("cls.role") || "host";
    const id = `local-${hashString(name + code)}`;
    setMyId(id);

    setPlayers([
      {
        id,
        name,
        isHost: role === "host",
      },
    ]);
  }, [code]);

  /* ------------------------------------------------------------------ */
  const me = players.find((p) => p.id === myId);
  const isHost = me?.isHost ?? players.length <= 1;
  const canStart = players.length >= 3 && players.length <= 12;

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

  /* ------------------------------------------------------------------ */
  // Emulate a full game with 5 fake players for solo testing
  const emulateGame = () => {
    const demoNames = ["Maya", "Jake", "Sam", "Riley", "Quinn"];
    const usedNames = new Set(players.map((p) => p.name));
    const newPlayers = demoNames
      .filter((n) => !usedNames.has(n))
      .map((n) => ({
        id: `demo-${hashString(n + code)}`,
        name: n,
        isHost: false,
      }));
    setPlayers((prev) => [...prev, ...newPlayers].slice(0, 12));
  };

  /* ------------------------------------------------------------------ */
  if (phase === "setup") {
    return (
      <main className="flex-1 flex items-start justify-center p-6 overflow-auto">
        <CharacterSetup onReady={() => setPhase("day")} />
      </main>
    );
  }

  if (phase === "day") {
    return (
      <div className="flex-1 flex overflow-hidden">
        <DayView
          players={players}
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
          selections={daySelections}
          players={players}
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

          {players.length === 0 ? (
            <p className="text-muted text-sm">Loading…</p>
          ) : (
            <ul className="space-y-2">
              {players.map((player) => {
                const isMe = player.id === myId;
                const color = getAvatarColor(player.name);
                return (
                  <li
                    key={player.id}
                    className="flex items-center gap-3 rounded-xl border border-card-border bg-background/50 px-4 py-3"
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shrink-0 select-none"
                      style={{ backgroundColor: color }}
                    >
                      {getInitials(player.name)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-paper truncate">
                        {player.name}
                        {isMe && (
                          <span className="ml-2 text-xs text-muted font-normal">
                            (You)
                          </span>
                        )}
                      </p>
                    </div>
                    {player.isHost && (
                      <span className="text-xs font-bold uppercase tracking-wider text-accent-soft bg-accent-soft/10 px-2 py-1 rounded-md">
                        Host
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {players.length < 3 && (
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
              onClick={() => setPhase("setup")}
              disabled={!canStart}
              title={
                canStart
                  ? "Start the game"
                  : `Need ${3 - players.length} more player${
                      players.length === 2 ? "" : "s"
                    }`
              }
              className={`ml-auto px-6 py-3 rounded-xl font-semibold transition active:translate-y-0.5 ${
                canStart
                  ? "bg-accent text-paper hover:bg-accent/90 shadow-lg shadow-accent/20"
                  : "bg-card-border text-muted cursor-not-allowed"
              }`}
            >
              Start Game →
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
