const express = require('express');
const router = express.Router();
const { notifyTaskComplete } = require('../controllers/notification.controller');

router.post('/notify-task-complete', notifyTaskComplete);

module.exports = router;