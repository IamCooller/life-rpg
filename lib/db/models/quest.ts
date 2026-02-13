import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { SKILL_CATEGORIES } from "./skill";

const questSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    skillCategory: { type: String, enum: SKILL_CATEGORIES, required: true },
    xpReward: { type: Number, default: 15 },
    schedule: {
      type: { type: String, enum: ["daily", "weekdays", "custom"], default: "daily" },
      days: [{ type: Number }], // 0=Sun, 1=Mon, ..., 6=Sat
    },
    streak: {
      current: { type: Number, default: 0 },
      best: { type: Number, default: 0 },
      lastCompleted: { type: Date, default: null },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

questSchema.index({ userId: 1, isActive: 1 });

export type IQuest = InferSchemaType<typeof questSchema>;
export const Quest = mongoose.models.Quest || mongoose.model("Quest", questSchema);
