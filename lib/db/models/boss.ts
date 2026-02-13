import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { SKILL_CATEGORIES } from "./skill";

const bossSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    skillCategory: { type: String, enum: SKILL_CATEGORIES, required: true },
    duration: { type: Number, default: 30 }, // days
    dailyTask: { type: String, required: true },
    xpReward: { type: Number, default: 500 },
    startDate: { type: Date, required: true },
    progress: [
      {
        date: { type: Date, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    status: {
      type: String,
      enum: ["active", "completed", "failed"],
      default: "active",
    },
  },
  { timestamps: true }
);

bossSchema.index({ userId: 1, status: 1 });

export type IBoss = InferSchemaType<typeof bossSchema>;
export const Boss = mongoose.models.Boss || mongoose.model("Boss", bossSchema);
