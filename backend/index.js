const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db.config.js');
const cron = require("node-cron");
const authRoutes = require('./routes/auth.Routes.js');
const userRoutes = require('./routes/user.Routes.js');
const groupRoutes = require('./routes/group.Routes.js');
const globalRoutes = require('./routes/global.Routes.js');
const notificationRoutes = require('./routes/notification.routes.js')
const versionRoutes = require('./routes/version.routes.js');
const sendReminderNotifications = require('./utils/reminderNotifier.js');
dotenv.config();
connectDB();

const app = express();
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
cron.schedule(
 "*/10 * * * *",
  async () => {
    console.log("🔔 Morning Reminder: 7:00 AM IST");
    await sendReminderNotifications();
  },
  {
    timezone: "Asia/Kolkata",
  }
);

cron.schedule(
  "*/10 * * * *",
  async () => {
    console.log("🌙 Evening Reminder: 10:00 PM IST");
    await sendReminderNotifications();
  },
  {
    timezone: "Asia/Kolkata",
  }
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/global', globalRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/version', versionRoutes);
// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Global Error:", err.stack);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Something went wrong!",
    });
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err,res) => {
    console.error('Unhandled Rejection:', err.message);
    // Optionally: log, alert, or exit process
  });
  
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
