"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { GameCard } from "@/components/ui/game-card";

interface AnalyticsProps {
  radarData: { category: string; xp: number; level: number; color: string }[];
  weeklyXP: { week: string; xp: number }[];
  heatmapData: { date: string; count: number }[];
  stats: {
    totalCompletions: number;
    totalMissions: number;
    totalXPEarned: number;
  };
}

// Activity heatmap component (GitHub-style)
function ActivityHeatmap({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  function getColor(count: number) {
    if (count === 0) return "#1e1e2e";
    const intensity = count / maxCount;
    if (intensity > 0.75) return "#06b6d4";
    if (intensity > 0.5) return "#0891b2";
    if (intensity > 0.25) return "#155e75";
    return "#164e63";
  }

  // Group data by weeks (columns)
  const weeks: { date: string; count: number }[][] = [];
  let currentWeek: { date: string; count: number }[] = [];

  for (let i = 0; i < data.length; i++) {
    const dayOfWeek = new Date(data[i].date).getDay();

    // Start new week on Sunday
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(data[i]);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  // Show last ~52 weeks
  const visibleWeeks = weeks.slice(-52);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px]" style={{ minWidth: "max-content" }}>
        {visibleWeeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => (
              <div
                key={di}
                className="h-3 w-3 rounded-sm transition-colors"
                style={{ backgroundColor: getColor(day.count) }}
                title={`${day.date}: ${day.count} completions`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
        <span>Меньше</span>
        {[0, 0.25, 0.5, 0.75, 1].map((level) => (
          <div
            key={level}
            className="h-3 w-3 rounded-sm"
            style={{
              backgroundColor: getColor(level * maxCount),
            }}
          />
        ))}
        <span>Больше</span>
      </div>
    </div>
  );
}

export function AnalyticsClient({
  radarData,
  weeklyXP,
  heatmapData,
  stats,
}: AnalyticsProps) {
  return (
    <div className="space-y-6">
      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <GameCard>
          <p className="text-2xl font-bold text-accent-cyan">
            {stats.totalXPEarned.toLocaleString()}
          </p>
          <p className="text-xs text-muted">Всего XP</p>
        </GameCard>
        <GameCard>
          <p className="text-2xl font-bold text-accent-purple">
            {stats.totalCompletions}
          </p>
          <p className="text-xs text-muted">Выполнений квестов</p>
        </GameCard>
        <GameCard>
          <p className="text-2xl font-bold text-accent-gold">
            {stats.totalMissions}
          </p>
          <p className="text-xs text-muted">Завершено миссий</p>
        </GameCard>
      </div>

      {/* Skill radar chart */}
      <GameCard glow="purple">
        <h3 className="mb-4 font-bold">Баланс скиллов</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e1e2e" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, "auto"]}
                tick={{ fill: "#64748b", fontSize: 10 }}
              />
              <Radar
                name="XP"
                dataKey="xp"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </GameCard>

      {/* Weekly XP line chart */}
      <GameCard glow="cyan">
        <h3 className="mb-4 font-bold">XP по неделям</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyXP}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis
                dataKey="week"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#12121a",
                  border: "1px solid #1e1e2e",
                  borderRadius: "12px",
                  color: "#e2e8f0",
                }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Line
                type="monotone"
                dataKey="xp"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ fill: "#06b6d4", r: 4 }}
                activeDot={{ r: 6, fill: "#06b6d4" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GameCard>

      {/* Activity heatmap */}
      <GameCard>
        <h3 className="mb-4 font-bold">Активность за год</h3>
        <ActivityHeatmap data={heatmapData} />
      </GameCard>
    </div>
  );
}
