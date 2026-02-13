import { getMyQuests } from "@/lib/data";
import { QuestsClient } from "./quests-client";

export default async function QuestsPage() {
  let quests: Awaited<ReturnType<typeof getMyQuests>> = [];
  try {
    quests = await getMyQuests();
  } catch {
    quests = [];
  }

  return <QuestsClient initialQuests={quests} />;
}
