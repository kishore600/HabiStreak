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
dotenv.config();
connectDB();

const app = express();
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

//ever 4hrs reminder
cron.schedule(
  "0 */4 * * *", // every 4 hours at 0 minutes
  async () => {
    console.log("🔔 Reminder triggered at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
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

//dedcut streak from user
cron.schedule(
  '55 23 * * *', // 11:55 PM IST
  async () => {
    console.log('⏰ Running daily streak deduction job at 11:55 PM IST');

    const groups = await Group.find({}).populate('todo');

    for (const group of groups) {
      const todo = group.todo;
      if (!todo) continue;

      const currentDayShort = new Date().toLocaleString('en-US', {
        weekday: 'short',
        timeZone: 'Asia/Kolkata',
      });

      const weekdayMap = {
        Sun: 'sun',
        Mon: 'mon',
        Tue: 'tue',
        Wed: 'wed',
        Thu: 'thu',
        Fri: 'fri',
        Sat: 'sat',
      };

      const currentDayKey = weekdayMap[currentDayShort];
      const todayTasks = todo.tasks.filter((t) => t.days.includes(currentDayShort));
      const today = new Date().toISOString().slice(0, 10);

      for (const memberId of group.members) {
        const userId = memberId.toString();
        const userDateKey = `${userId}_${today}`;
        const user = await User.findById(userId);
        if (!user) continue;

        // Check if user already completed all today’s tasks
        const alreadyCompleted = todayTasks.every((task) =>
          task.completedBy.some((c) => c.userDateKey === userDateKey)
        );

        if (!alreadyCompleted) {
          const result = await deductStreak({
            user,
            group,
            userId,
            todayTasks,
            userDateKey,
            currentDayKey,
          });

          // Send FCM Notification
          if ((user.totalStreak || 0) === result.userStreak && user.fcmToken) {
            try {
              const title = '⛔️ Streak Deducted!';
              const body = `Your streak in group "${group.title}" has been reduced. Stay consistent!`;
              await sendNotificationToTokens([user.fcmToken], title, body);
              console.log(`📣 Notified ${user.name} for streak deduction.`);
            } catch (error) {
              console.error('❌ Error sending FCM notification:', error.message);
            }
          }
        }
      }

      await group.save(); // Save final group streak changes
    }
  },
  {
    timezone: 'Asia/Kolkata',
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
