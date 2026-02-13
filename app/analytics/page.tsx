export const dynamic = "force-dynamic";

import { BarChart3 } from "lucide-react";
import { getAnalyticsData } from "@/lib/data";
import { AnalyticsClient } from "./analytics-client";

export default async function AnalyticsPage() {
  let data;
  try {
    data = await getAnalyticsData();
  } catch {
    data = null;
  }

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <BarChart3 size={24} className="text-accent-cyan" />
        Аналитика
      </h1>

      {data ? (
        <AnalyticsClient
          radarData={data.radarData}
          weeklyXP={data.weeklyXP}
          heatmapData={data.heatmapData}
          stats={data.stats}
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-card-border py-16">
          <p className="text-4xl">📊</p>
          <p className="mt-3 font-medium">Нет данных для отображения</p>
          <p className="mt-1 text-sm text-muted">
            Начни выполнять квесты, чтобы увидеть статистику!
          </p>
        </div>
      )}
    </div>
  );
}
