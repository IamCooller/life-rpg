import { GraphQLContext } from "../context";
import { User, Skill, Quest, QuestCompletion, Mission, Boss, Achievement, SKILL_META } from "@/lib/db/models";
import { getLevel, getTitle, getStreakMultiplier, DIFFICULTY_XP } from "@/lib/xp";
import type { SkillCategory } from "@/lib/db/models";

function requireAuth(ctx: GraphQLContext): string {
  if (!ctx.userId) throw new Error("Not authenticated");
  return ctx.userId;
}

function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      return User.findById(userId);
    },

    mySkills: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      return Skill.find({ userId });
    },

    myQuests: async (_: unknown, args: { activeOnly?: boolean }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const filter: Record<string, unknown> = { userId };
      if (args.activeOnly) filter.isActive = true;
      return Quest.find(filter).sort({ createdAt: -1 });
    },

    myMissions: async (_: unknown, args: { status?: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const filter: Record<string, unknown> = { userId };
      if (args.status) filter.status = args.status;
      return Mission.find(filter).sort({ createdAt: -1 });
    },

    myBosses: async (_: unknown, args: { status?: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const filter: Record<string, unknown> = { userId };
      if (args.status) filter.status = args.status;
      return Boss.find(filter).sort({ createdAt: -1 });
    },

    myAchievements: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      return Achievement.find({ userId }).sort({ unlockedAt: -1 });
    },

    leaderboard: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const users = await User.find().sort({ totalXP: -1 }).limit(20);
      return users.map((user, index) => ({
        user,
        xp: user.totalXP,
        rank: index + 1,
      }));
    },

    dashboardStats: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const today = startOfDay();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [totalQuests, totalMissions, totalBosses, todayCompletions, weekCompletions, bestStreakQuest] =
        await Promise.all([
          Quest.countDocuments({ userId }),
          Mission.countDocuments({ userId, status: "completed" }),
          Boss.countDocuments({ userId, status: "completed" }),
          QuestCompletion.find({ userId, date: { $gte: today } }),
          QuestCompletion.find({ userId, date: { $gte: weekAgo } }),
          Quest.findOne({ userId }).sort({ "streak.best": -1 }),
        ]);

      return {
        totalQuests,
        totalMissions,
        totalBosses,
        bestStreak: bestStreakQuest?.streak?.best ?? 0,
        todayXP: todayCompletions.reduce((sum, c) => sum + c.xpEarned, 0),
        weekXP: weekCompletions.reduce((sum, c) => sum + c.xpEarned, 0),
      };
    },
  },

  User: {
    level: (user: { totalXP: number }) => getLevel(user.totalXP),
    title: (user: { totalXP: number }) => getTitle(getLevel(user.totalXP)),
    skills: async (user: { _id: string }) => Skill.find({ userId: user._id }),
    friends: async (user: { friends: string[] }) => {
      if (!user.friends?.length) return [];
      return User.find({ _id: { $in: user.friends } });
    },
  },

  Skill: {
    level: (skill: { xp: number }) => getLevel(skill.xp),
    name: (skill: { category: SkillCategory }) => SKILL_META[skill.category].name,
    icon: (skill: { category: SkillCategory }) => SKILL_META[skill.category].icon,
    color: (skill: { category: SkillCategory }) => SKILL_META[skill.category].color,
  },

  Quest: {
    completedToday: async (quest: { _id: string; userId: string }) => {
      const today = startOfDay();
      const completion = await QuestCompletion.findOne({
        questId: quest._id,
        date: { $gte: today },
      });
      return !!completion;
    },
  },

  Mission: {
    progress: (mission: { subtasks: { completed: boolean }[] }) => {
      if (!mission.subtasks?.length) return 0;
      const done = mission.subtasks.filter((s) => s.completed).length;
      return done / mission.subtasks.length;
    },
  },

  Boss: {
    daysCompleted: (boss: { progress: { completed: boolean }[] }) =>
      boss.progress?.filter((p) => p.completed).length ?? 0,
    totalDays: (boss: { duration: number }) => boss.duration,
  },

  Mutation: {
    createQuest: async (_: unknown, { input }: { input: Record<string, unknown> }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      return Quest.create({
        userId,
        title: input.title,
        description: input.description,
        skillCategory: input.skillCategory,
        xpReward: input.xpReward ?? 15,
        schedule: {
          type: input.scheduleType ?? "daily",
          days: input.scheduleDays ?? [],
        },
      });
    },

    completeQuest: async (_: unknown, { questId }: { questId: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const quest = await Quest.findOne({ _id: questId, userId });
      if (!quest) throw new Error("Quest not found");

      const today = startOfDay();
      const existing = await QuestCompletion.findOne({ questId, date: { $gte: today } });
      if (existing) throw new Error("Quest already completed today");

      // Calculate streak
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const wasCompletedYesterday = quest.streak.lastCompleted &&
        quest.streak.lastCompleted >= yesterday;

      const newStreak = wasCompletedYesterday ? quest.streak.current + 1 : 1;
      const multiplier = getStreakMultiplier(newStreak);
      const xpEarned = Math.round(quest.xpReward * multiplier);

      // Update streak
      quest.streak.current = newStreak;
      quest.streak.best = Math.max(quest.streak.best, newStreak);
      quest.streak.lastCompleted = new Date();
      await quest.save();

      // Record completion
      await QuestCompletion.create({ questId, userId, date: new Date(), xpEarned });

      // Award XP to skill and user
      await Skill.findOneAndUpdate(
        { userId, category: quest.skillCategory },
        { $inc: { xp: xpEarned } },
        { upsert: true }
      );

      const user = await User.findByIdAndUpdate(userId, { $inc: { totalXP: xpEarned } }, { new: true });
      const oldLevel = getLevel(user!.totalXP - xpEarned);
      const newLevel = getLevel(user!.totalXP);

      return {
        xpEarned,
        totalXP: user!.totalXP,
        newLevel,
        leveledUp: newLevel > oldLevel,
        newTitle: newLevel > oldLevel ? getTitle(newLevel) : null,
      };
    },

    toggleQuest: async (_: unknown, { questId, isActive }: { questId: string; isActive: boolean }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      return Quest.findOneAndUpdate({ _id: questId, userId }, { isActive }, { new: true });
    },

    deleteQuest: async (_: unknown, { questId }: { questId: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      await Quest.deleteOne({ _id: questId, userId });
      await QuestCompletion.deleteMany({ questId });
      return true;
    },

    createMission: async (_: unknown, { input }: { input: Record<string, unknown> }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const xpReward = DIFFICULTY_XP[input.difficulty as keyof typeof DIFFICULTY_XP] ?? 25;
      return Mission.create({
        userId,
        title: input.title,
        description: input.description,
        skillCategory: input.skillCategory,
        difficulty: input.difficulty,
        xpReward,
        deadline: input.deadline ? new Date(input.deadline as string) : null,
        subtasks: ((input.subtasks as string[]) ?? []).map((title) => ({ title, completed: false })),
      });
    },

    toggleSubtask: async (_: unknown, { missionId, subtaskIndex }: { missionId: string; subtaskIndex: number }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const mission = await Mission.findOne({ _id: missionId, userId });
      if (!mission) throw new Error("Mission not found");
      if (!mission.subtasks[subtaskIndex]) throw new Error("Subtask not found");

      mission.subtasks[subtaskIndex].completed = !mission.subtasks[subtaskIndex].completed;
      await mission.save();
      return mission;
    },

    completeMission: async (_: unknown, { missionId }: { missionId: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const mission = await Mission.findOne({ _id: missionId, userId, status: "active" });
      if (!mission) throw new Error("Mission not found or already completed");

      mission.status = "completed";
      mission.completedAt = new Date();
      await mission.save();

      // Award XP
      await Skill.findOneAndUpdate(
        { userId, category: mission.skillCategory },
        { $inc: { xp: mission.xpReward } },
        { upsert: true }
      );

      const user = await User.findByIdAndUpdate(userId, { $inc: { totalXP: mission.xpReward } }, { new: true });
      const oldLevel = getLevel(user!.totalXP - mission.xpReward);
      const newLevel = getLevel(user!.totalXP);

      return {
        xpEarned: mission.xpReward,
        totalXP: user!.totalXP,
        newLevel,
        leveledUp: newLevel > oldLevel,
        newTitle: newLevel > oldLevel ? getTitle(newLevel) : null,
      };
    },

    deleteMission: async (_: unknown, { missionId }: { missionId: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      await Mission.deleteOne({ _id: missionId, userId });
      return true;
    },

    createBoss: async (_: unknown, { input }: { input: Record<string, unknown> }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      return Boss.create({
        userId,
        title: input.title,
        description: input.description,
        skillCategory: input.skillCategory,
        duration: input.duration ?? 30,
        dailyTask: input.dailyTask,
        xpReward: 500,
        startDate: new Date(),
      });
    },

    completeBossDay: async (_: unknown, { bossId }: { bossId: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const boss = await Boss.findOne({ _id: bossId, userId, status: "active" });
      if (!boss) throw new Error("Boss not found or not active");

      const today = startOfDay();
      const alreadyDone = boss.progress.some(
        (p: { date: Date; completed: boolean }) =>
          startOfDay(p.date).getTime() === today.getTime() && p.completed
      );
      if (alreadyDone) throw new Error("Already completed today");

      boss.progress.push({ date: new Date(), completed: true });

      // Check if boss is defeated
      const daysCompleted = boss.progress.filter((p: { completed: boolean }) => p.completed).length;
      let xpEarned = 15; // daily XP for boss progress

      if (daysCompleted >= boss.duration) {
        boss.status = "completed";
        xpEarned = boss.xpReward; // big bonus for completing the boss
      }

      await boss.save();

      // Award XP
      await Skill.findOneAndUpdate(
        { userId, category: boss.skillCategory },
        { $inc: { xp: xpEarned } },
        { upsert: true }
      );

      const user = await User.findByIdAndUpdate(userId, { $inc: { totalXP: xpEarned } }, { new: true });
      const oldLevel = getLevel(user!.totalXP - xpEarned);
      const newLevel = getLevel(user!.totalXP);

      return {
        xpEarned,
        totalXP: user!.totalXP,
        newLevel,
        leveledUp: newLevel > oldLevel,
        newTitle: newLevel > oldLevel ? getTitle(newLevel) : null,
      };
    },

    deleteBoss: async (_: unknown, { bossId }: { bossId: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      await Boss.deleteOne({ _id: bossId, userId });
      return true;
    },
  },
};
