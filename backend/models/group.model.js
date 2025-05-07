const mongoose = require('mongoose');
const hobbies_enum = require('../constant');

const groupSchema = new mongoose.Schema({
  title: String,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  goal: String,
  streak: { type: Number, default: 0 },
  todo: {
    type: mongoose.Schema.Types.ObjectId, ref: 'Todo'
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
  image: { type: String, required: true },
  createdDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: false },

  categories: [{
    type: String,
    enum: hobbies_enum,
    required: true,
  }],
});

module.exports = mongoose.model('Group', groupSchema);
