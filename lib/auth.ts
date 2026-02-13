import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = client.connect();

export const { handlers, auth, signIn, signOut } = NextAuth({
	adapter: MongoDBAdapter(clientPromise),
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
		session({ session, user }) {
			if (session.user) {
				session.user.id = user.id;
			}
			return session;
		},
	},
});
