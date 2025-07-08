const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db.config.js");
const cron = require("node-cron");
const authRoutes = require("./routes/auth.Routes.js");
const userRoutes = require("./routes/user.Routes.js");
const groupRoutes = require("./routes/group.Routes.js");
const globalRoutes = require("./routes/global.Routes.js");
const notificationRoutes = require("./routes/notification.routes.js");
const versionRoutes = require("./routes/version.routes.js");
const sendReminderNotifications = require("./utils/reminderNotifier.js");
const Group = require("./models/group.model.js");
const moment = require("moment-timezone");
const User = require("./models/user.Model.js");
const { sendNotificationToTokens } = require("./services/fcmSender.js");

dotenv.config();
connectDB();

const app = express();
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

cron.schedule(
  "0 */2 * * *", // every 2 hours at minute 0
  async () => {
    console.log("⏰ 2-hour streak reminder job running");
    await sendReminderNotifications();
  },
  {
    timezone: "Asia/Kolkata",
  }
);

//weekly reset
cron.schedule(
  "0 * * * *", // Every hour at minute 0
  async () => {
    console.log("🕒 Running hourly timezone-aware weekly reset check...");

    try {
      const users = await User.find();

      for (const user of users) {
        if (!user.timezone) continue;

        const userNow = moment().tz(user.timezone);
        const day = userNow.day(); // 0 = Sunday
        const hour = userNow.hour(); // 0 to 23

        const formattedTime = userNow.format("YYYY-MM-DD HH:mm:ss");
        console.log(
          `🧭 ${user.name}'s time (${user.timezone}): ${formattedTime}`
        );

        // ✅ Check if it's exactly Sunday at 11:00 PM
        if (day === 0 && hour === 23) {
          console.log(`🔄 Weekly reset triggered for ${user.name}`);

          // Reset weeklyStats
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
      console.error("❌ Error in weekly reset job:", err.message);
    }
  },
  {
    timezone: "UTC", // Keep this UTC, moment-timezone adjusts per user
  }
);

async function runStreakDeductionJob() {
  const groups = await Group.find({}).populate("todo");
  const utcNow = moment.utc();

  for (const group of groups) {
    const todo = group.todo;
    if (!todo) continue;

    for (const memberId of group.members) {
      const userId = memberId.toString();
      const user = await User.findById(userId);
      if (!user || !user.timezone) continue;

      // Get user's local time
      const userNow = utcNow.clone().tz(user.timezone);
      const userHour = userNow.hour();
      const today = userNow.format("YYYY-MM-DD");
      const currentDayShort = userNow.format("ddd");

      if (userHour !== 23) continue; // only run if it's 11PM in user's time

      const userDateKey = `${userId}_${today}`;
      if (group.streakDeductedDates.includes(userDateKey)) continue;

      const todayTasks = todo.tasks.filter((t) =>
        t.days.includes(currentDayShort)
      );

      const alreadyCompleted = todayTasks.every((task) =>
        task.completedBy.some((c) => c.userDateKey === userDateKey)
      );

      if (!alreadyCompleted) {
        // Deduct user streak
        user.totalStreak = Math.max(0, (user.totalStreak || 0) - 1);
        await user.save();
        console.log(group.userStreaks);
        // Deduct group streak
        const userIdStr = userId.toString();

        const groupStreak = group.userStreaks.get(userIdStr) || 0;
        group.userStreaks.set(userIdStr, Math.max(0, groupStreak - 1));

        group.streakDeductedDates.push(userDateKey);

        await group.save();

        // Send notification
        if (user.fcmToken) {
          try {
            const title = "⛔️ Streak Deducted!";
            const body = `Your streak in group "${group.title}" has been reduced. Stay consistent!`;
            await sendNotificationToTokens([user.fcmToken], title, body, {
              Id: group._id.toString(),
              type: "groupReminder",
            });
            console.log(`📣 Notified ${user.name} for streak deduction.`);
          } catch (err) {
            console.error("❌ Notification error:", err.message);
          }
        }
      }
    }

  }
}

cron.schedule(
  "*/15 * * * *", // every 15 minutes
  async () => {
    console.log("🕒 Running streak deduction job by user timezones...");
    try {
      await runStreakDeductionJob();
    } catch (err) {
      console.error("❌ Error in streak deduction job:", err);
    }
  },
  {
    timezone: "UTC", // leave this in UTC since you're using moment-timezone per user
  }
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/global", globalRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/version", versionRoutes);
// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong!",
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, res) => {
  console.error("Unhandled Rejection:", err.message);
  // Optionally: log, alert, or exit process
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
