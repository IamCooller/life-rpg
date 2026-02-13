"use client";

import { useState, useTransition } from "react";
import { Skull, Plus, Swords, Trash2 } from "lucide-react";
import { GameCard } from "@/components/ui/game-card";
import { XPBar } from "@/components/ui/xp-bar";
import { Modal } from "@/components/ui/modal";
import { CategorySelect } from "@/components/ui/category-select";
import { XPToast } from "@/components/ui/xp-toast";
import { createBoss, completeBossDay, deleteBoss } from "@/lib/actions/boss-actions";
import type { SkillCategory } from "@/lib/skill-constants";

interface BossData {
  id: string;
  title: string;
  description: string;
  skillCategory: SkillCategory;
  dailyTask: string;
  duration: number;
  xpReward: number;
  daysCompleted: number;
  completedToday: boolean;
  progress: number;
  startDate: string;
  status: string;
  categoryMeta: { name: string; icon: string; color: string };
}

export function BossesClient({ initialBosses }: { initialBosses: BossData[] }) {
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState("health");
  const [xpToast, setXpToast] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleHit(bossId: string) {
    startTransition(async () => {
      const result = await completeBossDay(bossId);
      if (result && "xpEarned" in result && result.xpEarned != null) {
        setXpToast(result.xpEarned);
      }
    });
  }

  function handleDelete(bossId: string) {
    if (!confirm("Удалить босса?")) return;
    startTransition(async () => {
      await deleteBoss(bossId);
    });
  }

  async function handleCreate(formData: FormData) {
    await createBoss(formData);
    setShowModal(false);
  }

  return (
    <div className="space-y-6">
      {xpToast && <XPToast xp={xpToast} onDone={() => setXpToast(null)} />}

      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Skull size={24} className="text-accent-red" />
          Боссы
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-red to-accent-gold px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          Вызвать босса
        </button>
      </div>

      {initialBosses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-card-border py-16">
          <p className="text-4xl">💀</p>
          <p className="mt-3 font-medium">Нет активных боссов</p>
          <p className="mt-1 text-sm text-muted">Брось себе 30-дневный вызов!</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 rounded-xl bg-accent-red/20 px-4 py-2 text-sm font-medium text-accent-red"
          >
            Вызвать босса
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {initialBosses.map((boss) => (
            <GameCard key={boss.id} glow="gold" className="group relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-accent-red/10 blur-3xl" />

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Skull size={18} className="text-accent-red" />
                    <p className="font-bold text-lg">{boss.title}</p>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: boss.categoryMeta.color + "20",
                        color: boss.categoryMeta.color,
                      }}
                    >
                      {boss.categoryMeta.name}
                    </span>
                  </div>

                  {boss.description && (
                    <p className="mt-1 text-sm text-muted">{boss.description}</p>
                  )}

                  <p className="mt-2 text-sm">
                    <span className="text-muted">Ежедневное задание:</span>{" "}
                    <span className="font-medium">{boss.dailyTask}</span>
                  </p>

                  {/* HP Bar (boss health) */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-accent-red">HP босса</span>
                      <span className="text-muted">
                        {boss.daysCompleted} / {boss.duration} ударов
                      </span>
                    </div>
                    <XPBar
                      current={boss.daysCompleted}
                      max={boss.duration}
                      color="#ef4444"
                      showLabel={false}
                      size="md"
                      glow
                    />
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-sm font-medium text-accent-gold">
                    +{boss.xpReward} XP
                  </span>
                  <button
                    onClick={() => handleHit(boss.id)}
                    disabled={boss.completedToday || isPending}
                    className={`flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      boss.completedToday
                        ? "bg-accent-green/20 text-accent-green"
                        : "bg-accent-red/20 text-accent-red hover:bg-accent-red/30"
                    }`}
                  >
                    <Swords size={14} />
                    {boss.completedToday ? "Удар нанесён!" : "Атаковать"}
                  </button>
                  <button
                    onClick={() => handleDelete(boss.id)}
                    className="rounded-lg p-1 text-muted opacity-0 transition-all hover:text-accent-red group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </GameCard>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Вызвать босса">
        <form action={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted">Название челленджа</label>
            <input
              name="title"
              required
              placeholder="30 дней без сахара"
              className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted focus:border-accent-purple focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Описание</label>
            <input
              name="description"
              placeholder="Полный отказ от рафинированного сахара"
              className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted focus:border-accent-purple focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">
              Ежедневное задание
            </label>
            <input
              name="dailyTask"
              required
              placeholder="Весь день без сладкого"
              className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted focus:border-accent-purple focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted">Категория</label>
            <CategorySelect name="skillCategory" value={category} onChange={setCategory} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">
              Продолжительность (дни)
            </label>
            <input
              name="duration"
              type="number"
              defaultValue={30}
              min={7}
              max={90}
              className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-foreground focus:border-accent-purple focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-accent-red to-accent-gold py-3 font-medium text-white transition-opacity hover:opacity-90"
          >
            Бросить вызов!
          </button>
        </form>
      </Modal>
    </div>
  );
}
