const express = require('express');
const { getPendingRequests, getUserProfile, handleFollowRequest, sendFollowRequest, unfollowUser,updateUserProfile } = require('../controllers/user.controller.js');
const { protect, admin } = require("../middleware/auth.middleware.js");
const { upload } = require('../middleware/upload.middleware.js');

const router = express.Router();

router.get('/:id', getUserProfile);

router.route("/follow").post(protect, sendFollowRequest);

router.route("/unfollow").post(protect, unfollowUser);

router.route("/pending/request").get(protect, getPendingRequests);

router.route("/follow/handle").post(protect, handleFollowRequest);

router.route("/profile").get(protect, getUserProfile).put(protect, upload.single("image"), updateUserProfile);

module.exports = router;
