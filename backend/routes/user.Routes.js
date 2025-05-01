const express = require('express');
const { getPendingRequests, getUserProfile, handleFollowRequest, sendFollowRequest, unfollowUser,updateUserProfile,getUserProfile1 } = require('../controllers/user.controller.js');
const { protect, admin } = require("../middleware/auth.middleware.js");
const multer = require('multer');
const storage = multer.memoryStorage(); // recommended for Cloudinary
const upload = multer({ storage });

const router = express.Router();

router.route('/:id').get(protect,getUserProfile);

router.route('/user/profile').get(protect,getUserProfile1);

router.route("/follow").post(protect, sendFollowRequest);

router.route("/unfollow").post(protect, unfollowUser);

router.route("/pending/request").get(protect, getPendingRequests);

router.route("/follow/handle").post(protect, handleFollowRequest);

router.route("/profile").put(protect, upload.single("image"), updateUserProfile);

module.exports = router;
