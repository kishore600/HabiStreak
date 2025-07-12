const mongoose = require("mongoose");
const dotenv = require("dotenv");
const moment = require("moment-timezone");

const { sendNotificationToTokens } = require("./fcmSender.js");
const User = require("../models/user.Model.js");
const Group = require("../models/group.model.js");
const Todo = require("../models/todo.model.js");

dotenv.config();
mongoose.set("strictQuery", false);

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
}

async function runStreakDeductionJob() {
  const now = moment.utc();
  console.log("🕒 Running streak deduction job...");

  try {
    const groups = await Group.find({}).populate("todo");
    for (const group of groups) {
      console.log(group.todo,group)
      const todo = group.todo;
      if (!todo) continue;

      for (const memberId of group.members) {
        const user = await User.findById(memberId);
        if (!user || !user.timezone) continue;

        const userNow = now.clone().tz(user.timezone);
        const hour = userNow.hour();

        if (hour !== 23) continue;

        const today = userNow.format("YYYY-MM-DD");
        const userDateKey = `${user._id}_${today}`;
        const currentDayShort = userNow.format("ddd");

        if (group.streakDeductedDates.includes(userDateKey)) continue;

        const todayTasks = todo.tasks.filter(t => t.days.includes(currentDayShort));
        const allCompleted = todayTasks.every(task =>
          task.completedBy.some(c => c.userDateKey === userDateKey)
        );

        if (!allCompleted) {
          user.totalStreak = Math.max(0, (user.totalStreak || 0) - 1);
          await user.save();

          const userIdStr = user._id.toString();
          const groupStreak = group.userStreaks.get(userIdStr) || 0;
          group.userStreaks.set(userIdStr, Math.max(0, groupStreak - 1));

          group.streakDeductedDates.push(userDateKey);
          await group.save();

          if (user.fcmToken) {
            try {
              await sendNotificationToTokens(
                [user.fcmToken],
                "⛔️ Streak Deducted!",
                `Your streak in "${group.title}" has been reduced.`,
                {
                  Id: group._id.toString(),
                  type: "groupReminder",
                }
              );
              console.log(`📣 Notified ${user.name}`);
            } catch (err) {
              console.error("❌ Notification error:", err.message);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("❌ Error in streak deduction:", err.message);
  }
}

(async () => {
  await connectDB();
  await runStreakDeductionJob();
  await mongoose.connection.close();
  console.log("🔌 MongoDB connection closed.");
  process.exit(0);
})();
