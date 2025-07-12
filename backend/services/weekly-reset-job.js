const mongoose = require("mongoose");
const dotenv = require("dotenv");
const moment = require("moment-timezone");

const User = require("../models/user.Model.js");

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

async function runWeeklyResetJob() {
  console.log("🔁 Weekly reset scan...");

  try {
    const users = await User.find();

    for (const user of users) {
      if (!user.timezone) continue;

      const userNow = moment().tz(user.timezone);
      const day = userNow.day(); // 0 = Sunday
      const hour = userNow.hour();

      if (day === 0 && hour === 23) {
        const formattedTime = userNow.format("YYYY-MM-DD HH:mm:ss");
        console.log(`🧭 ${user.name}'s time (${user.timezone}): ${formattedTime}`);
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

(async () => {
  await connectDB();
  await runWeeklyResetJob();
  await mongoose.connection.close();
  console.log("🔌 MongoDB connection closed.");
  process.exit(0);
})();
