export const typeDefs = `#graphql
  enum SkillCategory {
    health
    knowledge
    finance
    career
    relationships
    creativity
  }

  enum Difficulty {
    easy
    medium
    hard
    epic
  }

  enum QuestScheduleType {
    daily
    weekdays
    custom
  }

  enum Status {
    active
    completed
    failed
  }

  type User {
    id: ID!
    name: String!
    email: String!
    image: String
    totalXP: Int!
    level: Int!
    title: String!
    avatar: String!
    skills: [Skill!]!
    friends: [User!]!
  }

  type Skill {
    id: ID!
    category: SkillCategory!
    xp: Int!
    level: Int!
    name: String!
    icon: String!
    color: String!
  }

  type Streak {
    current: Int!
    best: Int!
    lastCompleted: String
  }

  type Quest {
    id: ID!
    title: String!
    description: String
    skillCategory: SkillCategory!
    xpReward: Int!
    schedule: QuestSchedule!
    streak: Streak!
    isActive: Boolean!
    completedToday: Boolean!
  }

  type QuestSchedule {
    type: QuestScheduleType!
    days: [Int!]!
  }

  type Subtask {
    title: String!
    completed: Boolean!
  }

  type Mission {
    id: ID!
    title: String!
    description: String
    skillCategory: SkillCategory!
    difficulty: Difficulty!
    xpReward: Int!
    deadline: String
    subtasks: [Subtask!]!
    status: Status!
    completedAt: String
    progress: Float!
  }

  type BossProgress {
    date: String!
    completed: Boolean!
  }

  type Boss {
    id: ID!
    title: String!
    description: String
    skillCategory: SkillCategory!
    duration: Int!
    dailyTask: String!
    xpReward: Int!
    startDate: String!
    progress: [BossProgress!]!
    status: Status!
    daysCompleted: Int!
    totalDays: Int!
  }

  type Achievement {
    id: ID!
    key: String!
    name: String!
    description: String!
    icon: String!
    unlockedAt: String!
  }

  type LeaderboardEntry {
    user: User!
    xp: Int!
    rank: Int!
  }

  type DashboardStats {
    totalQuests: Int!
    totalMissions: Int!
    totalBosses: Int!
    bestStreak: Int!
    todayXP: Int!
    weekXP: Int!
  }

  type Query {
    me: User!
    mySkills: [Skill!]!
    myQuests(activeOnly: Boolean): [Quest!]!
    myMissions(status: Status): [Mission!]!
    myBosses(status: Status): [Boss!]!
    myAchievements: [Achievement!]!
    leaderboard: [LeaderboardEntry!]!
    dashboardStats: DashboardStats!
  }

  input CreateQuestInput {
    title: String!
    description: String
    skillCategory: SkillCategory!
    xpReward: Int
    scheduleType: QuestScheduleType
    scheduleDays: [Int!]
  }

  input CreateMissionInput {
    title: String!
    description: String
    skillCategory: SkillCategory!
    difficulty: Difficulty!
    deadline: String
    subtasks: [String!]
  }

  input CreateBossInput {
    title: String!
    description: String
    skillCategory: SkillCategory!
    duration: Int
    dailyTask: String!
  }

  type XPGain {
    xpEarned: Int!
    totalXP: Int!
    newLevel: Int!
    leveledUp: Boolean!
    newTitle: String
  }

  type Mutation {
    createQuest(input: CreateQuestInput!): Quest!
    completeQuest(questId: ID!): XPGain!
    toggleQuest(questId: ID!, isActive: Boolean!): Quest!
    deleteQuest(questId: ID!): Boolean!

    createMission(input: CreateMissionInput!): Mission!
    toggleSubtask(missionId: ID!, subtaskIndex: Int!): Mission!
    completeMission(missionId: ID!): XPGain!
    deleteMission(missionId: ID!): Boolean!

    createBoss(input: CreateBossInput!): Boss!
    completeBossDay(bossId: ID!): XPGain!
    deleteBoss(bossId: ID!): Boolean!
  }
`;
