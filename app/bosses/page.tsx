export const dynamic = "force-dynamic";

import { getMyBosses } from "@/lib/data";
import { BossesClient } from "./bosses-client";

export default async function BossesPage() {
  let bosses: Awaited<ReturnType<typeof getMyBosses>> = [];
  try {
    bosses = await getMyBosses("active");
  } catch {
    bosses = [];
  }

  return <BossesClient initialBosses={bosses} />;
}
