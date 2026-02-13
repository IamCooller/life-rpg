"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Quest, QuestCompletion, Skill, User } from "@/lib/db/models";
import { getLevel, getTitle, getStreakMultiplier } from "@/lib/xp";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createQuest(formData: FormData) {
  await connectDB();
  const userId = await getUserId();

  await Quest.create({
    userId,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || "",
    skillCategory: formData.get("skillCategory") as string,
    xpReward: Number(formData.get("xpReward")) || 15,
    schedule: { type: "daily", days: [] },
  });

  revalidatePath("/quests");
  revalidatePath("/");
}

export async function completeQuest(questId: string) {
  await connectDB();
  const userId = await getUserId();

  const quest = await Quest.findOne({ _id: questId, userId });
  if (!quest) throw new Error("Quest not found");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await QuestCompletion.findOne({
    questId,
    userId,
    date: { $gte: today },
  });
  if (existing) return { error: "Already completed today" };

  // Calculate streak
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const wasCompletedYesterday =
    quest.streak.lastCompleted && quest.streak.lastCompleted >= yesterday;

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

  // Award XP
  await Skill.findOneAndUpdate(
    { userId, category: quest.skillCategory },
    { $inc: { xp: xpEarned } },
    { upsert: true }
  );

  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { totalXP: xpEarned } },
    { new: true }
  );

  const oldLevel = getLevel(user!.totalXP - xpEarned);
  const newLevel = getLevel(user!.totalXP);

  revalidatePath("/quests");
  revalidatePath("/");

  return {
    xpEarned,
    leveledUp: newLevel > oldLevel,
    newLevel,
    newTitle: newLevel > oldLevel ? getTitle(newLevel) : null,
    streakMultiplier: multiplier,
  };
}

export async function deleteQuest(questId: string) {
  await connectDB();
  const userId = await getUserId();

  await Quest.deleteOne({ _id: questId, userId });
  await QuestCompletion.deleteMany({ questId });

  revalidatePath("/quests");
  revalidatePath("/");
}
