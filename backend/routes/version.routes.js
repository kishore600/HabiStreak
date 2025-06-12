// routes/version.routes.js
const express = require('express');
const router = express.Router();
const { getLatestVersion } = require('../controllers/version.controller.js');

router.get('/latest-version', getLatestVersion);

module.exports = router;
