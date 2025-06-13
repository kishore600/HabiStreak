"use strict";

var asyncHandler = require("express-async-handler");

var User = require("../models/user.Model.js");

var _require = require("../middleware/upload.middleware.js"),
    dataUri = _require.dataUri;

var _require2 = require("../config/cloudnari.config.js"),
    cloudinary = _require2.cloudinary;

var generateToken = require("../utils/generateToken.utils.js");

var sendEmail = require("../config/sendMail.config.js");

var crypto = require('crypto');

var register = asyncHandler(function _callee(req, res) {
  var _req$body, name, email, password, fcmToken, userWithSameName, userExists, imageUrl, file, result, user;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _req$body = req.body, name = _req$body.name, email = _req$body.email, password = _req$body.password, fcmToken = _req$body.fcmToken;
          console.log(name, email, password);

          if (!(!name || !email || !password)) {
            _context.next = 4;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            message: "All fields are required"
          }));

        case 4:
          _context.next = 6;
          return regeneratorRuntime.awrap(User.findOne({
            name: name
          }));

        case 6:
          userWithSameName = _context.sent;

          if (!userWithSameName) {
            _context.next = 9;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            message: "Username already taken"
          }));

        case 9:
          _context.prev = 9;
          _context.next = 12;
          return regeneratorRuntime.awrap(User.findOne({
            email: email
          }));

        case 12:
          userExists = _context.sent;

          if (!userExists) {
            _context.next = 15;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            message: "User already exists"
          }));

        case 15:
          if (!req.file) {
            _context.next = 23;
            break;
          }

          file = dataUri(req).content;
          _context.next = 19;
          return regeneratorRuntime.awrap(cloudinary.uploader.upload(file, {
            folder: "uploads",
            transformation: {
              width: 500,
              height: 500,
              crop: "limit"
            }
          }));

        case 19:
          result = _context.sent;
          imageUrl = result.secure_url;
          _context.next = 24;
          break;

        case 23:
          return _context.abrupt("return", res.status(400).json({
            message: "Image is required"
          }));

        case 24:
          _context.next = 26;
          return regeneratorRuntime.awrap(User.create({
            name: name,
            email: email,
            password: password,
            image: imageUrl,
            fcmToken: fcmToken
          }));

        case 26:
          user = _context.sent;

          if (!user) {
            _context.next = 34;
            break;
          }

          _context.next = 30;
          return regeneratorRuntime.awrap(sendEmail({
            email: user.email,
            subject: "🎉 Welcome to HabiStreak!",
            name: user.name
          }));

        case 30:
          console.log({
            user: {
              _id: user._id,
              name: user.name,
              email: user.email,
              image: user.image
            },
            token: generateToken(user._id)
          });
          res.status(201).json({
            user: {
              _id: user._id,
              name: user.name,
              email: user.email,
              image: user.image
            },
            token: generateToken(user._id)
          });
          _context.next = 35;
          break;

        case 34:
          res.status(500).json({
            message: "Failed to create user"
          });

        case 35:
          _context.next = 41;
          break;

        case 37:
          _context.prev = 37;
          _context.t0 = _context["catch"](9);
          console.error("Error registering user:", _context.t0);
          res.status(500).json({
            message: _context.t0
          });

        case 41:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[9, 37]]);
});
var login = asyncHandler(function _callee2(req, res) {
  var _req$body2, email, password, fcmToken, user;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _req$body2 = req.body, email = _req$body2.email, password = _req$body2.password, fcmToken = _req$body2.fcmToken;
          _context2.next = 3;
          return regeneratorRuntime.awrap(User.findOne({
            email: email
          }).populate("followers", "name email image").populate("following", "name email image").populate({
            path: "pendingRequest",
            populate: {
              path: "user",
              select: "name email image _id"
            }
          }).populate("createdGroups"));

        case 3:
          user = _context2.sent;
          _context2.t0 = user.fcmToken !== "";

          if (!_context2.t0) {
            _context2.next = 9;
            break;
          }

          _context2.next = 8;
          return regeneratorRuntime.awrap(user.matchPassword(password));

        case 8:
          _context2.t0 = _context2.sent;

        case 9:
          if (!_context2.t0) {
            _context2.next = 19;
            break;
          }

          if (!fcmToken) {
            _context2.next = 14;
            break;
          }

          user.fcmToken = fcmToken;
          _context2.next = 14;
          return regeneratorRuntime.awrap(user.save());

        case 14:
          _context2.next = 16;
          return regeneratorRuntime.awrap(sendEmail({
            email: user.email,
            subject: "🎉Again Welcome to HabiStreak!",
            name: user.name
          }));

        case 16:
          res.json({
            user: user,
            token: generateToken(user._id)
          });
          _context2.next = 21;
          break;

        case 19:
          res.status(401);
          throw new Error("Invalid email or password");

        case 21:
        case "end":
          return _context2.stop();
      }
    }
  });
});
var requestPasswordReset = asyncHandler(function _callee3(req, res) {
  var email, user, resetToken, resetUrl, message;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          email = req.body.email;
          _context3.next = 3;
          return regeneratorRuntime.awrap(User.findOne({
            email: email
          }));

        case 3:
          user = _context3.sent;

          if (user) {
            _context3.next = 7;
            break;
          }

          res.status(404);
          throw new Error("User not found");

        case 7:
          resetToken = crypto.randomBytes(32).toString("hex");
          user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
          user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
          _context3.next = 12;
          return regeneratorRuntime.awrap(user.save());

        case 12:
          resetUrl = "".concat(req.protocol, "://https://challengespear.netlify.app/resetpassword/").concat(resetToken);
          message = resetUrl;
          _context3.prev = 14;
          _context3.next = 17;
          return regeneratorRuntime.awrap(sendEmail({
            email: user.email,
            subject: "Password reset Request",
            message: message
          }));

        case 17:
          res.status(200).json({
            message: "Email send"
          });
          _context3.next = 29;
          break;

        case 20:
          _context3.prev = 20;
          _context3.t0 = _context3["catch"](14);
          console.log(_context3.t0);
          user.resetPasswordExpire = undefined;
          user.resetPasswordToken = undefined;
          _context3.next = 27;
          return regeneratorRuntime.awrap(user.save());

        case 27:
          res.status(500);
          throw new Error("Email could not be send");

        case 29:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[14, 20]]);
});
var resetPassword = asyncHandler(function _callee4(req, res) {
  var resetPasswordToken, user;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
          _context4.next = 3;
          return regeneratorRuntime.awrap(User.findOne({
            resetPasswordToken: resetPasswordToken,
            resetPasswordExpire: {
              $gt: Date.now()
            }
          }));

        case 3:
          user = _context4.sent;

          if (user) {
            _context4.next = 7;
            break;
          }

          res.status(400);
          throw new Error("Invalid token or token has expired");

        case 7:
          user.password = req.body.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpire = undefined;
          _context4.next = 12;
          return regeneratorRuntime.awrap(user.save());

        case 12:
          res.status(200).json({
            message: "Password updated sucessfully"
          });

        case 13:
        case "end":
          return _context4.stop();
      }
    }
  });
});
module.exports = {
  register: register,
  login: login,
  requestPasswordReset: requestPasswordReset,
  resetPassword: resetPassword
};