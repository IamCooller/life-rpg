export const dynamic = "force-dynamic";

import { getMyMissions } from "@/lib/data";
import { MissionsClient } from "./missions-client";

export default async function MissionsPage() {
  let missions: Awaited<ReturnType<typeof getMyMissions>> = [];
  try {
    missions = await getMyMissions("active");
  } catch {
    missions = [];
  }

  return <MissionsClient initialMissions={missions} />;
}
