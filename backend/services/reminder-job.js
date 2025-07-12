const mongoose = require("mongoose");
const dotenv = require("dotenv");
const sendReminderNotifications = require("../utils/reminderNotifier.js");

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

async function runReminderJob() {
  try {
    console.log("🔔 Running reminder notifications...");
    await sendReminderNotifications();
  } catch (err) {
    console.error("❌ Error sending reminders:", err.message);
  }
}

(async () => {
  await connectDB();
  await runReminderJob();
  await mongoose.connection.close();
  console.log("🔌 MongoDB connection closed.");
  process.exit(0);
})();
