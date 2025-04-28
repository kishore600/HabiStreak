const express = require("express");
const router = express.Router();
const { searchUsersAndGroups } = require("../controllers/global.controller");

// Search Route
router.get("/search", searchUsersAndGroups);

module.exports = router;
