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
dotenv.config();
connectDB();

const app = express();
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

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
  


  // Runs every day at 1:00 AM
cron.schedule("0 1 * * *", async () => {
  const now = new Date();

  const expiredGroups = await Group.find({ endDate: { $lt: now } });

  for (const group of expiredGroups) {
    // Remove group ID from users
    await User.updateMany(
      { joinedGroups: group._id },
      { $pull: { joinedGroups: group._id } }
    );

    // Delete linked todo
    await Todo.findByIdAndDelete(group.todo);

    // Delete group
    await Group.findByIdAndDelete(group._id);

    console.log(`Deleted expired group: ${group.title}`);
  }
});
  
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
