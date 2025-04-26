const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db.config.js');

const authRoutes = require('./routes/auth.Routes.js');
const userRoutes = require('./routes/user.Routes.js');
const habitRoutes = require('./routes/habit.Routes.js');
const groupRoutes = require('./routes/group.Routes.js');
const todoRoutes = require('./routes/todo.Routes.js');
const leaderboardRoutes = require('./routes/leaderboard.Routes.js');


dotenv.config();
connectDB();

const app = express();
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Global Error:", err.stack);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Something went wrong!",
    });
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err.message);
    // Optionally: log, alert, or exit process
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    // Optionally: log, alert, or exit process
  });

  
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
