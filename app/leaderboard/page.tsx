export const dynamic = "force-dynamic";

import { getLeaderboard, getMe } from "@/lib/data";
import { GameCard } from "@/components/ui/game-card";
import { Trophy, Medal } from "lucide-react";

export default async function LeaderboardPage() {
  let entries: Awaited<ReturnType<typeof getLeaderboard>> = [];
  let me: Awaited<ReturnType<typeof getMe>> = null;
  try {
    [entries, me] = await Promise.all([getLeaderboard(), getMe()]);
  } catch {
    entries = [];
    me = null;
  }

  const medalColors = ["#eab308", "#94a3b8", "#cd7f32"]; // gold, silver, bronze

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Trophy size={24} className="text-accent-gold" />
        Лидерборд
      </h1>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-card-border py-16">
          <p className="text-4xl">🏆</p>
          <p className="mt-3 font-medium">Пока никого нет</p>
          <p className="mt-1 text-sm text-muted">Начни зарабатывать XP, чтобы попасть в таблицу!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const isMe = entry.id === me?.id;
            return (
              <GameCard
                key={entry.id}
                glow={isMe ? "gold" : "none"}
                className={isMe ? "border-accent-gold/30" : ""}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex h-10 w-10 items-center justify-center">
                    {entry.rank <= 3 ? (
                      <Medal
                        size={24}
                        style={{ color: medalColors[entry.rank - 1] }}
                      />
                    ) : (
                      <span className="text-lg font-bold text-muted">
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple text-sm font-bold">
                    {entry.name?.[0] ?? "?"}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <p className="font-medium">
                      {entry.name}
                      {isMe && (
                        <span className="ml-2 text-xs text-accent-gold">(ты)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {entry.title} · Ур. {entry.level}
                    </p>
                  </div>

                  {/* XP */}
                  <span className="text-sm font-bold text-accent-cyan">
                    {entry.totalXP} XP
                  </span>
                </div>
              </GameCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
