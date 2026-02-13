"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  AreaChart,
  Area,
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

  const weeks: { date: string; count: number }[][] = [];
  let currentWeek: { date: string; count: number }[] = [];

  for (let i = 0; i < data.length; i++) {
    const dayOfWeek = new Date(data[i].date).getDay();
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(data[i]);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  // On mobile show fewer weeks to fit screen
  const visibleWeeks = weeks.slice(-26);

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex gap-[2px] sm:gap-[3px]" style={{ minWidth: "max-content" }}>
        {visibleWeeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px] sm:gap-[3px]">
            {week.map((day, di) => (
              <div
                key={di}
                className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-sm"
                style={{ backgroundColor: getColor(day.count) }}
                title={`${day.date}: ${day.count}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] sm:text-xs text-muted">
        <span>Меньше</span>
        {[0, 0.25, 0.5, 0.75, 1].map((level) => (
          <div
            key={level}
            className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-sm"
            style={{ backgroundColor: getColor(level * maxCount) }}
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
    <div className="space-y-4 sm:space-y-6">
      {/* Stats — 2 cols on mobile, 3 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <GameCard>
          <p className="text-xl sm:text-2xl font-bold text-accent-cyan">
            {stats.totalXPEarned.toLocaleString()}
          </p>
          <p className="text-[10px] sm:text-xs text-muted">Всего XP</p>
        </GameCard>
        <GameCard>
          <p className="text-xl sm:text-2xl font-bold text-accent-purple">
            {stats.totalCompletions}
          </p>
          <p className="text-[10px] sm:text-xs text-muted">Выполнений</p>
        </GameCard>
        <GameCard className="col-span-2 sm:col-span-1">
          <p className="text-xl sm:text-2xl font-bold text-accent-gold">
            {stats.totalMissions}
          </p>
          <p className="text-[10px] sm:text-xs text-muted">Миссий</p>
        </GameCard>
      </div>

      {/* Skill radar chart */}
      <GameCard glow="purple">
        <h3 className="mb-3 font-bold text-sm sm:text-base">Баланс скиллов</h3>
        <div className="h-56 sm:h-72 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#1e1e2e" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
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

      {/* Weekly XP area chart */}
      <GameCard glow="cyan">
        <h3 className="mb-3 font-bold text-sm sm:text-base">XP по неделям</h3>
        <div className="h-48 sm:h-64 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyXP}>
              <defs>
                <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis
                dataKey="week"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#12121a",
                  border: "1px solid #1e1e2e",
                  borderRadius: "12px",
                  color: "#e2e8f0",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Area
                type="monotone"
                dataKey="xp"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#xpGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#06b6d4" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GameCard>

      {/* Activity heatmap */}
      <GameCard>
        <h3 className="mb-3 font-bold text-sm sm:text-base">Активность</h3>
        <ActivityHeatmap data={heatmapData} />
      </GameCard>
    </div>
  );
}
