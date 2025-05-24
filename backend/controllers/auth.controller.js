const asyncHandler = require("express-async-handler");
const User = require("../models/user.Model.js");
const { dataUri } = require("../middleware/upload.middleware.js");
const { cloudinary } = require("../config/cloudnari.config.js");
const generateToken = require("../utils/generateToken.utils.js");

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const userWithSameName = await User.findOne({ name });
  if (userWithSameName) {
    return res.status(400).json({ message: "Username already taken" });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
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

    const user = await User.create({
      name,
      email,
      password,
      image: imageUrl,
    });

    if (user) {
      res.status(201).json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        token: generateToken(user._id),
      });
    } else {
      res.status(500).json({ message: "Failed to create user" });
    }
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: error });
  }
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email })
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

  if (user && (await user.matchPassword(password))) {
    res.json({ user: user, token: generateToken(user._id) });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

module.exports = { register, login };
