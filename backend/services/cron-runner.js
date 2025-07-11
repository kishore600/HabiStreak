const mongoose = require("mongoose");
const dotenv = require("dotenv");
const moment = require("moment-timezone");

const sendReminderNotifications = require("../utils/reminderNotifier.js");
const { sendNotificationToTokens } = require("./fcmSender.js");

const User = require("../models/user.Model.js");
const Group = require("../models/group.model.js");

dotenv.config();

mongoose.set("strictQuery", false);

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
}

// ---------------------- JOB 1: Reminder Notifications ----------------------
async function runReminderJob() {
  try {
    console.log("🔔 Running reminder notifications...");
    await sendReminderNotifications();
  } catch (err) {
    console.error("❌ Error sending task reminders:", err.message);
  }
}

// ---------------------- JOB 2: Weekly Reset (Sunday 11 PM per user) ----------------------
async function runWeeklyResetJob() {
  const nowUtc = moment.utc();
  if (nowUtc.minute() === 0) {
    console.log("🔁 Weekly reset scan...");

    try {
      const users = await User.find();

      for (const user of users) {
        if (!user.timezone) continue;

        const userNow = moment().tz(user.timezone);
        const day = userNow.day(); // 0 = Sunday
        const hour = userNow.hour();

        const formattedTime = userNow.format("YYYY-MM-DD HH:mm:ss");
        console.log(`🧭 ${user.name}'s time (${user.timezone}): ${formattedTime}`);

        if (day === 0 && hour === 23) {
          console.log(`🔄 Resetting stats for ${user.name}`);

          const resetStats = {
            mon: { rest: false },
            tue: { rest: false },
            wed: { rest: false },
            thu: { rest: false },
            fri: { rest: false },
            sat: { rest: false },
            sun: { rest: false },
          };

          if (user.weeklyOption) {
            if (!user.weeklyOption.weekdays) {
              resetStats.mon.rest = true;
              resetStats.tue.rest = true;
              resetStats.wed.rest = true;
              resetStats.thu.rest = true;
              resetStats.fri.rest = true;
            }
            if (!user.weeklyOption.weekend) {
              resetStats.sat.rest = true;
              resetStats.sun.rest = true;
            }
          }

          user.weeklyStats = resetStats;
          await user.save();
          console.log(`✅ Weekly stats reset for ${user.name}`);
        }
      }
    } catch (err) {
      console.error("❌ Error in weekly reset:", err.message);
    }
  }
}

// ---------------------- JOB 3: Streak Deduction ----------------------
async function runStreakDeductionJob() {
  const now = moment.utc();
  if (now.minute() % 15 === 0) {
    console.log("🕒 Running streak deduction job...");

    try {
      const groups = await Group.find({}).populate("todo");

      for (const group of groups) {
        const todo = group.todo;
        if (!todo) continue;

        for (const memberId of group.members) {
          const user = await User.findById(memberId);
          if (!user || !user.timezone) continue;

          const userNow = now.clone().tz(user.timezone);
          if (userNow.hour() !== 23) continue;

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
}

// ---------------------- Main Runner ----------------------
(async () => {
  await connectDB();

  await Promise.all([
    runReminderJob(),
    runWeeklyResetJob(),
    runStreakDeductionJob(),
  ]);

  mongoose.connection.close(() => {
    console.log("🔌 MongoDB connection closed.");
    process.exit(0);
  });
})();
