// Skill categories and metadata — shared between client and server
// This file must NOT import mongoose or any server-only modules

export const SKILL_CATEGORIES = [
  "health",
  "knowledge",
  "finance",
  "career",
  "relationships",
  "creativity",
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export const SKILL_META: Record<
  SkillCategory,
  { name: string; icon: string; color: string }
> = {
  health: { name: "Здоровье", icon: "heart-pulse", color: "#ef4444" },
  knowledge: { name: "Знания", icon: "brain", color: "#8b5cf6" },
  finance: { name: "Финансы", icon: "wallet", color: "#eab308" },
  career: { name: "Карьера", icon: "briefcase", color: "#3b82f6" },
  relationships: { name: "Отношения", icon: "heart", color: "#ec4899" },
  creativity: { name: "Творчество", icon: "palette", color: "#06b6d4" },
};
