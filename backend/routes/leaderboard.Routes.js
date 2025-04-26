const express = require('express');
const { getLeaderboard } = require('../controllers/leaderboard.controller.js');

const router = express.Router();

router.get('/:groupId', getLeaderboard);

module.exports = router;
