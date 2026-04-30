"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // skip I, O for clarity

function generateRoomCode() {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

type Mode = "home" | "create" | "join";

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("home");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Enter a name first");
    if (trimmed.length > 20) return setError("Name too long (max 20)");

    try {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        return setError(data.error || "Failed to create room");
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("cls.name", trimmed);
        localStorage.setItem("cls.role", "host");
        localStorage.setItem("cls.playerId", data.player.id);
        localStorage.setItem("cls.roomCode", data.room.code);
      }
      router.push(`/room/${data.room.code}`);
    } catch {
      setError("Network error. Try again.");
    }
  };

  const onJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const cleanCode = code.trim().toUpperCase();
    if (!trimmedName) return setError("Enter a name first");
    if (trimmedName.length > 20) return setError("Name too long (max 20)");
    if (cleanCode.length !== 4) return setError("Room code must be 4 letters");
    if (!/^[A-Z]+$/.test(cleanCode)) return setError("Letters only");

    try {
      const res = await fetch(`/api/room/${cleanCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });
      const data = await res.json();
      if (!res.ok) {
        return setError(data.error || "Failed to join room");
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("cls.name", trimmedName);
        localStorage.setItem("cls.role", "player");
        localStorage.setItem("cls.playerId", data.player.id);
        localStorage.setItem("cls.roomCode", cleanCode);
      }
      router.push(`/room/${cleanCode}`);
    } catch {
      setError("Network error. Try again.");
    }
  };

  const onDebugBuild = async () => {
    const trimmed = name.trim() || "You";
    setError(null);

    try {
      // 1. Create room with code TEST
      const createRes = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, code: "TEST" }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        return setError(createData.error || "Failed to create room");
      }

      // 2. Add dummy players
      const dummies = [
        { name: "Maya" },
        { name: "Quinn" },
        { name: "Riley" },
        { name: "Greg", eliminated: true, wellbeing: 0 },
      ];
      for (const dummy of dummies) {
        await fetch("/api/room/TEST/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dummy),
        });
      }

      // 3. Save and redirect
      if (typeof window !== "undefined") {
        localStorage.setItem("cls.name", trimmed);
        localStorage.setItem("cls.role", "host");
        localStorage.setItem("cls.playerId", createData.player.id);
        localStorage.setItem("cls.roomCode", "TEST");
      }
      router.push("/room/TEST");
    } catch {
      setError("Network error. Try again.");
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Title */}
        <header className="text-center mb-12">
          <h1 className="title-wobble text-5xl md:text-6xl font-black tracking-tight text-paper">
            College Life
            <span className="block text-accent">Simulator</span>
          </h1>
          <div className="mt-3 flex items-center justify-center gap-3 text-muted">
            <span className="h-px w-12 bg-card-border" />
            <p className="text-sm uppercase tracking-widest">
              A 3-week party game · 3–12 players
            </p>
            <span className="h-px w-12 bg-card-border" />
          </div>
        </header>

        {/* Cards */}
        {mode === "home" && (
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setMode("create");
                setError(null);
              }}
              className="group rounded-2xl border border-card-border bg-card p-8 text-left transition hover:border-accent hover:bg-card/80 active:translate-y-0.5"
            >
              <div className="text-3xl mb-2">＋</div>
              <h2 className="text-xl font-bold mb-1 text-paper">Create Game</h2>
              <p className="text-sm text-muted">Start a new room and invite friends</p>
            </button>
            <button
              onClick={() => {
                setMode("join");
                setError(null);
              }}
              className="group rounded-2xl border border-card-border bg-card p-8 text-left transition hover:border-accent-soft hover:bg-card/80 active:translate-y-0.5"
            >
              <div className="text-3xl mb-2">→</div>
              <h2 className="text-xl font-bold mb-1 text-paper">Join Game</h2>
              <p className="text-sm text-muted">Enter a 4-letter room code</p>
            </button>
          </div>
        )}

        {/* Debug Build */}
        {mode === "home" && (
          <div className="mt-4 text-center">
            <button
              onClick={onDebugBuild}
              className="text-xs text-muted hover:text-paper transition uppercase tracking-widest"
            >
              Debug Build
            </button>
          </div>
        )}

        {/* Create form */}
        {mode === "create" && (
          <form
            onSubmit={onCreate}
            className="rounded-2xl border border-card-border bg-card p-8"
          >
            <h2 className="text-xl font-bold mb-1 text-paper">Create Game</h2>
            <p className="text-sm text-muted mb-6">What should we call you?</p>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={20}
              className="w-full rounded-lg bg-background border border-card-border px-4 py-3 text-paper placeholder:text-muted focus:outline-none focus:border-accent"
            />
            {error && <p className="mt-3 text-sm text-accent">{error}</p>}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode("home");
                  setError(null);
                }}
                className="px-5 py-2.5 rounded-lg text-muted hover:text-paper transition"
              >
                ← Back
              </button>
              <button
                type="submit"
                className="ml-auto px-6 py-2.5 rounded-lg bg-accent text-paper font-semibold hover:bg-accent/90 active:translate-y-0.5 transition"
              >
                Create Room →
              </button>
            </div>
          </form>
        )}

        {/* Join form */}
        {mode === "join" && (
          <form
            onSubmit={onJoin}
            className="rounded-2xl border border-card-border bg-card p-8"
          >
            <h2 className="text-xl font-bold mb-1 text-paper">Join Game</h2>
            <p className="text-sm text-muted mb-6">Enter the 4-letter room code</p>
            <input
              autoFocus
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4))}
              placeholder="A B C D"
              maxLength={4}
              className="code-input w-full rounded-lg bg-background border border-card-border px-4 py-4 text-paper placeholder:text-muted/40 focus:outline-none focus:border-accent-soft"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={20}
              className="mt-4 w-full rounded-lg bg-background border border-card-border px-4 py-3 text-paper placeholder:text-muted focus:outline-none focus:border-accent-soft"
            />
            {error && <p className="mt-3 text-sm text-accent">{error}</p>}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode("home");
                  setError(null);
                }}
                className="px-5 py-2.5 rounded-lg text-muted hover:text-paper transition"
              >
                ← Back
              </button>
              <button
                type="submit"
                className="ml-auto px-6 py-2.5 rounded-lg bg-accent-soft text-ink font-semibold hover:bg-accent-soft/90 active:translate-y-0.5 transition"
              >
                Join Room →
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-xs text-muted">
          <div className="flex items-center justify-center gap-4">
            <span>How to play</span>
            <span>·</span>
            <span>About</span>
            <span>·</span>
            <span>v0.1</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
