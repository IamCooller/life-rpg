import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import {
  User,
  Skill,
  Quest,
  QuestCompletion,
  Mission,
  Boss,
  Achievement,
  SKILL_META,
  SKILL_CATEGORIES,
} from "@/lib/db/models";
import { getLevel, getTitle, getLevelProgress } from "@/lib/xp";
import type { SkillCategory } from "@/lib/db/models";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function getMe() {
  await connectDB();
  const userId = await getUserId();
  const user = await User.findById(userId).lean();
  if (!user) return null;

  const progress = getLevelProgress(user.totalXP ?? 0);
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image,
    totalXP: user.totalXP ?? 0,
    level: progress.level,
    title: getTitle(progress.level),
    currentXP: progress.currentXP,
    requiredXP: progress.requiredXP,
    progress: progress.progress,
  };
}

export async function getMySkills() {
  await connectDB();
  const userId = await getUserId();

  const skills = await Skill.find({ userId }).lean();

  // Return all 6 categories, creating empty ones if missing
  return SKILL_CATEGORIES.map((category) => {
    const skill = skills.find((s) => s.category === category);
    const xp = skill?.xp ?? 0;
    const meta = SKILL_META[category as SkillCategory];
    return {
      category,
      xp,
      level: getLevel(xp),
      ...meta,
    };
  });
}

export async function getMyQuests() {
  await connectDB();
  const userId = await getUserId();

  const quests = await Quest.find({ userId, isActive: true })
    .sort({ createdAt: -1 })
    .lean();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const questIds = quests.map((q) => q._id);
  const completions = await QuestCompletion.find({
    questId: { $in: questIds },
    userId,
    date: { $gte: today },
  }).lean();

  const completedSet = new Set(completions.map((c) => c.questId.toString()));

  return quests.map((q) => ({
    id: q._id.toString(),
    title: q.title,
    description: q.description,
    skillCategory: q.skillCategory as SkillCategory,
    xpReward: q.xpReward,
    streak: {
      current: q.streak?.current ?? 0,
      best: q.streak?.best ?? 0,
    },
    completedToday: completedSet.has(q._id.toString()),
    categoryMeta: SKILL_META[q.skillCategory as SkillCategory],
  }));
}

export async function getMyMissions(status: string = "active") {
  await connectDB();
  const userId = await getUserId();

  const missions = await Mission.find({ userId, status })
    .sort({ createdAt: -1 })
    .lean();

  return missions.map((m) => {
    const totalSubtasks = m.subtasks?.length ?? 0;
    const doneSubtasks = m.subtasks?.filter(
      (s: { completed: boolean }) => s.completed
    ).length ?? 0;

    return {
      id: m._id.toString(),
      title: m.title,
      description: m.description,
      skillCategory: m.skillCategory as SkillCategory,
      difficulty: m.difficulty as string,
      xpReward: m.xpReward,
      deadline: m.deadline ? m.deadline.toISOString() : null,
      subtasks: (m.subtasks ?? []).map(
        (s: { title: string; completed: boolean }, i: number) => ({
          index: i,
          title: s.title,
          completed: s.completed,
        })
      ),
      status: m.status,
      progress: totalSubtasks > 0 ? doneSubtasks / totalSubtasks : 0,
      categoryMeta: SKILL_META[m.skillCategory as SkillCategory],
    };
  });
}

