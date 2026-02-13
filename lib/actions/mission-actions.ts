"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Mission, Skill, User } from "@/lib/db/models";
import { getLevel, getTitle, DIFFICULTY_XP } from "@/lib/xp";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createMission(formData: FormData) {
  await connectDB();
  const userId = await getUserId();
  const difficulty = (formData.get("difficulty") as string) || "medium";
  const xpReward = DIFFICULTY_XP[difficulty as keyof typeof DIFFICULTY_XP] ?? 25;

  const subtasksRaw = formData.get("subtasks") as string;
  const subtasks = subtasksRaw
    ? subtasksRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((title) => ({ title, completed: false }))
    : [];

  await Mission.create({
    userId,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || "",
    skillCategory: formData.get("skillCategory") as string,
    difficulty,
    xpReward,
    deadline: formData.get("deadline") || null,
    subtasks,
  });

  revalidatePath("/missions");
  revalidatePath("/");
}

export async function toggleSubtask(missionId: string, subtaskIndex: number) {
  await connectDB();
  const userId = await getUserId();

  const mission = await Mission.findOne({ _id: missionId, userId });
  if (!mission) throw new Error("Mission not found");

  mission.subtasks[subtaskIndex].completed =
    !mission.subtasks[subtaskIndex].completed;
  await mission.save();

  revalidatePath("/missions");
}

export async function completeMission(missionId: string) {
  await connectDB();
  const userId = await getUserId();

  const mission = await Mission.findOne({
    _id: missionId,
    userId,
    status: "active",
  });
  if (!mission) return { error: "Mission not found or already completed" };

  mission.status = "completed";
  mission.completedAt = new Date();
  await mission.save();

  await Skill.findOneAndUpdate(
    { userId, category: mission.skillCategory },
    { $inc: { xp: mission.xpReward } },
    { upsert: true }
  );

  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { totalXP: mission.xpReward } },
    { new: true }
  );

  const oldLevel = getLevel(user!.totalXP - mission.xpReward);
  const newLevel = getLevel(user!.totalXP);

  revalidatePath("/missions");
  revalidatePath("/");

  return {
    xpEarned: mission.xpReward,
    leveledUp: newLevel > oldLevel,
    newLevel,
  };
}

export async function deleteMission(missionId: string) {
  await connectDB();
  const userId = await getUserId();
  await Mission.deleteOne({ _id: missionId, userId });
  revalidatePath("/missions");
  revalidatePath("/");
}
