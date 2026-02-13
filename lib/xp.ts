// XP and level calculation utilities

export function getLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100));
}

export function getXPForLevel(level: number): number {
  return level * level * 100;
}

export function getXPForNextLevel(currentLevel: number): number {
  return getXPForLevel(currentLevel + 1);
}

export function getLevelProgress(totalXP: number): {
  level: number;
  currentXP: number;
  requiredXP: number;
  progress: number; // 0-1
} {
  const level = getLevel(totalXP);
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForNextLevel(level);
  const currentXP = totalXP - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;

  return {
    level,
    currentXP,
    requiredXP,
    progress: requiredXP > 0 ? currentXP / requiredXP : 0,
  };
}

export function getTitle(level: number): string {
  if (level >= 50) return "Легенда";
  if (level >= 25) return "Мастер";
  if (level >= 10) return "Ученик";
  return "Новичок";
}

// Streak multiplier for XP
export function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 100) return 3;
  if (streakDays >= 30) return 2;
  if (streakDays >= 7) return 1.5;
  return 1;
}

// Difficulty XP rewards
export const DIFFICULTY_XP = {
  easy: 10,
  medium: 25,
  hard: 50,
  epic: 100,
} as const;

export type Difficulty = keyof typeof DIFFICULTY_XP;
