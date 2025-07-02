const asyncHandler = require("express-async-handler");
const User = require("../models/user.Model.js");
const { dataUri } = require("../middleware/upload.middleware.js");
const { cloudinary } = require("../config/cloudnari.config.js");
const generateToken = require("../utils/generateToken.utils.js");
const sendEmail = require("../config/sendMail.config.js");
const crypto = require('crypto')

const register = asyncHandler(async (req, res) => {
  const { name, email, password,fcmToken,timezone} = req.body;
  console.log(name, email, password)
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
      fcmToken,
      timezone
    });

    if (user) {
      await sendEmail({
        email: user.email,
        subject: "🎉 Welcome to HabiStreak!",
        name: user.name,
      });

      console.log({
          user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        token: generateToken(user._id),
      })

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
  const { email, password , fcmToken,timezone } = req.body;
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
    if(user.timezone){
      user.timezone = timezone
      await user.save()
    }
  if (user.fcmToken !== "" && (await user.matchPassword(password))) {
     if (fcmToken) {
      user.fcmToken = fcmToken;
      await user.save();
    }

       await sendEmail({
        email: user.email,
        subject: "🎉Again Welcome to HabiStreak!",
        name: user.name,
      });


    res.json({ user: user, token: generateToken(user._id) });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await user.save();

  const resetUrl = `https://habistreak.netlify.app/resetpassword/${resetToken}`;

  const message = resetUrl;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset Request",
      message: message,
    });

    res.status(200).json({
      message: "Email send",
    });
  } catch (error) {
    console.log(error);
    user.resetPasswordExpire = undefined;
    user.resetPasswordToken = undefined;
    await user.save();
    res.status(500);
    throw new Error("Email could not be send");
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid token or token has expired");
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({
    message: "Password updated sucessfully",
  });
});
module.exports = { register, login,requestPasswordReset,resetPassword };
