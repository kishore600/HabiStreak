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
  "59 23 * * 0",
  async () => {
    console.log("🔄 Weekly reset at Sunday 11:59 PM");

    const users = await User.find();

    for (const user of users) {
      // Reset weeklyStats based on weeklyOption
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
    }

    console.log("✅ Weekly stats reset completed.");
  },
  {
    timezone: "Asia/Kolkata",
  }
);

const deductStreak = async ({
  user,
  group,
  userId,
  todayTasks,
  userDateKey,
  currentDayKey,
}) => {
  let userStreak = user.totalStreak || 0;

  // 1. Prevent duplicate deduction: track if already deducted
  if (group.streakDeductedDates?.includes(userDateKey)) {
    console.log(
      `⚠️ Already deducted streak for user ${userId} on ${userDateKey}`
    );
    return { userStreak };
  }

  // 2. Decrease streak count
  if (userStreak > 0) {
    userStreak -= 1;
    user.totalStreak = userStreak;

    // Optional: Update user's lastStreakDate
    user.lastStreakDate = new Date();

    await user.save();
  }

  // 3. Update group to track streak deduction
  group.streakDeductedDates = group.streakDeductedDates || [];
  group.streakDeductedDates.push(userDateKey);

  // 4. Optionally track per-user streak if using group.userStreaks
  group.userStreaks = group.userStreaks || {};
  group.userStreaks[userId] = userStreak;

  console.log(`❌ Streak deducted for ${user.name} in group "${group.title}"`);

  return { userStreak };
};

//dedcut streak from user

async function runStreakDeductionJob() {
  const groups = await Group.find({}).populate("todo");

  for (const group of groups) {
    const todo = group.todo;
    if (!todo) continue;

    const today = new Date().toISOString().slice(0, 10);

    for (const memberId of group.members) {
      const userId = memberId.toString();
      const user = await User.findById(userId);
      if (!user || !user.timezone) continue;

      // 🕐 Get user local hour (24hr format)
      const userHour = moment().tz(user.timezone).hour();

      // ✅ Proceed only if it's 23:00 (11 PM) in user's local time
      if (userHour !== 23) continue;

      const userDateKey = `${userId}_${today}`;
      if (group.streakDeductedDates.includes(userDateKey)) continue; // already deducted

      // Get weekday in user's timezone
      const currentDayShort = moment().tz(user.timezone).format("ddd");
      const todayTasks = todo.tasks.filter((t) =>
        t.days.includes(currentDayShort)
      );

      const alreadyCompleted = todayTasks.every((task) =>
        task.completedBy.some((c) => c.userDateKey === userDateKey)
      );

      if (!alreadyCompleted) {
        // 🧨 Deduct user total streak
        user.totalStreak = Math.max(0, (user.totalStreak || 0) - 1);
        await user.save();

        // 🧨 Deduct from group userStreaks
        const currentGroupStreak = group.userStreaks?.[userId] || 0;
        group.userStreaks[userId] = Math.max(0, currentGroupStreak - 1);

        // 🧩 Track deduction to prevent repeating
        group.streakDeductedDates.push(userDateKey);

        // 📣 Send notification
        if (user.fcmToken) {
          try {
            const title = "⛔️ Streak Deducted!";
            const body = `Your streak in group "${group.title}" has been reduced. Stay consistent!`;
            await sendNotificationToTokens([user.fcmToken], title, body, {
              groupId: group._id.toString(),
              type: "groupReminder",
            });

            console.log(`📣 Notified ${user.name} for streak deduction.`);
          } catch (err) {
            console.error("❌ Error sending notification:", err.message);
          }
        }
      }
    }

    await group.save(); // Save after processing all users
  }
}


cron.schedule(
  "0 23 * * *",
  async () => {
    console.log("⏰ Running streak deduction job at 11 PM IST");
    try {
      await runStreakDeductionJob();
    } catch (err) {
      console.error("❌ Error in streak deduction job:", err);
    }
  },
  {
    timezone: "Asia/Kolkata",
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
