import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";

export interface GraphQLContext {
  userId: string | null;
}

export async function createContext(): Promise<GraphQLContext> {
  await connectDB();

  const session = await auth();
  return {
    userId: session?.user?.id ?? null,
  };
}
