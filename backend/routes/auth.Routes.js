const express = require('express');
const { register, login } = require('../controllers/auth.controller.js');
const multer = require('multer');
const storage = multer.memoryStorage(); // recommended for Cloudinary
const upload = multer({ storage });

const router = express.Router();

router.route("/register").post(upload.single("image"), register);
router.route('/login').post(login);

module.exports = router;
