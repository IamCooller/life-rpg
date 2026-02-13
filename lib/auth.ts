import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = client.connect();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  // JWT strategy doesn't need MongoDB transactions (no replica set required)
  session: { strategy: "jwt" },
  providers: [
    Google,
    Resend({
      from: "Life RPG <noreply@hashlab.digital>",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // With JWT strategy, we get token instead of user in session callback
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
