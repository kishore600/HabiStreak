const User = require("../models/user.Model");
const Group = require("../models/group.model");

const searchUsersAndGroups = async (req, res) => {
  try {
    const { trimmed, type } = req.query;
console.log(trimmed)
    if (!trimmed) {
      return res.status(400).json({ message: "No search query provided" });
    }

    let results = [];

    if (type === "user" || !type) {
      // Search Users
      const users = await User.find({
        $or: [
          { name: { $regex: trimmed, $options: "i" } },
          { email: { $regex: trimmed, $options: "i" } }
        ]
      }).select("-password -pendingRequest");

      const formattedUsers = users.map(user => ({
        ...user._doc,
        type: "user"
      }));

      results = [...results, ...formattedUsers];
    }

    if (type === "group" || !type) {
      // Search Groups
      const groups = await Group.find({
        title: { $regex: trimmed, $options: "i" }
      });

      const formattedGroups = groups.map(group => ({
        ...group._doc,
        type: "group"
      }));

      results = [...results, ...formattedGroups];
    }

    res.status(200).json({ results });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error during search" });
  }
};

module.exports = { searchUsersAndGroups };
