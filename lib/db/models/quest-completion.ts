import mongoose, { Schema, type InferSchemaType } from "mongoose";

const questCompletionSchema = new Schema({
  questId: { type: Schema.Types.ObjectId, ref: "Quest", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  xpEarned: { type: Number, required: true },
});

questCompletionSchema.index({ userId: 1, date: -1 });
questCompletionSchema.index({ questId: 1, date: -1 });

export type IQuestCompletion = InferSchemaType<typeof questCompletionSchema>;
export const QuestCompletion =
  mongoose.models.QuestCompletion ||
  mongoose.model("QuestCompletion", questCompletionSchema);
