const asyncHandler = require("express-async-handler");
const Group = require("../models/group.model");
const Todo = require("../models/todo.model");
const User = require("../models/user.Model");
const { dataUri } = require("../middleware/upload.middleware.js");
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
const parser = new DataUriParser();
const dataUriFromFile = (file) =>
  parser.format(path.extname(file.originalname).toString(), file.buffer);

const getTodayName = () => {
  return new Date().toLocaleDateString("en-US", { weekday: "short" }); 
};


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

    let imageUrl;
    if (req.file) {
      const file = dataUri(req).content;
      const result = await cloudinary.uploader.upload(file, {
        folder: "uploads",
        transformation: { width: 500, height: 500, crop: "limit" },
      });
      imageUrl = result.secure_url;
    } else {
      return res.status(400).json({ message: "Image is required" });
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
      days:task.days || []
    }));

    const group = new Group({
      title,
      members: updatedMembers,
      admin: userId,
      goal,
      image: imageUrl,
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
    
 if (req.body.title) {
      group.title = req.body.title;
    }

    // ✅ Update goal if provided
    if (req.body.goal) {
      group.goal = req.body.goal;
    }

    if (req.file) {
      const file = dataUri(req).content;
      console.log(req.file);

      if (group.image) {
        const publicId = group.image.split("/").slice(-1)[0].split(".")[0];
        console.log(publicId);
        await cloudinary.uploader.destroy(`uploads/${publicId}`);
      }

      const result = await cloudinary.uploader.upload(file, {
        folder: "uploads",
        transformation: { width: 500, height: 500, crop: "limit" },
      });

      group.image = result.secure_url;
    }

    if (req.body.members) {
      if (typeof req.body.members === "string") {
        req.body.members = JSON.parse(req.body.members);
      }

      if (!Array.isArray(req.body.members)) {
        return res.status(400).json({ message: "Invalid members format" });
      }

      const newMemberIds = req.body.members.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
      const oldMemberIds = group.members.map((id) => id.toString());
      const newSet = new Set(newMemberIds.map((id) => id.toString()));

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

      for (const memberId of newMemberIds) {
        const user = await User.findById(memberId);
        if (user && !user.joinedGroups.includes(group._id)) {
          user.joinedGroups.push(group._id);
          await user.save();
        }
      }

      const memberHobbiesList = [];
      for (const memberId of newMemberIds) {
        const user = await User.findById(memberId);
        if (user?.hobbies?.length > 0) {
          memberHobbiesList.push(new Set(user.hobbies));
        }
      }

      let commonHobbies = [];
      if (memberHobbiesList.length > 0) {
        commonHobbies = [
          ...memberHobbiesList.reduce((a, b) => {
            return new Set([...a].filter((hobby) => b.has(hobby)));
          }),
        ];
      }

      group.categories = commonHobbies;
      group.members = newMemberIds;
    }

    if (req.body.endDate) {
      group.endDate = req.body.endDate;
    }

    if (req.body.categories) {
      if (typeof req.body.categories === "string") {
        group.categories = req.body.categories
          .split(",")
          .map((cat) => cat.trim());
      } else if (Array.isArray(req.body.categories)) {
        group.categories = req.body.categories;
      }
    }

    const updatedGroup = await group.save();

    res
      .status(200)
      .json({ message: "update successfully", group: updatedGroup });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to update group", error: error.message });
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

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: "Group not found" });

  const todo = await Todo.findById(group.todo);
  if (!todo) return res.status(404).json({ message: "Todo not found" });

  const task = todo.tasks.id(taskId);
  if (!task) return res.status(404).json({ message: "Task not found" });

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const userDateKey = `${userId}_${today}`;
  const user = await User.findById(userId);

  const isAlreadyCompleted = task.completedBy.some(
    (c) => c.userDateKey === userDateKey
  );

  if (isAlreadyCompleted) {
    const wasAllCompleted = todo.tasks.every((t) =>
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

    if (wasAllCompleted) {
      user.totalStreak = Math.max(user.totalStreak - 1, 0);
      user.lastStreakDate = null;

      const currentStreak = group.userStreaks.get(userId) || 0;
      group.userStreaks.set(userId, Math.max(currentStreak - 1, 0));
      group.streak = Math.max((group.streak || 0) - 1, 0);

      await user.save();
      await group.save();
    }

    return res.json({
      message: "Task unmarked as complete",
      userCompletedAllTasks: false,
      streak: group.userStreaks.get(userId) || 0,
    });
  }

  // Handle proof uploads
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

  // Add completion record
  task.completedBy.push({
    userDateKey,
    proof: proofs.length ? proofs : undefined,
  });

  await todo.save();

  // Check if user completed all today's tasks
  const currentDay = new Date().toLocaleString('en-US', { weekday: 'short' });
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
      return res.status(200).json({ message: "Join request cancelled" });
    } else {
      // Add user to joinRequests
      group.joinRequests.push(userId);
      await group.save();
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

module.exports = {
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
