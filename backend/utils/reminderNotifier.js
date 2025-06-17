const User = require('../models/user.Model');
const Group = require('../models/group.model');
const Todo = require('../models/todo.model');
const { sendNotificationToTokens } = require('../services/fcmSender');

const getTodayString = () => new Date().toISOString().slice(0, 10);
const getWeekDay = () => new Date().toLocaleString('en-US', { weekday: 'short' });

async function sendReminderNotifications() {
  try {
    const users = await User.find({ fcmToken: { $exists: true, $ne: null } });

    const today = getTodayString();
    const weekDay = getWeekDay();

    for (const user of users) {
      const createdGroups = await Group.find({ admin: user._id })
        .populate("members", "_id")
        .populate("todo");

      const joinedGroups = await Group.find({
        members: user._id,
        admin: { $ne: user._id }
      }).populate("members", "_id").populate("todo");

      const allGroups = [...createdGroups, ...joinedGroups];

      let uncompletedTasks = [];

      for (const group of allGroups) {
        if (!group.todo) continue;

        const todayTasks = group.todo.tasks.filter((task) =>
          task.days.includes(weekDay)
        );

        const userDateKey = `${user._id}_${today}`;

        const incomplete = todayTasks.filter((task) =>
          !task.completedBy.some((entry) => entry.userDateKey === userDateKey)
        );

        if (incomplete.length) {
          uncompletedTasks.push({
            groupTitle: group.title,
            tasks: incomplete.map((t) => t.title)
          });
        }
      }

      if (uncompletedTasks.length) {
        const taskSummary = uncompletedTasks
          .map(group => `📌 ${group.groupTitle}:\n• ` + group.tasks.join('\n• '))
          .join('\n\n');

        await sendNotificationToTokens(
          [user.fcmToken],
          "🚨 Task Reminder",
          `You have pending tasks:\n\n${taskSummary}`
        );

        console.log(`✅ Sent reminder to ${user.name}`);
      }
    }
  } catch (error) {
    console.error("❌ Error sending task reminders:", error);
  }
}

module.exports = sendReminderNotifications;
