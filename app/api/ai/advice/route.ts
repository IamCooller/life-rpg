import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import {
  User,
  Skill,
  Quest,
  QuestCompletion,
  Mission,
  Boss,
  SKILL_META,
} from "@/lib/db/models";
import type { SkillCategory } from "@/lib/db/models";
import { getLevel, getTitle } from "@/lib/xp";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Gather user context for the AI advisor
async function getUserContext(userId: string) {
  await connectDB();

  const [user, skills, quests, missions, bosses] = await Promise.all([
    User.findById(userId).lean(),
    Skill.find({ userId }).lean(),
    Quest.find({ userId, isActive: true }).lean(),
    Mission.find({ userId, status: "active" }).lean(),
    Boss.find({ userId, status: "active" }).lean(),
  ]);

  if (!user) return null;

  const level = getLevel(user.totalXP ?? 0);

  // Get recent completions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentCompletions = await QuestCompletion.find({
    userId,
    date: { $gte: thirtyDaysAgo },
  }).lean();

  const totalRecentXP = recentCompletions.reduce(
    (sum: number, c: { xpEarned: number }) => sum + (c.xpEarned ?? 0),
    0
  );

  // Build skill summary
  const skillSummary = skills.map((s) => {
    const meta = SKILL_META[s.category as SkillCategory];
    return {
      category: s.category,
      name: meta?.name ?? s.category,
      xp: s.xp ?? 0,
      level: getLevel(s.xp ?? 0),
    };
  });

  // Build quest summary with streaks
  const questSummary = quests.map((q) => ({
    title: q.title,
    category: q.skillCategory,
    streak: q.streak?.current ?? 0,
    bestStreak: q.streak?.best ?? 0,
    xpReward: q.xpReward,
  }));

  // Build mission summary
  const missionSummary = missions.map((m) => ({
    title: m.title,
    category: m.skillCategory,
    difficulty: m.difficulty,
    subtasksDone: m.subtasks?.filter((s: { completed: boolean }) => s.completed).length ?? 0,
    subtasksTotal: m.subtasks?.length ?? 0,
    deadline: m.deadline ? m.deadline.toISOString().slice(0, 10) : null,
  }));

  // Build boss summary
  const bossSummary = bosses.map((b) => ({
    title: b.title,
    category: b.skillCategory,
    daysCompleted: b.progress?.filter((p: { completed: boolean }) => p.completed).length ?? 0,
    duration: b.duration,
    dailyTask: b.dailyTask,
  }));

  return {
    name: user.name,
    level,
    title: getTitle(level),
    totalXP: user.totalXP ?? 0,
    xpLast30Days: totalRecentXP,
    completionsLast30Days: recentCompletions.length,
    skills: skillSummary,
    activeQuests: questSummary,
    activeMissions: missionSummary,
    activeBosses: bossSummary,
  };
}

const SYSTEM_PROMPT = `You are an AI life coach inside a gamified life planner called "Life RPG".
You speak Russian. You address the user informally (ты).
Your personality: supportive, motivating, practical. Like a wise RPG mentor.

The user tracks 6 life skills: Здоровье (Health), Знания (Knowledge), Финансы (Finance), Карьера (Career), Отношения (Relationships), Творчество (Creativity).

They have:
- Quests (daily habits with streaks)
- Missions (one-time goals with subtasks)
- Bosses (30-day challenges)

Your job:
1. Analyze their progress and identify patterns
2. Give specific, actionable advice
3. Suggest new quests, missions, or bosses when relevant
4. Celebrate their wins and motivate during slumps
5. Point out imbalances between skills

Keep responses concise (2-4 paragraphs max). Use game metaphors naturally.
Don't be generic — reference their actual data.`;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Gather user context
    const context = await getUserContext(session.user.id);
    if (!context) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build user message with context
    const userMessageWithContext = `User context (current stats):
${JSON.stringify(context, null, 2)}

User's message: ${message}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userMessageWithContext,
        },
      ],
    });

    // Extract text from the response
    const reply = response.content
      .filter((block) => block.type === "text")
      .map((block) => {
        if (block.type === "text") return block.text;
        return "";
      })
      .join("\n");

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI advice error:", error);
    return NextResponse.json(
      { error: "Failed to get AI advice" },
      { status: 500 }
    );
  }
}
