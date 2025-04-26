
import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  title: String,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  goal: String,
  streak: { type: Number, default: 0 },
  todo:{
    type:mongoose.Schema.Types.ObjectId,ref:'Todo'
  },
  userStreaks: {
    type: Map,
    of: Number,
    default: {},
  },
  completedDates: {
    type: [String],
    default: [],
  },
});

export default mongoose.model('Group', groupSchema);