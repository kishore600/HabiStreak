const asyncHandler = require("express-async-handler");
const Group = require("../models/group.model");
const Todo = require("../models/todo.model");
const User = require("../models/user.Model");
const { dataUri } = require("../middleware/upload.middleware.js");
const { cloudinary } = require("../config/cloudnari.config.js");
const { default: mongoose } = require("mongoose");
const hobbies_enum = require("../constant.js");

const createGroup = asyncHandler(async (req, res) => {
  try {
    const { title, members, goal, tasks,endDate, categories } = req.body;
   console.log(title, members, goal, tasks,endDate, categories)
    const userId = req.user._id;

    // Check if a group with the same title exists
    const existingGroup = await Group.findOne({ title });
    if (existingGroup) {
      return res
        .status(400)
        .json({ message: "Group with this title already exists." });
    }

// Safely parse categories
let parsedCategories = categories;
if (typeof categories === 'string') {
  try {
    parsedCategories = JSON.parse(categories);
  } catch (error) {
    console.error("Error parsing categories:", error.message);
    return res.status(400).json({ message: "Invalid categories format" });
  }
}

// Validate categories
if (
  !Array.isArray(parsedCategories) ||
  parsedCategories.some(cat => !hobbies_enum.includes(cat))
) {
  return res.status(400).json({ message: "Invalid categories provided" });
}


// Validate endDate
if (!endDate || isNaN(Date.parse(endDate))) {
  return res.status(400).json({ message: "Invalid endDate format" });
}
    
    // Handle image upload
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

    // Safely parse members
    let parsedMembers = members;
    if (typeof members === 'string') {
      try {
        parsedMembers = JSON.parse(members);
      } catch (error) {
        console.error("Error parsing members:", error.message);
        return res.status(400).json({ message: "Invalid members format" });
      }
    }

    // Add current user to members
    const updatedMembers = [...(parsedMembers || []), userId];

    // Safely parse tasks
    let parsedTasks = tasks;
    if (typeof tasks === 'string') {
      try {
        parsedTasks = JSON.parse(tasks);
      } catch (error) {
        console.error("Error parsing tasks:", error.message);
        return res.status(400).json({ message: "Invalid tasks format" });
      }
    }

    // Format tasks for Todo
    const formattedTasks = (parsedTasks || []).map(task => ({
      title: task
    }));

    // Step 1: Create Group
    const group = new Group({
      title,
      members: updatedMembers,
      admin: userId,
      goal,
      image: imageUrl,
      userStreaks: {},
      endDate,
      categories:parsedCategories,
    });
    await group.save();

    // Step 2: Create Todo linked to Group
    const todo = new Todo({
      tasks: formattedTasks,
      group: group._id,
    });
    await todo.save();

    // Step 3: Link Todo back to Group
    group.todo = todo._id;
    await group.save();

    // Step 4: Update User createdGroups
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
  const createdGroups = await Group.find({ admin: req.user._id }).populate(
    "members",
    "name email image"
  );

  const joinedGroups = await Group.find({ 
    members: req.user._id, 
    admin: { $ne: req.user._id } // Avoid duplicates if user is both admin and member
  }).populate("members", "name email image");

  // Combine using spread operator
  const allGroups = [...createdGroups, ...joinedGroups];

  res.json({ usergroups: allGroups });
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
  try {
    // Find the existing group by groupId
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // If there is an image file in the request, upload and update the image
    if (req.file) {
      const file = dataUri(req).content;
      console.log(req.file);

      // If the group already has an image, remove the old image from Cloudinary
      if (group.image) {
        const publicId = group.image.split("/").slice(-1)[0].split(".")[0];
        console.log(publicId);
        await cloudinary.uploader.destroy(`uploads/${publicId}`);
      }

      // Upload the new image to Cloudinary
      const result = await cloudinary.uploader.upload(file, {
        folder: "uploads",
        transformation: { width: 500, height: 500, crop: "limit" },
      });

      // Update the group's image with the new URL
      group.image = result.secure_url;
    }

    // Ensure members are converted to ObjectIds if members is provided
    if (req.body.members) {
      if (typeof req.body.members === "string") {
        req.body.members = JSON.parse(req.body.members);
      }
    
      if (!Array.isArray(req.body.members)) {
        return res.status(400).json({ message: "Invalid members format" });
      }
    
      const newMemberIds = req.body.members.map((id) => new mongoose.Types.ObjectId(id));
      const oldMemberIds = group.members.map((id) => id.toString());
    
      const newSet = new Set(newMemberIds.map((id) => id.toString()));
    
      // ✅ Users to remove: those in old but not in new
      const removedMembers = oldMemberIds.filter((id) => !newSet.has(id));
    
      // ✅ Remove group from removed members' joinedGroups
      for (const memberId of removedMembers) {
        const user = await User.findById(memberId);
        if (user) {
          user.joinedGroups = user.joinedGroups.filter(
            (gId) => gId.toString() !== group._id.toString()
          );
          await user.save();
        }
      }
    
      // ✅ Add group to new members' joinedGroups if not already present
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
        commonHobbies = [...memberHobbiesList.reduce((a, b) => {
          return new Set([...a].filter(hobby => b.has(hobby)));
        })];
      }

      group.categories = commonHobbies;
    
      group.members = newMemberIds;

      
    }

    if (req.body.endDate) {
      group.endDate = req.body.endDate;
    }

    if (req.body.categories && Array.isArray(req.body.categories)) {
      // Optional: merge with commonHobbies or override
      group.categories = req.body.categories;
    }


    // Update the group document with the new data
    const updatedGroup = await Group.findByIdAndUpdate(req.params.groupId, req.body, {
      new: true,
    });

    // Respond with the updated group
    res.status(200).json({ message: 'update successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update group', error: error.message });
  }
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
  const userId = req.user._id.toString();

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: "Group not found" });

  const todo = await Todo.findById(group.todo);
  if (!todo) return res.status(404).json({ message: "Todo not found" });

  const task = todo.tasks.id(taskId);
  if (!task) return res.status(404).json({ message: "Task not found" });

  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const userTodayKey = `${userId}_${today}`;
  const user = await User.findById(userId);

  const isAlreadyCompleted = task.completedBy.includes(userTodayKey);

  if (isAlreadyCompleted) {
    // ✅ Check if all tasks were completed TODAY before removing this one
    const wasAllCompleted = todo.tasks.every(t =>
      t.completedBy.includes(userTodayKey)
    );

    // ❌ Undo task completion for today
    task.completedBy = task.completedBy.filter(id => id !== userTodayKey);
    await todo.save();

    // 🧹 Remove today's streak record
    if (group.completedDates?.includes(userTodayKey)) {
      group.completedDates = group.completedDates.filter(d => d !== userTodayKey);
    }

    // 🔻 If previously all tasks were done today, decrement streaks
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

  // ✅ Mark task as complete for today
  task.completedBy.push(userTodayKey);
  await todo.save();

  const userCompletedAllTasks = todo.tasks.every(t =>
    t.completedBy.includes(userTodayKey)
  );

  if (
    userCompletedAllTasks &&
    (!group.completedDates || !group.completedDates.includes(userTodayKey))
  ) {
    user.totalStreak += 1;
    user.lastStreakDate = new Date();
    await user.save();

    const currentStreak = group.userStreaks.get(userId) || 0;
    group.userStreaks.set(userId, currentStreak + 1);

    group.completedDates = group.completedDates || [];
    group.completedDates.push(userTodayKey);

    const allCompletedToday = group.members.every(memberId => {
      const memberKey = memberId.toString();
      const memberDateKey = `${memberKey}_${today}`;
      return todo.tasks.every(task =>
        task.completedBy.includes(memberDateKey)
      );
    });

    if (allCompletedToday) {
      group.streak = (group.streak || 0) + 1;
    }

    await group.save();
    await todo.save()
  }

  res.json({
    message: "Task marked as complete",
    userCompletedAllTasks,
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
console.log(tasks)
    // Find the group and populate the todo
    const group = await Group.findById(groupId).populate('todo');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
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
    console.error('Failed to update todo:', error);
    res.status(500).json({ message: 'Failed to update todo', error: error.message });
  }
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
  updateTodoForGroup
};
