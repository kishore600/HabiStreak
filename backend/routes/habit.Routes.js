
import express from 'express';
import { createHabit, getUserHabits } from '../controllers/habit.controller.js';
const router = express.Router();

router.post('/', createHabit);
router.get('/:userId', getUserHabits);

export default router;
