import User from '../models/user.Model.js';
import asyncHandler from 'express-async-handler'

export const getUserProfile = (req, res) => {
    res.send(`Get user profile for ID: ${req.params.id}`);
  };

export const sendFollowRequest = asyncHandler(async (req, res) => {
    const { targetUserId } = req.body;
    const requestingUserId = req.user._id;
  
    if (requestingUserId.toString() === targetUserId.toString()) {
      res.status(400);
      throw new Error("Cannot follow yourself");
    }
  
    const targetUser = await User.findById(targetUserId);
    const requestingUser = await User.findById(requestingUserId);
  
    if (!targetUser) {
      res.status(404);
      throw new Error("User not found");
    }
  
    if (targetUser.followers.includes(requestingUserId)) {
      res.status(400);
      throw new Error("Already following this user");
    }
  
    if (requestingUser.followers.includes(targetUserId)) {
      res.status(400);
      throw new Error("Already sent follow request");
    }
  
    if (
      targetUser.pendingRequest.some(
        (req) => req.user.toString() === requestingUserId.toString()
      )
    ) {
      res.status(400);
      throw new Error("Follow request already sent");
    }
  
    const pendingRequests = {
      user: requestingUserId,
      receiver: targetUserId,
      status: "pending",
    };
    requestingUser.following.push(targetUserId);
    targetUser.followers.push(requestingUserId);
    targetUser.pendingRequest.push(pendingRequests);
    await targetUser.save();
    await requestingUser.save();
  
    res.status(200).json({ message: "Follow request sent" });
});
  
export const unfollowUser = asyncHandler(async (req, res) => {
    const { targetUserId } = req.body;
    const requestingUserId = req.user._id;
  
    const targetUser = await User.findById(targetUserId);
    const requestingUser = await User.findById(requestingUserId);
  
    if (!targetUser) {
      res.status(404);
      throw new Error("Target user not found");
    }
  
    if (!requestingUser) {
      res.status(404);
      throw new Error("Requesting user not found");
    }
  
    // if (!targetUser.followers.includes(requestingUserId)) {
    //   res.status(400);
    //   throw new Error("You are not following this user");
    // }
  
    targetUser.followers = targetUser.followers.filter(
      (userId) => userId.toString() !== requestingUserId.toString()
    );
    targetUser.pendingRequest.splice(targetUserId, 1);
  
    requestingUser.following = requestingUser.following.filter(
      (userId) => userId.toString() !== targetUserId.toString()
    );
  
    await Promise.all([targetUser.save(), requestingUser.save()]);
  
    res.status(200).json({ message: "Successfully unfollowed the user" });
});
  
export const getPendingRequests = asyncHandler(async (req, res) => {
    const userId = req.user._id;
  
    try {
      const user = await User.findById(userId)
        .populate({
          path: "pendingRequest.user",
          select: "name email image",
        })
        .populate({
          path: "pendingRequest.receiver",
          select: "name email image",
        });
  
      res.status(200).json(user.pendingRequest);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
});

export const handleFollowRequest = asyncHandler(async (req, res) => {
  const { requestId, status } = req.body;
  const userId = req.user._id;

  if (!["accepted", "rejected"].includes(status)) {
    res.status(400);
    throw new Error(`Invalid status ${status}`);
  }

  const user = await User.findById(userId);
  const requestingUserIndex = user.pendingRequest.findIndex(
    (request) => request.user.toString() === requestId.toString()
  );

  if (requestingUserIndex === -1) {
    res.status(404);
    throw new Error("Follow request not found");
  }

  const { user: requestingUserId } = user.pendingRequest[requestingUserIndex];

  if (status === "accepted") {
    user.pendingRequest.splice(requestingUserIndex, 1);

    const requestingUser = await User.findById(requestingUserId);
    user.following.push(requestingUser._id);

    if (requestingUser.followers.includes(user._id)) {
      return res
        .status(400)
        .json({ message: "You are already following this user" });
    }

    requestingUser.followers.push(user._id);

    await Promise.all([user.save(), requestingUser.save()]);

    res.status(200).json({ message: "Follow request accepted" });
  } else if (status === "rejected") {
    user.pendingRequest.splice(requestingUserIndex, 1);
    await user.save();

    res.status(200).json({ message: "Follow request rejected" });
  }
});