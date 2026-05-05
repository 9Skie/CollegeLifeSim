"use client";

import { getAvatarColor, getInitials } from "@/utils/player-avatar";

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
  eliminated?: boolean;
};

export default function EndScreen({
  players,
  currentPlayer,
  onReturnHome,
}: {
  players: Player[];
  currentPlayer: Player | null;
  onReturnHome: () => void;
}) {
  const score = (p: Player) =>
    (p.academics ?? 0) + (p.social ?? 0) + (p.wellbeing ?? 0) + (p.money ?? 0);

  const ranked = [...players].sort((a, b) => score(b) - score(a));
  const survived = ranked.filter((p) => !p.eliminated);
  const eliminated = ranked.filter((p) => p.eliminated);

  return (
    <main className="flex-1 flex items-start justify-center p-6 overflow-auto">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <p className="text-4xl font-black text-paper mb-2">Game Over</p>
          <p className="text-muted text-sm">
            Final Standings
          </p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-6 mb-6">
          {ranked.map((player, index) => {
            const color = getAvatarColor(player.name);
            const isMe = player.id === currentPlayer?.id;
            const total = score(player);
            const isGoner = player.eliminated;

            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 mb-2 last:mb-0 ${
                  isMe
                    ? "border-accent bg-accent/5"
                    : "border-card-border bg-background/50"
                } ${isGoner ? "opacity-60" : ""}`}
              >
                <span className={`w-6 text-sm font-bold shrink-0 text-center ${
                  index === 0 ? "text-amber-400" : index === 1 ? "text-gray-300" : index === 2 ? "text-amber-700" : "text-muted"
                }`}>
                  {index + 1}
                </span>

                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shrink-0 select-none ${
                    isGoner ? "grayscale" : ""
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {getInitials(player.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate ${
                    isGoner ? "text-muted line-through" : "text-paper"
                  }`}>
                    {player.name}
                    {isMe && (
                      <span className="ml-1.5 text-xs text-muted font-normal">
                        (You)
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-muted truncate">
                    {player.major ?? "Undecided"}
                    {player.pos_trait && player.neg_trait
                      ? ` · ${player.pos_trait} / ${player.neg_trait}`
                      : ""}
                    {isGoner && " · Eliminated"}
                  </p>
                </div>

                <div className="flex gap-2 text-right shrink-0">
                  <StatBadge label="Acd" value={player.academics} />
                  <StatBadge label="Soc" value={player.social} />
                  <StatBadge label="Wb" value={player.wellbeing} />
                  <StatBadge label="$" value={player.money} />
                </div>

                <span className="w-12 text-right text-xs font-bold text-muted">
                  {Math.round(total * 100) / 100}
                </span>
              </div>
            );
          })}
        </div>

        <div className="text-center text-muted text-xs mb-6">
          {survived.length} survived · {eliminated.length} eliminated
        </div>

        <div className="text-center">
          <button
            onClick={onReturnHome}
            className="px-6 py-2.5 rounded-xl text-sm font-medium bg-card border border-card-border text-paper hover:bg-card-border transition active:translate-y-0.5"
          >
            Return Home
          </button>
        </div>
      </div>
    </main>
  );
}

function StatBadge({ label, value }: { label: string; value?: number }) {
  const v = typeof value === "number" ? Math.round(value * 100) / 100 : 0;
  return (
    <span className="text-[10px] text-muted text-center min-w-[1.8rem]">
      <span className="block text-[9px] opacity-60">{label}</span>
      {v}
    </span>
  );
}
