import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.config.js';

import authRoutes from './routes/auth.Routes.js';
import userRoutes from './routes/user.Routes.js';
import habitRoutes from './routes/habit.Routes.js';
import groupRoutes from './routes/group.Routes.js';
import todoRoutes from './routes/todo.Routes.js';
import leaderboardRoutes from './routes/leaderboard.Routes.js';

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
