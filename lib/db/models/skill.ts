import mongoose, { Schema, type InferSchemaType } from "mongoose";

// Re-export constants from the shared (client-safe) module
export { SKILL_CATEGORIES, SKILL_META, type SkillCategory } from "@/lib/skill-constants";
import { SKILL_CATEGORIES } from "@/lib/skill-constants";

const skillSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, enum: SKILL_CATEGORIES, required: true },
    xp: { type: Number, default: 0 },
  },
  { timestamps: true }
);

skillSchema.index({ userId: 1, category: 1 }, { unique: true });

export type ISkill = InferSchemaType<typeof skillSchema>;
export const Skill = mongoose.models.Skill || mongoose.model("Skill", skillSchema);
