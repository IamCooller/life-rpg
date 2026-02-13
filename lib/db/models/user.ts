import mongoose, { Schema, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Date, default: null },
    image: { type: String, default: null },

    // RPG fields
    totalXP: { type: Number, default: 0 },
    avatar: { type: String, default: "default" },
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],

    // NextAuth fields
    accounts: [{ type: Schema.Types.ObjectId, ref: "Account" }],
    sessions: [{ type: Schema.Types.ObjectId, ref: "Session" }],
  },
  { timestamps: true }
);

export type IUser = InferSchemaType<typeof userSchema>;
export const User = mongoose.models.User || mongoose.model("User", userSchema);
