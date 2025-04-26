
import mongoose from 'mongoose';

const todoCompletionSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: String, // Format: YYYY-MM-DD
  completed: Boolean,
});

export default mongoose.model('TodoCompletion', todoCompletionSchema);