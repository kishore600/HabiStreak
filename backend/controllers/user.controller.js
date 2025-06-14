const User = require("../models/user.Model");
const asyncHandler = require("express-async-handler");
const generateToken = require("../utils/generateToken.utils.js");
const { dataUri } = require("../middleware/upload.middleware.js");
const { cloudinary } = require("../config/cloudnari.config.js");
const { default: mongoose } = require("mongoose");
const hobbies_enum = require("../constant.js");
const Group = require("../models/group.model.js");
const { sendNotificationToTokens } = require("../services/fcmSender.js");
const sendEmail = require("../config/sendMail.config.js");

const getUserProfile = async (req, res) => {
  try {
    // Determine userId based on the presence of req.params.id and req.user
    let userId;
    if (req?.params?.id) {
      // If id is in params, use that
      userId = req.params.id;
    } else if (req.user?._id) {
      // If id is not in params but user is authenticated, use req.user._id
      userId = req.user._id;
    } else {
      // If neither, return an error response
      return res.status(400).json({ message: "User ID is required" });
    }

    console.log(userId); // Debugging to ensure we have the correct userId

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Find user by userId
    const user = await User.findById(userId)
      .select("-password -pendingRequest")
      .populate("followers", "name email image")
      .populate("following", "name email image")
      .populate("createdGroups");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserProfile1 = async (req, res) => {
  try {
    // Determine userId based on the presence of req.params.id and req.user
    let userId;
    if (req.user?._id) {
      // If id is not in params but user is authenticated, use req.user._id
      userId = req.user._id;
    } else {
      // If neither, return an error response
      return res.status(400).json({ message: "User ID is required" });
    }

    console.log(userId); // Debugging to ensure we have the correct userId

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Find user by userId
    const user = await User.findById(userId)
      .select("-password")
      .populate("followers", "name email image")
      .populate("following", "name email image")
      .populate({
        path: "pendingRequest",
        populate: {
          path: "user",
          select: "name email image _id",
        },
      })
      .populate("createdGroups");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const sendFollowRequest = asyncHandler(async (req, res) => {
  const { targetUserId } = req.body;
  const requestingUserId = req.user._id;

  if (targetUserId.toString() === requestingUserId.toString()) {
    res.status(400);
    throw new Error("You cannot follow yourself");
  }

  const targetUser = await User.findById(targetUserId);
  const requestingUser = await User.findById(requestingUserId);

  if (!targetUser || !requestingUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const alreadyFollowing = targetUser.followers.includes(requestingUserId);
  const alreadyRequested = targetUser.pendingRequest.some(
    (r) => r.user.toString() === requestingUserId.toString()
  );

  if (alreadyFollowing || alreadyRequested) {
    return res.status(400).json({ message: "Already following or requested" });
  }

  if (targetUser) {
    // Send follow request
    targetUser.pendingRequest.push({
      user: requestingUserId,
      receiver: targetUserId,
    });
    requestingUser.following.push(targetUserId);
    targetUser.followers.push(requestingUserId)
    await Promise.all([targetUser.save(), requestingUser.save()]);
    if (targetUser?.fcmToken) {
      const title = "New Follow Request";
      const body = `${requestingUser.name} wants to follow you.`;

      try {
        await sendNotificationToTokens([targetUser.fcmToken], title, body);
        console.log("✅ Notification sent to target user.");
      } catch (err) {
        console.error(
          "❌ Failed to send follow request notification:",
          err.message
        );
      }
    }

    return res.status(200).json({ message: "Followed successfully" });
  }
});

const unfollowUser = asyncHandler(async (req, res) => {
  const { targetUserId } = req.body;
  const requestingUserId = req.user._id;
console.log(requestingUserId)
  const targetUser = await User.findById(targetUserId);
  const requestingUser = await User.findById(requestingUserId);

  if (!targetUser || !requestingUser) {
    res.status(404);
    throw new Error("User not found");
  }
  // ✅ Remove requester from target user's followers
  targetUser.followers = targetUser.followers.filter(
    (id) => id.toString() !== requestingUserId.toString()
  );
console.log(requestingUser.followers)

  // ✅ Remove target from requester's following
  requestingUser.following = requestingUser.following.filter(
    (id) => id.toString() !== targetUserId.toString()
  );
 targetUser.pendingRequest = targetUser.pendingRequest.filter(
    (req) => req.user.toString() !== requestingUserId.toString()
  );
  await Promise.all([targetUser.save(), requestingUser.save()]);

  res.status(200).json({ message: "Unfollowed successfully" });
});

const getPendingRequests = asyncHandler(async (req, res) => {
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

const handleFollowRequest = asyncHandler(async (req, res) => {
  const { requesterId, action } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId);
  const requestingUserIndex = user.pendingRequest.findIndex(
    (request) => request.user.toString() === requesterId.toString()
  );

  if (requestingUserIndex === -1) {
    res.status(404);
    throw new Error("Follow request not found");
  }

  const { user: requestingUserId } = user.pendingRequest[requestingUserIndex];

  if (action === "accept") {
    user.pendingRequest.splice(requestingUserIndex, 1);

    const requestingUser = await User.findById(requestingUserId);
    user.following.push(requestingUser._id);

    if (requestingUser.followers.includes(user._id)) {
      return res
        .status(400)
        .json({ message: "You are already following this user" });
    }

    requestingUser.followers.push(user._id);
 if (requestingUser?.fcmToken) {
      const title = "Follow Request Accepted";
      const body = `${user.name} accepted your follow request.`;

      try {
        await sendNotificationToTokens([requestingUser.fcmToken], title, body);
        console.log("✅ Notification sent to requesting user.");
      } catch (err) {
        console.error("❌ Failed to send notification:", err.message);
      }
    }
    await Promise.all([user.save(), requestingUser.save()]);

   

    res.status(200).json({ message: "Follow request accepted" });
  } else if (action === "reject") {
    user.pendingRequest.splice(requestingUserIndex, 1);
    await user.save();

    res.status(200).json({ message: "Follow request rejected" });
  }
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  if (req.body.hobbies && Array.isArray(req.body.hobbies)) {
    const invalidHobbies = req.body.hobbies.filter(
      (hobby) => !hobbies_enum.includes(hobby)
    );

    if (invalidHobbies.length > 0) {
      return res.status(400).json({
        message: "Invalid hobbies provided",
        invalidHobbies,
      });
    }

    user.hobbies = req.body.hobbies;
  }
  try {
    if (req.file) {
      const file = dataUri(req).content;
      console.log(req.file);

      if (user.image) {
        const publicId = user.image.split("/").slice(-1)[0].split(".")[0];
        console.log(publicId);
        await cloudinary.uploader.destroy(`uploads/${publicId}`);
      }

      const result = await cloudinary.uploader.upload(file, {
        folder: "uploads",
        transformation: { width: 500, height: 500, crop: "limit" },
      });

      user.image = result.secure_url;
    }

    if (req.body.password && req.body.password.length > 1) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    const populatedUser = await User.findById(updatedUser._id)
      .populate("followers", "name email image")
      .populate("following", "name email image");

    res.json({
      message: "Profile updated successfully",
      updatedUser: populatedUser,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
});

const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user._id.toString(); // assuming you use middleware like 'protect' to attach the user
    const type = req.body.type || "daily";
    console.log(type);
    const formatMap = {
      daily: "%Y-%m-%d",
      weekly: "%Y-%U",
      monthly: "%Y-%m",
      yearly: "%Y",
    };

    if (!formatMap[type]) {
      return res.status(400).json({
        message: "Invalid type. Use daily, weekly, monthly, or yearly.",
      });
    }

    const data = await Group.aggregate([
      {
        $project: {
          completedDates: 1,
        },
      },
      {
        $unwind: "$completedDates",
      },
      {
        $match: {
          completedDates: { $regex: `^${userId}_` },
        },
      },
      {
        $project: {
          dateString: {
            $arrayElemAt: [{ $split: ["$completedDates", "_"] }, 1],
          },
        },
      },
      {
        $addFields: {
          completedDate: {
            $dateFromString: {
              dateString: "$dateString",
            },
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: formatMap[type],
              date: "$completedDate",
            },
          },
          completedCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

const updateFmcToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const userId = req.user_id;

  await User.findByIdAndUpdate(userId, {
    fcmToken: token,
  });
});

const deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    return res
      .status(500)
      .json({ message: "Server error while deleting account" });
  }
};


module.exports = {
  getUserProfile,
  sendFollowRequest,
  unfollowUser,
  getPendingRequests,
  handleFollowRequest,
  updateUserProfile,
  getUserProfile1,
  getUserAnalytics,
  updateFmcToken,
  deleteUserAccount,
};
