const asyncHandler = require("express-async-handler");
const Group = require("../models/group.model");
const Todo = require("../models/todo.model");
const User = require("../models/user.Model");
const {
  dataUri,
  dataUriMultipleFiles,
} = require("../middleware/upload.middleware.js");
const { cloudinary } = require("../config/cloudnari.config.js");
const { default: mongoose } = require("mongoose");
const hobbies_enum = require("../constant.js");
const formatMap = {
  day: "%Y-%m-%d",
  week: "%Y-%U",
  month: "%Y-%m",
  year: "%Y",
};
const DataUriParser = require("datauri/parser");
const path = require("path");
const { sendNotificationToTokens } = require("../services/fcmSender.js");
const userModel = require("../models/user.Model");
const parser = new DataUriParser();
const dataUriFromFile = (file) =>
  parser.format(path.extname(file.originalname).toString(), file.buffer);

const createGroup = asyncHandler(async (req, res) => {
  try {
    const { title, members, goal, tasks, endDate, categories } = req.body;

    const userId = req.user._id;

    const existingGroup = await Group.findOne({ title });
    if (existingGroup) {
      return res
        .status(400)
        .json({ message: "Group with this title already exists." });
    }

    let parsedCategories = categories;
    if (typeof categories === "string") {
      try {
        parsedCategories = JSON.parse(categories);
      } catch (error) {
        console.error("Error parsing categories:", error.message);
        return res.status(400).json({ message: "Invalid categories format" });
      }
    }

    if (
      !Array.isArray(parsedCategories) ||
      parsedCategories.some((cat) => !hobbies_enum.includes(cat))
    ) {
      return res.status(400).json({ message: "Invalid categories provided" });
    }

    if (!endDate || isNaN(Date.parse(endDate))) {
      return res.status(400).json({ message: "Invalid endDate format" });
    }

    let profileImageUrl;
    let bannerImageUrl;

    if (req.files?.profileImage?.[0]) {
      const profileFile = dataUriMultipleFiles(
        req.files.profileImage[0]
      ).content;
      const result = await cloudinary.uploader.upload(profileFile, {
        folder: "uploads/profile",
        transformation: { width: 500, height: 500, crop: "limit" },
      });
      profileImageUrl = result.secure_url;
    } else {
      return res.status(400).json({ message: "Profile image is required" });
    }

    if (req.files?.bannerImage?.[0]) {
      const bannerFile = dataUriMultipleFiles(req.files.bannerImage[0]).content;
      const result = await cloudinary.uploader.upload(bannerFile, {
        folder: "uploads/banner",
        transformation: { width: 1000, height: 300, crop: "limit" },
      });
      bannerImageUrl = result.secure_url;
    } else {
      return res.status(400).json({ message: "Banner image is required" });
    }
    let parsedMembers = members;
    if (typeof members === "string") {
      try {
        parsedMembers = JSON.parse(members);
      } catch (error) {
        console.error("Error parsing members:", error.message);
        return res.status(400).json({ message: "Invalid members format" });
      }
    }

    const updatedMembers = [...(parsedMembers || []), userId];

    let parsedTasks = tasks;
    if (typeof tasks === "string") {
      try {
        parsedTasks = JSON.parse(tasks);
      } catch (error) {
        console.error("Error parsing tasks:", error.message);
        return res.status(400).json({ message: "Invalid tasks format" });
      }
    }

    const formattedTasks = (parsedTasks || []).map((task) => ({
      title: task.title,
      description: task.description || "",
      requireProof: task.requireProof || false,
      days: task.days || [],
    }));

    const group = new Group({
      title,
      members: updatedMembers,
      admin: userId,
      goal,
      image: profileImageUrl,
      banner: bannerImageUrl,
      userStreaks: {},
      endDate,
      categories: parsedCategories,
    });
    await group.save();

    const todo = new Todo({
      tasks: formattedTasks,
      group: group._id,
    });
    await todo.save();

    group.todo = todo._id;
    await group.save();

    await User.findByIdAndUpdate(userId, {
      $push: { createdGroups: group._id },
    });

    res.status(201).json({ group, todo });
  } catch (error) {
    console.error("Error in createGroup:", error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
});

const getGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find().populate("members admin todo");
  res.json(groups);
});

