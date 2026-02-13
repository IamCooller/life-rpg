"use client";

import { useState, useTransition } from "react";
import { Target, Plus, Check, Trash2, Square, CheckSquare } from "lucide-react";
import { GameCard } from "@/components/ui/game-card";
import { XPBar } from "@/components/ui/xp-bar";
import { Modal } from "@/components/ui/modal";
import { CategorySelect } from "@/components/ui/category-select";
import { XPToast } from "@/components/ui/xp-toast";
import {
  createMission,
  toggleSubtask,
  completeMission,
  deleteMission,
} from "@/lib/actions/mission-actions";
import type { SkillCategory } from "@/lib/skill-constants";

const DIFF_COLORS: Record<string, string> = {
  easy: "#22c55e",
  medium: "#3b82f6",
  hard: "#eab308",
  epic: "#8b5cf6",
};

const DIFF_LABELS: Record<string, string> = {
  easy: "Лёгкая",
  medium: "Средняя",
  hard: "Сложная",
  epic: "Эпическая",
};

interface SubtaskData {
  index: number;
  title: string;
  completed: boolean;
}

interface MissionData {
  id: string;
  title: string;
  description: string;
  skillCategory: SkillCategory;
  difficulty: string;
  xpReward: number;
  deadline: string | null;
  subtasks: SubtaskData[];
  status: string;
  progress: number;
  categoryMeta: { name: string; icon: string; color: string };
}

export function MissionsClient({ initialMissions }: { initialMissions: MissionData[] }) {
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState("career");
  const [difficulty, setDifficulty] = useState("medium");
  const [xpToast, setXpToast] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggleSubtask(missionId: string, index: number) {
    startTransition(async () => {
      await toggleSubtask(missionId, index);
    });
  }

  function handleComplete(missionId: string) {
    startTransition(async () => {
      const result = await completeMission(missionId);
      if (result && "xpEarned" in result && result.xpEarned != null) {
        setXpToast(result.xpEarned);
      }
    });
  }

  function handleDelete(missionId: string) {
    if (!confirm("Удалить миссию?")) return;
    startTransition(async () => {
      await deleteMission(missionId);
    });
  }

  async function handleCreate(formData: FormData) {
    await createMission(formData);
    setShowModal(false);
  }

  return (
    <div className="space-y-6">
      {xpToast && <XPToast xp={xpToast} onDone={() => setXpToast(null)} />}

      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Target size={24} className="text-accent-purple" />
          Миссии
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          Новая миссия
        </button>
      </div>

      {initialMissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-card-border py-16">
          <p className="text-4xl">🎯</p>
          <p className="mt-3 font-medium">Нет активных миссий</p>
          <p className="mt-1 text-sm text-muted">Поставь свою первую цель!</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 rounded-xl bg-accent-purple/20 px-4 py-2 text-sm font-medium text-accent-purple"
          >
            Создать миссию
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {initialMissions.map((mission) => (
            <GameCard key={mission.id} className="group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{mission.title}</p>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: DIFF_COLORS[mission.difficulty] + "20",
                        color: DIFF_COLORS[mission.difficulty],
                      }}
                    >
                      {DIFF_LABELS[mission.difficulty]}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: mission.categoryMeta.color + "20",
                        color: mission.categoryMeta.color,
                      }}
                    >
                      {mission.categoryMeta.name}
                    </span>
                  </div>

                  {mission.description && (
                    <p className="mt-1 text-sm text-muted">{mission.description}</p>
                  )}

                  {/* Subtasks */}
                  {mission.subtasks.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {mission.subtasks.map((st) => (
                        <button
                          key={st.index}
                          onClick={() => handleToggleSubtask(mission.id, st.index)}
                          disabled={isPending}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-white/5"
                        >
                          {st.completed ? (
                            <CheckSquare size={16} className="text-accent-green" />
                          ) : (
                            <Square size={16} className="text-muted" />
                          )}
                          <span className={st.completed ? "text-muted line-through" : ""}>
                            {st.title}
                          </span>
                        </button>
                      ))}
                      <div className="mt-2">
                        <XPBar
                          current={Math.round(mission.progress * 100)}
                          max={100}
                          color={DIFF_COLORS[mission.difficulty]}
                          showLabel={false}
                          size="sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Deadline */}
                  {mission.deadline && (
                    <p className="mt-2 text-xs text-muted">
                      Дедлайн: {new Date(mission.deadline).toLocaleDateString("ru")}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-sm font-medium text-accent-cyan">
                    +{mission.xpReward} XP
                  </span>
                  <button
                    onClick={() => handleComplete(mission.id)}
                    disabled={isPending}
                    className="rounded-xl bg-accent-green/20 px-3 py-1.5 text-xs font-medium text-accent-green transition-opacity hover:opacity-80"
                  >
                    <Check size={14} className="inline mr-1" />
                    Готово
                  </button>
                  <button
                    onClick={() => handleDelete(mission.id)}
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Новая миссия">
        <form action={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted">Название</label>
            <input
              name="title"
              required
              placeholder="Запустить новый проект"
              className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted focus:border-accent-purple focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Описание</label>
            <input
              name="description"
              placeholder="MVP к концу месяца"
              className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted focus:border-accent-purple focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted">Категория</label>
            <CategorySelect name="skillCategory" value={category} onChange={setCategory} />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted">Сложность</label>
            <div className="grid grid-cols-4 gap-2">
              {(["easy", "medium", "hard", "epic"] as const).map((d) => (
                <label
                  key={d}
                  className={`flex cursor-pointer items-center justify-center rounded-xl border py-2 text-xs font-medium transition-all ${
                    difficulty === d
                      ? "border-accent-purple bg-accent-purple/10"
                      : "border-card-border hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="difficulty"
                    value={d}
                    checked={difficulty === d}
                    onChange={() => setDifficulty(d)}
                    className="hidden"
                  />
                  <span style={{ color: DIFF_COLORS[d] }}>{DIFF_LABELS[d]}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">
              Подзадачи (каждая с новой строки)
            </label>
            <textarea
              name="subtasks"
              rows={3}
              placeholder={"Продумать структуру\nНаписать базу\nПротестировать"}
              className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted focus:border-accent-purple focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Дедлайн</label>
            <input
              name="deadline"
              type="date"
              className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-foreground focus:border-accent-purple focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple py-3 font-medium text-white transition-opacity hover:opacity-90"
          >
            Создать миссию
          </button>
        </form>
      </Modal>
    </div>
  );
}
