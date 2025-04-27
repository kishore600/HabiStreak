const express = require('express');
const { register, login } = require('../controllers/auth.controller.js');
const { upload } = require('../middleware/upload.middleware.js');

const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const router = express.Router();

router.route("/register").post(upload.single("image"), register);
router.route('/login').post(login);

module.exports = router;