const getuserGroups = asyncHandler(async (req, res) => {
  const createdGroups = await Group.find({ admin: req.user._id })
    .populate("members", "name email image")
    .populate("todo");

  const joinedGroups = await Group.find({
    members: req.user._id,
    admin: { $ne: req.user._id }, // Avoid duplicates if user is both admin and member
  }).populate("members", "name email image");

  // Combine using spread operator
  const allGroups = [...createdGroups, ...joinedGroups];

  res.json({ usergroups: allGroups });
});

const getGroupById = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.groupId)
    .populate("members admin todo joinRequests")
    .populate("todo");

  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }
  res.json(group);
});

const updateGroup = asyncHandler(async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Update title and goal
    if (req.body.title) group.title = req.body.title;
    if (req.body.goal) group.goal = req.body.goal;
    if (req.body.endDate) group.endDate = req.body.endDate;

    // Update categories
    if (req.body.categories) {
      let parsedCategories = req.body.categories;
      if (typeof parsedCategories === "string") {
        try {
          parsedCategories = JSON.parse(parsedCategories);
        } catch (err) {
          parsedCategories = parsedCategories
            .split(",")
            .map((cat) => cat.trim());
        }
      }
      group.categories = parsedCategories;
    }

    // Handle profile image
    if (req.files?.profileImage?.[0]) {
      const profileFile = dataUriMultipleFiles(
        req.files.profileImage[0]
      ).content;

      // Remove existing profile image from Cloudinary
      if (group.image) {
        const publicId = group.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`uploads/profile/${publicId}`);
      }

      const result = await cloudinary.uploader.upload(profileFile, {
        folder: "uploads/profile",
        transformation: { width: 500, height: 500, crop: "limit" },
      });

      group.image = result.secure_url;
    }

    // Handle banner image
    if (req.files?.bannerImage?.[0]) {
      const bannerFile = dataUriMultipleFiles(req.files.bannerImage[0]).content;

      // Remove existing banner image from Cloudinary
      if (group.banner) {
        const publicId = group.banner.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`uploads/banner/${publicId}`);
      }

      const result = await cloudinary.uploader.upload(bannerFile, {
        folder: "uploads/banner",
        transformation: { width: 1000, height: 300, crop: "limit" },
      });

      group.banner = result.secure_url;
    }

    // Update members
    if (req.body.members) {
      let parsedMembers = req.body.members;

      if (typeof parsedMembers === "string") {
        try {
          parsedMembers = JSON.parse(parsedMembers);
        } catch (err) {
          return res.status(400).json({ message: "Invalid members format" });
        }
      }

      if (!Array.isArray(parsedMembers)) {
        return res.status(400).json({ message: "Invalid members format" });
      }

      const newMemberIds = parsedMembers.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
      const oldMemberIds = group.members.map((id) => id.toString());
      const newSet = new Set(newMemberIds.map((id) => id.toString()));

      // Remove old members from user.joinedGroups
      const removedMembers = oldMemberIds.filter((id) => !newSet.has(id));
      for (const memberId of removedMembers) {
        const user = await User.findById(memberId);
        if (user) {
          user.joinedGroups = user.joinedGroups.filter(
            (gId) => gId.toString() !== group._id.toString()
          );
          await user.save();
        }
      }

      // Add new members to user.joinedGroups
      for (const memberId of newMemberIds) {
        const user = await User.findById(memberId);
        if (user && !user.joinedGroups.includes(group._id)) {
          user.joinedGroups.push(group._id);
          await user.save();
        }
      }

      // Recalculate common hobbies
      const memberHobbiesList = [];
      for (const memberId of newMemberIds) {
        const user = await User.findById(memberId);
        if (user?.hobbies?.length > 0) {
          memberHobbiesList.push(new Set(user.hobbies));
        }
      }

      group.members = newMemberIds;
    }

    const updatedGroup = await group.save();

    res
      .status(200)
      .json({ message: "Group updated successfully", group: updatedGroup });
  } catch (error) {
    console.error("Error in updateGroup:", error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
});

const deleteGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.groupId);

  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }
  if (group.todo) {
    await Todo.findByIdAndDelete(group.todo);
  }
  await Group.findByIdAndDelete(req.params.groupId);

  res.json({ message: "Group and associated todo deleted" });
});

const createTodoForGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { tasks } = req.body;
  const todo = new Todo({ tasks, group: groupId });
  await todo.save();

  const group = await Group.findById(groupId);
  group.todo = todo._id;
  await group.save();

  res.status(201).json(todo);
});

const markTaskComplete = asyncHandler(async (req, res) => {
  const { groupId, taskId } = req.params;
  const userId = req.user._id.toString();
  const { proofUrls } = req.body;
  const weekdayMap = {
    Sun: "sun",
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
  };
  const currentDayShort = new Date().toLocaleString("en-US", {
    weekday: "short",
  });
  const currentDayKey = weekdayMap[currentDayShort];
  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: "Group not found" });

  const todo = await Todo.findById(group.todo);
  if (!todo) return res.status(404).json({ message: "Todo not found" });

  const task = todo.tasks.id(taskId);
  if (!task) return res.status(404).json({ message: "Task not found" });

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const userDateKey = `${userId}_${today}`;
  const user = await User.findById(userId);
  if (!user.weeklyOption) {
    user.weeklyOption = { weekdays: true, weekend: true };
  } else if (
    user.weeklyOption.weekdays !== true &&
    user.weeklyOption.weekend !== true
  ) {
    user.weeklyOption.weekdays = true;
    user.weeklyOption.weekend = true;
  }
  const isAlreadyCompleted = task.completedBy.some(
    (c) => c.userDateKey === userDateKey
  );

  if (isAlreadyCompleted) {
    const currentDay = new Date().toLocaleString("en-US", { weekday: "short" });
    const todayTasks = todo.tasks.filter((t) => t.days.includes(currentDay));

    const userHadCompletedAllTodayTasks = todayTasks.every((t) =>
      t.completedBy.some((c) => c.userDateKey === userDateKey)
    );

    task.completedBy = task.completedBy.filter(
      (c) => c.userDateKey !== userDateKey
    );
    await todo.save();

    if (group.completedDates?.includes(userDateKey)) {
      group.completedDates = group.completedDates.filter(
        (d) => d !== userDateKey
      );
    }
    if (userHadCompletedAllTodayTasks) {
      user.totalStreak = Math.max(user.totalStreak - 1, 0);
      user.lastStreakDate = null;

      if (
        user.weeklyOption?.weekdays &&
        ["mon", "tue", "wed", "thu", "fri"].includes(currentDayKey)
      ) {
        user.weeklyStats[currentDayKey] = { rest: false };
      } else if (
        user.weeklyOption?.weekend &&
        ["sat", "sun"].includes(currentDayKey)
      ) {
        user.weeklyStats[currentDayKey] = { rest: false };
      }
      await user.save();

      const currentUserStreak = group.userStreaks.get(userId) || 0;
      group.userStreaks.set(userId, Math.max(currentUserStreak - 1, 0));
      const today = new Date().toISOString().slice(0, 10);

      const todayDateStr = new Date().toISOString().split("T")[0]; // e.g., '2025-06-04'

      group.streakDeductedDates = group.streakDeductedDates || [];
      const allUsersStillCompletedToday = group.members.every((memberId) => {
        const memberKey = memberId.toString();
        const memberDateKey = `${memberKey}_${today}`;
        return todayTasks.every((task) =>
          task.completedBy.some((c) => c.userDateKey === memberDateKey)
        );
      });

      if (
        !allUsersStillCompletedToday &&
        !group.streakDeductedDates.includes(todayDateStr)
      ) {
        group.streak = Math.max((group.streak || 0) - 1, 0);
        group.streakDeductedDates.push(todayDateStr); // Prevent repeat deduction
      }

      await group.save();
    }
    console.log(group.streak);

    return res.json({
      message: "Task unmarked as complete",
      userCompletedAllTasks: false,
      streak: group.userStreaks.get(userId) || 0,
    });
  }

  let proofs = [];

  if (Array.isArray(proofUrls) && proofUrls.length > 0) {
    proofs = proofUrls.map((proof) => ({
      type: "image",
      url: typeof proof === "string" ? proof : proof.uri,
    }));
  } else if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const fileDataUri = dataUriFromFile(file).content;
      const result = await cloudinary.uploader.upload(fileDataUri, {
        folder: "uploads",
        transformation: { width: 500, height: 500, crop: "limit" },
      });
      proofs.push({ type: "image", url: result.secure_url });
    }
  } else if (task.requireProof) {
    return res
      .status(400)
      .json({ message: "At least one image is required for proof" });
  }

  task.completedBy.push({
    userDateKey,
    proof: proofs.length ? proofs : undefined,
  });

  await todo.save();

  const currentDay = new Date().toLocaleString("en-US", { weekday: "short" });
  const todayTasks = todo.tasks.filter((t) => t.days.includes(currentDay));

  const userCompletedAllTodayTasks = todayTasks.every((t) =>
    t.completedBy.some((c) => c.userDateKey === userDateKey)
  );

  if (
    userCompletedAllTodayTasks &&
    (!group.completedDates || !group.completedDates.includes(userDateKey))
  ) {
    user.totalStreak += 1;
    user.lastStreakDate = new Date();

    if (
      user.weeklyOption?.weekdays &&
      ["mon", "tue", "wed", "thu", "fri"].includes(currentDayKey)
    ) {
      user.weeklyStats[currentDayKey] = { rest: true };
    } else if (
      user.weeklyOption?.weekend &&
      ["sat", "sun"].includes(currentDayKey)
    ) {
      user.weeklyStats[currentDayKey] = { rest: true };
    }

    await user.save();

    const currentStreak = group.userStreaks.get(userId) || 0;
    group.userStreaks.set(userId, currentStreak + 1);

    group.completedDates = group.completedDates || [];
    group.completedDates.push(userDateKey);

    const allCompletedToday = group.members.every((memberId) => {
      const memberKey = memberId.toString();
      const memberDateKey = `${memberKey}_${today}`;
      return todayTasks.every((task) =>
        task.completedBy.some((c) => c.userDateKey === memberDateKey)
      );
    });

    if (allCompletedToday) {
      group.streak = (group.streak || 0) + 1;
    }

    await group.save();
  }

  try {
    const otherMemberIds = group.members.filter(
      (memberId) => memberId.toString() !== userId
    );

    const otherMembers = await User.find({ _id: { $in: otherMemberIds } });

    const tokens = otherMembers
      .map((member) => member.fcmToken) // adjust field name if needed
      .filter(Boolean);

    console.log("✅ FCM Tokens:", tokens);

    if (tokens.length > 0) {
      const notificationTitle = "Task Completed";
      const notificationBody = `✅ ${user.name} has completed the task "${task.title}" in group "${group.title}"`;

      await sendNotificationToTokens(
        tokens,
        notificationTitle,
        notificationBody,
        {
          Id: group._id.toString(), // ✅ include groupId
          type: "taskCompleted", // optional custom type
        }
      );
      console.log("✅ Notifications sent to group members.");
    } else {
      console.log("⚠️ No valid FCM tokens found for group members.");
    }
  } catch (err) {
    console.error(
      "❌ Error sending notifications:",
      err?.response?.data || err.message
    );
  }

  res.json({
    message: "Task marked as complete",
    userCompletedAllTasks: userCompletedAllTodayTasks,
    streak: group.userStreaks.get(userId) || 0,
  });
});

