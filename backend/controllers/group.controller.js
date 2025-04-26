import asyncHandler from "express-async-handler";
import Group from "../models/group.model.js";
import Todo from "../models/todo.model.js";
import User from "../models/user.Model.js";

export const createGroup = asyncHandler(async (req, res) => {
  const { title, members, goal } = req.body;
  const userId = req.user._id;
  const existingGroup = await Group.findOne({ title });
  if (existingGroup) {
    return res
      .status(400)
      .json({ message: "Group with this title already exists." });
  }

  const group = new Group({
    title,
    members,
    admin: req.user._id,
    goal,
    userStreaks: {},
  });
  await group.save();

  await User.findByIdAndUpdate(userId, {
    $push: { createdGroups: group._id },
  });

  res.status(201).json(group);
});

export const getGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find().populate("members admin todo");
  res.json(groups);
});

export const getGroupById = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.groupId).populate(
    "members admin todo"
  );
  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }
  res.json(group);
});

export const updateGroup = asyncHandler(async (req, res) => {
  const group = await Group.findByIdAndUpdate(req.params.groupId, req.body, {
    new: true,
  });
  res.json(group);
});

export const deleteGroup = asyncHandler(async (req, res) => {
  await Group.findByIdAndDelete(req.params.groupId);
  res.json({ message: "Group deleted" });
});

export const createTodoForGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { tasks } = req.body;
  const todo = new Todo({ tasks, group: groupId });
  await todo.save();

  const group = await Group.findById(groupId);
  group.todo = todo._id;
  await group.save();

  res.status(201).json(todo);
});

export const markTaskComplete = asyncHandler(async (req, res) => {
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

  const userCompletedAllTasks = todo.tasks.every(t => t.completedBy.includes(userId));
  const user = await User.findById(userId);

  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const lastStreak = user.lastStreakDate?.toISOString().slice(0, 10);
  const userGroupKey = userId.toString();

  const groupStreakDateKey = `${userGroupKey}_${today}`;
  if (group.completedDates && group.completedDates.includes(groupStreakDateKey)) {
    return res.status(400).json({ message: "Already completed this group today" });
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

export const getLeaderboard = asyncHandler(async (req, res) => {
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
