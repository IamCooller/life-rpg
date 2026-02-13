export const dynamic = "force-dynamic";

import { getMe, getMySkills, getMyQuests, getDashboardStats } from "@/lib/data";
import { GameCard } from "@/components/ui/game-card";
import { XPBar } from "@/components/ui/xp-bar";
import { Swords, Target, Skull, Flame, TrendingUp, Trophy, Zap } from "lucide-react";

export default async function DashboardPage() {
  let me: Awaited<ReturnType<typeof getMe>> = null;
  let skills: Awaited<ReturnType<typeof getMySkills>> = [];
  let quests: Awaited<ReturnType<typeof getMyQuests>> = [];
  let stats: Awaited<ReturnType<typeof getDashboardStats>> = {
    questCount: 0,
    missionsDone: 0,
    bossesActive: 0,
    bestStreak: 0,
    todayXP: 0,
    weekXP: 0,
  };

  try {
    [me, skills, quests, stats] = await Promise.all([
      getMe(),
      getMySkills(),
      getMyQuests(),
      getDashboardStats(),
    ]);
  } catch {
    // Keep defaults
  }

  const userName = me?.name?.split(" ")[0] ?? "Герой";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Привет, {userName}!</h1>
          <p className="text-muted">Готов к новым свершениям?</p>
        </div>
        {stats.todayXP > 0 && (
          <div className="flex items-center gap-1 rounded-xl bg-accent-gold/20 px-3 py-1.5 text-accent-gold">
            <Zap size={16} />
            <span className="text-sm font-bold">+{stats.todayXP} XP сегодня</span>
          </div>
        )}
      </div>

      <GameCard glow="purple" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-accent-purple/10 blur-3xl" />
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-purple text-2xl font-bold shadow-lg">
            {me?.name?.[0] ?? "?"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{me?.name ?? "Герой"}</h2>
              <span className="rounded-full bg-accent-gold/20 px-2 py-0.5 text-xs font-medium text-accent-gold">
                {me?.title ?? "Новичок"}
              </span>
            </div>
            <p className="text-sm text-muted">Уровень {me?.level ?? 0}</p>
            <div className="mt-2">
              <XPBar current={me?.currentXP ?? 0} max={me?.requiredXP ?? 100} glow />
            </div>
          </div>
        </div>
      </GameCard>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Квесты", value: stats.questCount, icon: Swords, color: "cyan" },
          { label: "Выполнено", value: stats.missionsDone, icon: Target, color: "purple" },
          { label: "Боссы", value: stats.bossesActive, icon: Skull, color: "red" },
          { label: "Лучший стрик", value: stats.bestStreak, icon: Flame, color: "gold" },
        ].map((stat) => (
          <GameCard key={stat.label}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-accent-${stat.color}/15`}>
                <stat.icon size={20} className={`text-accent-${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </div>
          </GameCard>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <GameCard>
          <h3 className="mb-4 flex items-center gap-2 font-bold">
            <TrendingUp size={18} className="text-accent-cyan" />
            Скиллы
          </h3>
          <div className="space-y-3">
            {skills.map((skill) => (
              <div key={skill.category}>
                <div className="flex items-center justify-between text-sm">
                  <span>{skill.name}</span>
                  <span className="text-xs text-muted">Ур. {skill.level}</span>
                </div>
                <XPBar
                  current={skill.xp % 100 || (skill.xp > 0 ? 100 : 0)}
                  max={100}
                  color={skill.color}
                  showLabel={false}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </GameCard>

        <GameCard>
          <h3 className="mb-4 flex items-center gap-2 font-bold">
            <Trophy size={18} className="text-accent-gold" />
            Квесты на сегодня
          </h3>
          {quests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-4xl">⚔️</p>
              <p className="mt-2 text-sm text-muted">Создай квесты на странице Квесты!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {quests.slice(0, 5).map((quest) => (
                <div key={quest.id} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
                  <div className={`h-3 w-3 rounded-full ${quest.completedToday ? "bg-accent-green" : "bg-card-border"}`} />
                  <span className={`flex-1 text-sm ${quest.completedToday ? "text-muted line-through" : ""}`}>
                    {quest.title}
                  </span>
                  {quest.streak.current > 0 && (
                    <span className="text-xs text-accent-gold">{quest.streak.current}🔥</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </GameCard>
      </div>
    </div>
  );
}
