const User = require('../models/user.Model');
const Group = require('../models/group.model');
const Todo = require('../models/todo.model');
const { sendNotificationToTokens } = require('../services/fcmSender');

const getTodayString = () => new Date().toISOString().slice(0, 10);
const getWeekDay = () => new Date().toLocaleString('en-US', { weekday: 'short' });

async function sendReminderNotifications() {
  try {
    const users = await User.find({ fcmToken: { $exists: true, $ne: null } });

    const today = getTodayString(); // e.g. "2025-06-25"
    const weekDay = getWeekDay();   // e.g. "Wed"

    for (const user of users) {
      const createdGroups = await Group.find({ admin: user._id })
        .populate("members", "_id")
        .populate("todo");

      const joinedGroups = await Group.find({
        members: user._id,
        admin: { $ne: user._id }
      }).populate("members", "_id").populate("todo");

      const allGroups = [...createdGroups, ...joinedGroups];

      for (const group of allGroups) {
        if (!group.todo) continue;

        const todayTasks = group.todo.tasks.filter((task) =>
          task.days.includes(weekDay)
        );

        const userDateKey = `${user._id}_${today}`;

        const incompleteTasks = todayTasks.filter((task) =>
          !task.completedBy.some((entry) => entry.userDateKey === userDateKey)
        );

        if (incompleteTasks.length) {
          const taskTitles = incompleteTasks.map((t) => t.title).join(', ');

          await sendNotificationToTokens(
            [user.fcmToken],
            `🕒 ${group.title} Tasks Pending`,
            `You still need to complete: ${taskTitles}`,
            {
              groupId: group._id.toString(), // 👉 include custom data
              type: 'groupReminder'
            }
          );

          console.log(`✅ Sent reminder to ${user.name} for group "${group.title}"`);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error sending task reminders:", error);
  }
}


module.exports = sendReminderNotifications;