const getLeaderboard = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.groupId).populate("members");
  const leaderboard = Array.from(group.userStreaks.entries())
    .map(([userId, streak]) => {
      const user = group.members.find(
        (member) => member._id.toString() === userId
      );
      return { name: user?.name || "Unknown", streak };
    })
    .sort((a, b) => b.streak - a.streak);

  res.json(leaderboard);
});

const updateTodoForGroup = asyncHandler(async (req, res) => {
  try {
    const { groupId } = req.params;
    const { tasks } = req.body;
    console.log(tasks);
    // Find the group and populate the todo
    const group = await Group.findById(groupId).populate("todo");
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the group has an existing todo
    if (group.todo) {
      // Update existing todo
      group.todo.tasks = tasks;
      await group.todo.save();
      return res.status(200).json(group.todo);
    } else {
      // If no todo exists, optionally create one
      const newTodo = new Todo({ tasks, group: groupId });
      await newTodo.save();

      group.todo = newTodo._id;
      await group.save();

      return res.status(201).json(newTodo);
    }
  } catch (error) {
    console.error("Failed to update todo:", error);
    res
      .status(500)
      .json({ message: "Failed to update todo", error: error.message });
  }
});

const requestToJoinGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user._id;

  try {
    const group = await Group.findById(groupId);

    const adminUser = await userModel.findById(group.admin);
    const user = await User.findById(userId);

    if (!group) {
      return res.status(400).json({ message: "Group not found" });
    }

    if (group.members.includes(userId)) {
      return res.status(400).json({ message: "Already a member" });
    }

    const alreadyRequested = group.joinRequests.includes(userId);

    if (alreadyRequested) {
      // Pull user from joinRequests (cancel request)
      group.joinRequests.pull(userId);
      await group.save();

      user.joinRequests = user.joinRequests.filter(
        (id) => id.toString() !== groupId
      );
      await user.save();
      return res.status(200).json({ message: "Join request cancelled" });
    } else {
      // Add user to joinRequests
      group.joinRequests.push(userId);
      await group.save();

      if (!user.joinRequests.includes(groupId)) {
        user.joinRequests.push(groupId);
        await user.save();
      }

      if (adminUser?.fcmToken) {
        const title = "Join Request";
        const body = `${user.name} has requested to join your group "${group.title}"`;

        try {
          await sendNotificationToTokens([adminUser.fcmToken], title, body, {
            Id: group._id.toString(), // ✅ include groupId
            type: "joinRequest", // optional custom type
          });
          console.log("✅ Notification sent to group admin.");
        } catch (err) {
          console.error(
            "❌ Failed to send notification to admin:",
            err.message
          );
        }
      }

      return res.status(200).json({ message: "Join request sent" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

const acceptJoinRequest = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;
  const adminId = req.user._id;
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.admin.equals(adminId)) {
      return res
        .status(403)
        .json({ message: "Only admin can accept requests" });
    }

    console.log(group.joinRequests);
    if (!group.joinRequests.includes(userId)) {
      return res.status(400).json({ message: "No such join request" });
    }

    group.joinRequests.pull(userId);
    group.members.push(userId);
    await group.save();

    const user = await User.findById(userId);

    if (user) {
      user.joinRequests = user.joinRequests.filter(
        (id) => id.toString() !== groupId
      );
      await user.save();
    }
    if (user?.fcmToken) {
      const title = "Request Accepted";
      const body = `Your request to join "${group.title}" has been accepted.`;

      try {
        await sendNotificationToTokens([user.fcmToken], title, body, {
          Id: group._id.toString(), // ✅ include groupId
          type: "joinRequest", // optional custom type
        });
        console.log("✅ Notification sent to accepted user.");
      } catch (err) {
        console.error("❌ Failed to send notification:", err.message);
      }
    }

    res.status(200).json({ message: "User added to group" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

const getMemberAnalytics = asyncHandler(async (req, res) => {
  const groupId = req.params.groupId;
  const { type = "day" } = req.query;

  try {
    const data = await Group.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(groupId) } },
      { $project: { completedDates: 1 } },
      { $unwind: "$completedDates" },
      {
        $project: {
          userId: { $arrayElemAt: [{ $split: ["$completedDates", "_"] }, 0] },
          dateString: {
            $arrayElemAt: [{ $split: ["$completedDates", "_"] }, 1],
          },
        },
      },
      {
        $addFields: {
          completedDate: { $dateFromString: { dateString: "$dateString" } },
        },
      },
      {
        $group: {
          _id: {
            userId: "$userId",
            date: {
              $dateToString: {
                format: formatMap[type],
                date: "$completedDate",
              },
            },
          },
          userCompletions: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    res.json(
      data.map((d) => ({
        _id: d._id.date,
        userId: d._id.userId,
        userCompletions: d.userCompletions,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const getUserVsGroupAnalytics = asyncHandler(async (req, res) => {
  const groupId = req.params.groupId;
  const userId = req.user._id.toString();
  const { type = "day" } = req.query;

  try {
    const data = await Group.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(groupId) } },
      { $project: { completedDates: 1 } },
      { $unwind: "$completedDates" },
      {
        $project: {
          isUser: {
            $eq: [
              { $arrayElemAt: [{ $split: ["$completedDates", "_"] }, 0] },
              userId,
            ],
          },
          userId: { $arrayElemAt: [{ $split: ["$completedDates", "_"] }, 0] },
          dateString: {
            $arrayElemAt: [{ $split: ["$completedDates", "_"] }, 1],
          },
        },
      },
      {
        $addFields: {
          completedDate: { $dateFromString: { dateString: "$dateString" } },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: formatMap[type],
                date: "$completedDate",
              },
            },
          },
          totalGroupCompletions: { $sum: 1 },
          userCompletions: {
            $sum: {
              $cond: ["$isUser", 1, 0],
            },
          },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    res.json(
      data.map((d) => ({
        _id: d._id.date,
        totalGroupCompletions: d.totalGroupCompletions,
        userCompletions: d.userCompletions,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const leaveGroup = asyncHandler(async (req, res) => {
  const groupId = req.params.groupId;
  const userId = req.user._id;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Prevent admin from leaving the group
    if (group.admin.toString() === userId.toString()) {
      return res.status(400).json({ message: "Admin cannot leave the group." });
    }

    // Remove user from group members
    group.members = group.members.filter(
      (memberId) => memberId.toString() !== userId.toString()
    );

    // Remove user from joinRequests if present
    group.joinRequests = group.joinRequests.filter(
      (requestId) => requestId.toString() !== userId.toString()
    );

    // Remove user's streak entry from group
    group.userStreaks.delete(userId.toString());

    await group.save();

    // Remove groupId from user's joinedGroups
    const user = await User.findById(userId);
    if (user) {
      user.joinedGroups = user.joinedGroups.filter(
        (joinedGroupId) => joinedGroupId.toString() !== groupId.toString()
      );
      await user.save();
    }

    res.status(200).json({ message: "You have left the group successfully." });
  } catch (err) {
    console.error("Leave Group Error:", err);
    res.status(500).json({ message: "Server error while leaving the group." });
  }
});

module.exports = {
  leaveGroup,
  getMemberAnalytics,
  getUserVsGroupAnalytics,
  createGroup,
  getGroupById,
  getGroups,
  getuserGroups,
  updateGroup,
  deleteGroup,
  createTodoForGroup,
  markTaskComplete,
  getLeaderboard,
  updateTodoForGroup,
  requestToJoinGroup,
  acceptJoinRequest,
};
