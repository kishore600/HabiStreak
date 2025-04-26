
import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.route("/register").post(upload.single("image"), register)
router.route('/login').post(login);

export default router;
