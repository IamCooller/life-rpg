"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Boss, Skill, User } from "@/lib/db/models";
import { getLevel, getTitle } from "@/lib/xp";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createBoss(formData: FormData) {
  await connectDB();
  const userId = await getUserId();

  await Boss.create({
    userId,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || "",
    skillCategory: formData.get("skillCategory") as string,
    duration: Number(formData.get("duration")) || 30,
    dailyTask: formData.get("dailyTask") as string,
    xpReward: 500,
    startDate: new Date(),
  });

  revalidatePath("/bosses");
  revalidatePath("/");
}

export async function completeBossDay(bossId: string) {
  await connectDB();
  const userId = await getUserId();

  const boss = await Boss.findOne({ _id: bossId, userId, status: "active" });
  if (!boss) return { error: "Boss not found" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const alreadyDone = boss.progress.some(
    (p: { date: Date; completed: boolean }) => {
      const d = new Date(p.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime() && p.completed;
    }
  );
  if (alreadyDone) return { error: "Already completed today" };

  boss.progress.push({ date: new Date(), completed: true });

  const daysCompleted = boss.progress.filter(
    (p: { completed: boolean }) => p.completed
  ).length;
  let xpEarned = 15;

  if (daysCompleted >= boss.duration) {
    boss.status = "completed";
    xpEarned = boss.xpReward;
  }

  await boss.save();

  await Skill.findOneAndUpdate(
    { userId, category: boss.skillCategory },
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

  revalidatePath("/bosses");
  revalidatePath("/");

  return {
    xpEarned,
    bossDefeated: daysCompleted >= boss.duration,
    leveledUp: newLevel > oldLevel,
  };
}

export async function deleteBoss(bossId: string) {
  await connectDB();
  const userId = await getUserId();
  await Boss.deleteOne({ _id: bossId, userId });
  revalidatePath("/bosses");
  revalidatePath("/");
}
