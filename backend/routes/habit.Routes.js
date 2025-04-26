const express = require('express');
const { createHabit, getUserHabits } = require('../controllers/habit.controller.js');

const router = express.Router();

router.post('/', createHabit);
router.get('/:userId', getUserHabits);

module.exports = router;
