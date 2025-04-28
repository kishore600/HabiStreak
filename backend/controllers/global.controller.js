const User = require("../models/user.Model");
const Group = require("../models/group.model");

const searchUsersAndGroups = async (req, res) => {
  try {
    const { query, type } = req.query;

    if (!query) {
      return res.status(400).json({ message: "No search query provided" });
    }

    let results = [];

    if (type === "user" || !type) {
      // Search Users
      const users = await User.find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } }
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
        title: { $regex: query, $options: "i" }
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
