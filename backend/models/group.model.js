const mongoose = require("mongoose");
const hobbies_enum = require("../constant");

const groupSchema = new mongoose.Schema({
  title: String,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  goal: String,
  streak: { type: Number, default: 0 },
  todo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Todo",
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
  banner: {
  type: String,
  default:'https://www.toyoindia.in/wp-content/uploads/Image-Contact-1.jpg',
},
  createdDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: false },
  joinRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  streakDeductedDates: {
    type: [String], // Store dates as 'YYYY-MM-DD'
    default: [],
  },
  categories: [
    {
      type: String,
      enum: hobbies_enum,
      required: true,
    },
  ],
});

module.exports = mongoose.model("Group", groupSchema);
