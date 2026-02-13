"use client";

import { useState, useTransition } from "react";
import { Swords, Plus, Flame, Check, Trash2 } from "lucide-react";
import { GameCard } from "@/components/ui/game-card";
import { Modal } from "@/components/ui/modal";
import { CategorySelect } from "@/components/ui/category-select";
import { XPToast } from "@/components/ui/xp-toast";
import { createQuest, completeQuest, deleteQuest } from "@/lib/actions/quest-actions";
import type { SkillCategory } from "@/lib/skill-constants";

interface QuestData {
  id: string;
  title: string;
  description: string;
  skillCategory: SkillCategory;
  xpReward: number;
  streak: { current: number; best: number };
  completedToday: boolean;
  categoryMeta: { name: string; icon: string; color: string };
}

export function QuestsClient({ initialQuests }: { initialQuests: QuestData[] }) {
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState("health");
  const [xpToast, setXpToast] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleComplete(questId: string) {
    startTransition(async () => {
      const result = await completeQuest(questId);
      if (result && "xpEarned" in result && result.xpEarned != null) {
        setXpToast(result.xpEarned);
      }
    });
  }

  function handleDelete(questId: string) {
    if (!confirm("Удалить квест?")) return;
    startTransition(async () => {
      await deleteQuest(questId);
    });
  }

  async function handleCreate(formData: FormData) {
    await createQuest(formData);
    setShowModal(false);
  }

  return (
    <div className="space-y-6">
      {xpToast && <XPToast xp={xpToast} onDone={() => setXpToast(null)} />}

      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Swords size={24} className="text-accent-cyan" />
          Квесты
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          Новый квест
        </button>
      </div>

      {initialQuests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-card-border py-16">
          <p className="text-4xl">⚔️</p>
          <p className="mt-3 font-medium">Нет активных квестов</p>
          <p className="mt-1 text-sm text-muted">
            Создай свой первый ежедневный квест!
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 rounded-xl bg-accent-purple/20 px-4 py-2 text-sm font-medium text-accent-purple"
          >
            Создать квест
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {initialQuests.map((quest) => (
            <GameCard key={quest.id} className="group">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleComplete(quest.id)}
                  disabled={quest.completedToday || isPending}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition-all ${
                    quest.completedToday
                      ? "border-accent-green bg-accent-green/20 text-accent-green"
                      : "border-card-border hover:border-accent-green hover:bg-accent-green/10"
                  }`}
                >
                  {quest.completedToday && <Check size={18} />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${quest.completedToday ? "text-muted line-through" : ""}`}>
                      {quest.title}
                    </p>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: quest.categoryMeta.color + "20",
                        color: quest.categoryMeta.color,
                      }}
                    >
                      {quest.categoryMeta.name}
                    </span>
                  </div>
                  {quest.description && (
                    <p className="text-sm text-muted truncate">{quest.description}</p>
                  )}
                </div>

                {quest.streak.current > 0 && (
                  <div className="flex items-center gap-1 text-accent-gold">
                    <Flame size={16} />
                    <span className="text-sm font-bold">{quest.streak.current}</span>
                  </div>
                )}

                <span className="text-sm font-medium text-accent-cyan">
                  +{quest.xpReward} XP
                </span>

                <button
                  onClick={() => handleDelete(quest.id)}
                  className="rounded-lg p-1 text-muted opacity-0 transition-all hover:text-accent-red group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </GameCard>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Новый квест">
        <form action={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted">Название</label>
            <input
              name="title"
              required
              placeholder="Утренняя медитация"
              className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted focus:border-accent-purple focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Описание</label>
            <input
              name="description"
              placeholder="10 минут каждое утро"
              className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted focus:border-accent-purple focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted">Категория</label>
            <CategorySelect name="skillCategory" value={category} onChange={setCategory} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">XP за выполнение</label>
            <input
              name="xpReward"
              type="number"
              defaultValue={15}
              min={5}
              max={100}
              className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-foreground focus:border-accent-purple focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple py-3 font-medium text-white transition-opacity hover:opacity-90"
          >
            Создать квест
          </button>
        </form>
      </Modal>
    </div>
  );
}