export async function getMyBosses(status: string = "active") {
  await connectDB();
  const userId = await getUserId();

  const bosses = await Boss.find({ userId, status })
    .sort({ createdAt: -1 })
    .lean();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return bosses.map((b) => {
    const daysCompleted =
      b.progress?.filter((p: { completed: boolean }) => p.completed).length ??
      0;

    const completedToday = b.progress?.some(
      (p: { date: Date; completed: boolean }) => {
        const d = new Date(p.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime() && p.completed;
      }
    );

    return {
      id: b._id.toString(),
      title: b.title,
      description: b.description,
      skillCategory: b.skillCategory as SkillCategory,
      dailyTask: b.dailyTask,
      duration: b.duration,
      xpReward: b.xpReward,
      daysCompleted,
      completedToday: !!completedToday,
      progress: b.duration > 0 ? daysCompleted / b.duration : 0,
      startDate: b.startDate.toISOString(),
      status: b.status,
      categoryMeta: SKILL_META[b.skillCategory as SkillCategory],
    };
  });
}

export async function getDashboardStats() {
  await connectDB();
  const userId = await getUserId();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    questCount,
    missionsDone,
    bossesActive,
    todayCompletions,
    weekCompletions,
    bestStreakQuest,
  ] = await Promise.all([
    Quest.countDocuments({ userId, isActive: true }),
    Mission.countDocuments({ userId, status: "completed" }),
    Boss.countDocuments({ userId, status: "active" }),
    QuestCompletion.find({ userId, date: { $gte: today } }).lean(),
    QuestCompletion.find({ userId, date: { $gte: weekAgo } }).lean(),
    Quest.findOne({ userId }).sort({ "streak.best": -1 }).lean(),
  ]);

  return {
    questCount,
    missionsDone,
    bossesActive,
    bestStreak: bestStreakQuest?.streak?.best ?? 0,
    todayXP: todayCompletions.reduce(
      (sum: number, c: { xpEarned: number }) => sum + c.xpEarned,
      0
    ),
    weekXP: weekCompletions.reduce(
      (sum: number, c: { xpEarned: number }) => sum + c.xpEarned,
      0
    ),
  };
}

export async function getAnalyticsData() {
  await connectDB();
  const userId = await getUserId();

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // Get completions for the last 365 days (for heatmap)
  const yearAgo = new Date(today);
  yearAgo.setDate(yearAgo.getDate() - 365);

  const [skills, completions, missionsCompleted] = await Promise.all([
    Skill.find({ userId }).lean(),
    QuestCompletion.find({ userId, date: { $gte: yearAgo } })
      .sort({ date: 1 })
      .lean(),
    Mission.countDocuments({ userId, status: "completed" }),
  ]);

  // Skills for radar chart
  const radarData = SKILL_CATEGORIES.map((category) => {
    const skill = skills.find((s) => s.category === category);
    const xp = skill?.xp ?? 0;
    const meta = SKILL_META[category as SkillCategory];
    return {
      category: meta.name,
      xp,
      level: getLevel(xp),
      color: meta.color,
    };
  });

  // Weekly XP for line chart (last 12 weeks)
  const weeklyXP: { week: string; xp: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekXP = completions
      .filter((c) => {
        const d = new Date(c.date);
        return d >= weekStart && d < weekEnd;
      })
      .reduce(
        (sum: number, c: { xpEarned: number }) => sum + (c.xpEarned ?? 0),
        0
      );

    const label = weekStart.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
    weeklyXP.push({ week: label, xp: weekXP });
  }

  // Activity heatmap (last 365 days)
  const heatmapData: { date: string; count: number }[] = [];
  const dateCounts = new Map<string, number>();

  for (const c of completions) {
    const dateStr = new Date(c.date).toISOString().slice(0, 10);
    dateCounts.set(dateStr, (dateCounts.get(dateStr) ?? 0) + 1);
  }

  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    heatmapData.push({
      date: dateStr,
      count: dateCounts.get(dateStr) ?? 0,
    });
  }

  // Overall stats
  const totalCompletions = completions.length;
  const totalXPEarned = completions.reduce(
    (sum: number, c: { xpEarned: number }) => sum + (c.xpEarned ?? 0),
    0
  );

  return {
    radarData,
    weeklyXP,
    heatmapData,
    stats: {
      totalCompletions,
      totalMissions: missionsCompleted,
      totalXPEarned,
    },
  };
}

export async function getLeaderboard() {
  await connectDB();
  const users = await User.find({ totalXP: { $gt: 0 } })
    .sort({ totalXP: -1 })
    .limit(20)
    .lean();

  return users.map((u, i) => ({
    rank: i + 1,
    id: u._id.toString(),
    name: u.name,
    image: u.image,
    totalXP: u.totalXP ?? 0,
    level: getLevel(u.totalXP ?? 0),
    title: getTitle(getLevel(u.totalXP ?? 0)),
  }));
}
