const asyncHandler = require("express-async-handler");
const Group = require("../models/group.model");
const Todo = require("../models/todo.model");
const User = require("../models/user.Model");
const { dataUri } = require('../middleware/upload.middleware.js');
const { cloudinary } = require("../config/cloudnari.config.js");

const createGroup = asyncHandler(async (req, res) => {
  const { title, members, goal } = req.body;
  const userId = req.user._id;
  const existingGroup = await Group.findOne({ title });
  if (existingGroup) {
    return res
      .status(400)
      .json({ message: "Group with this title already exists." });
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


  const group = new Group({
    title,
    members,
    admin: req.user._id,
    goal,
    image: imageUrl,
    userStreaks: {},
  });
  await group.save();

  await User.findByIdAndUpdate(userId, {
    $push: { createdGroups: group._id },
  });

  res.status(201).json(group);
});

const getGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find().populate("members admin todo");
  res.json(
    groups);
});

const getuserGroups = asyncHandler(async (req, res) => {
  const usergroups = await Group.find({ admin: req.user._id }).populate(
    "members",
    "name email image"
  );
  res.json({
    usergroups,
  });
});

const getGroupById = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.groupId).populate(
    "members admin todo"
  );
  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }
  res.json(group);
});

const updateGroup = asyncHandler(async (req, res) => {

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
  


  const group = await Group.findByIdAndUpdate(req.params.groupId, req.body, {
    new: true,
  });
  res.json(group);
});

const deleteGroup = asyncHandler(async (req, res) => {
  await Group.findByIdAndDelete(req.params.groupId);
  res.json({ message: "Group deleted" });
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
  const userId = req.user._id;

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: "Group not found" });

  const todo = await Todo.findById(group.todo);
  if (!todo) return res.status(404).json({ message: "Todo not found" });

  const task = todo.tasks.id(taskId);
  if (!task) return res.status(404).json({ message: "Task not found" });

  if (task.completedBy.includes(userId)) {
    return res.status(400).json({ message: "Task already completed by user" });
  }

  task.completedBy.push(userId);
  await todo.save();

  const userCompletedAllTasks = todo.tasks.every((t) =>
    t.completedBy.includes(userId)
  );
  const user = await User.findById(userId);

  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const lastStreak = user.lastStreakDate?.toISOString().slice(0, 10);
  const userGroupKey = userId.toString();

  const groupStreakDateKey = `${userGroupKey}_${today}`;
  if (
    group.completedDates &&
    group.completedDates.includes(groupStreakDateKey)
  ) {
    return res
      .status(400)
      .json({ message: "Already completed this group today" });
  }

  if (userCompletedAllTasks) {
    user.totalStreak += 1;
    user.lastStreakDate = new Date();
    await user.save();

    const currentStreak = group.userStreaks.get(userGroupKey) || 0;
    group.userStreaks.set(userGroupKey, currentStreak + 1);

    group.completedDates = group.completedDates || [];
    group.completedDates.push(groupStreakDateKey);

    await group.save();
  }
  res.json({
    message: "Task marked as complete",
    userCompletedAllTasks,
    streak: group.userStreaks.get(userId.toString()) || 0,
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

module.exports = {
  createGroup,
  getGroupById,
  getGroups,
  getuserGroups,
  updateGroup,
  deleteGroup,
  createTodoForGroup,
  markTaskComplete,
  getLeaderboard,
};
