import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { SKILL_CATEGORIES } from "./skill";

const missionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    skillCategory: { type: String, enum: SKILL_CATEGORIES, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "epic"],
      default: "medium",
    },
    xpReward: { type: Number, required: true },
    deadline: { type: Date, default: null },
    subtasks: [
      {
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    status: {
      type: String,
      enum: ["active", "completed", "failed"],
      default: "active",
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

missionSchema.index({ userId: 1, status: 1 });

export type IMission = InferSchemaType<typeof missionSchema>;
export const Mission =
  mongoose.models.Mission || mongoose.model("Mission", missionSchema);
