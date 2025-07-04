const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { hobbies_enum } = require("../constant.js");

const pendingRequestSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "accepted", "rejected"],
    },
  },
  {
    timestamps: true,
  }
);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  image: {
    type: String,
    required: false,
  },
  password: String,
  hobbies: [
    {
      type: String,
      enum: hobbies_enum,
    },
  ],
  followedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ], // Can be removed if replaced
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createdGroups: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
  ],
  joinedGroups: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
  ],
  pendingRequest: [pendingRequestSchema],
  totalStreak: {
    type: Number,
    default: 0,
  },
  lastStreakDate: {
    type: Date,
  },
  fcmToken: {
    type: String,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpire: {
    type: Date,
  },
  joinRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
  ],
  timezone: {
    type: String,
    default: "Asia/Kolkata", // optional fallback
  },
  weeklyStats: {
    mon: {
      rest: {
        type: Boolean,
        default: false,
      },
    },
    tue: {
      rest: {
        type: Boolean,
        default: false,
      },
    },
    wed: {
      rest: {
        type: Boolean,
        default: false,
      },
    },
    thu: {
      rest: {
        type: Boolean,
        default: false,
      },
    },
    fri: {
      rest: {
        type: Boolean,
        default: false,
      },
    },
    sat: {
      rest: {
        type: Boolean,
        default: false,
      },
    },
    sun: {
      rest: {
        type: Boolean,
        default: false,
      },
    },
  },
  weeklyOption: {
    weekdays: {
      type: Boolean,
      default: false,
    },
    weekend: {
      type: Boolean,
      default: false,
    },
  },
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("User", userSchema);
