import { getMe, getMySkills } from "@/lib/data";
import { GameCard } from "@/components/ui/game-card";
import { XPBar } from "@/components/ui/xp-bar";
import { User, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";

export default async function ProfilePage() {
  let me: Awaited<ReturnType<typeof getMe>> = null;
  let skills: Awaited<ReturnType<typeof getMySkills>> = [];
  try {
    [me, skills] = await Promise.all([getMe(), getMySkills()]);
  } catch {
    // Keep defaults
  }

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <User size={24} className="text-accent-purple" />
        Профиль
      </h1>

      <GameCard glow="purple" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-accent-purple/10 blur-3xl" />
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-purple text-3xl font-bold shadow-lg">
            {me?.name?.[0] ?? "?"}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{me?.name ?? "Герой"}</h2>
            <p className="text-sm text-muted">{me?.email}</p>
            <div className="mt-1 flex gap-2">
              <span className="rounded-full bg-accent-gold/20 px-2 py-0.5 text-xs font-medium text-accent-gold">
                {me?.title ?? "Новичок"}
              </span>
              <span className="rounded-full bg-accent-cyan/20 px-2 py-0.5 text-xs font-medium text-accent-cyan">
                Уровень {me?.level ?? 0}
              </span>
            </div>
            <div className="mt-3">
              <XPBar current={me?.currentXP ?? 0} max={me?.requiredXP ?? 100} glow />
            </div>
            <p className="mt-1 text-xs text-muted">
              Всего XP: {me?.totalXP ?? 0}
            </p>
          </div>
        </div>
      </GameCard>

      <GameCard>
        <h3 className="mb-4 font-bold">Прогресс скиллов</h3>
        <div className="space-y-4">
          {skills.map((skill) => (
            <div key={skill.category}>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: skill.color }}
                  />
                  <span>{skill.name}</span>
                </div>
                <span className="text-muted">
                  Ур. {skill.level} — {skill.xp} XP
                </span>
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

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-2.5 text-sm font-medium text-accent-red transition-colors hover:bg-accent-red/20"
        >
          <LogOut size={16} />
          Выйти
        </button>
      </form>
    </div>
  );
}
