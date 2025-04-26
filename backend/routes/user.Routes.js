
import express from 'express';
import { getPendingRequests, getUserProfile, handleFollowRequest, sendFollowRequest, unfollowUser } from '../controllers/user.controller.js';
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get('/:id', getUserProfile);

router.route("/follow").post(protect, sendFollowRequest);

router.route("/unfollow").post(protect, unfollowUser);

router.route("/pending/request").get(protect, getPendingRequests);

router.route("/follow/handle").post(protect, handleFollowRequest);


export default router;