import mongoose, { Schema, type InferSchemaType } from "mongoose";

const achievementSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  key: { type: String, required: true }, // e.g. "streak_7", "level_10", "boss_first"
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now },
});

achievementSchema.index({ userId: 1, key: 1 }, { unique: true });

export type IAchievement = InferSchemaType<typeof achievementSchema>;
export const Achievement =
  mongoose.models.Achievement ||
  mongoose.model("Achievement", achievementSchema);
