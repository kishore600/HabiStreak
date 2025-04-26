import express from 'express';
import {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  createTodoForGroup,
  markTaskComplete,
  getLeaderboard,
} from '../controllers/group.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/',protect, createGroup);
router.get('/',protect, getGroups);
router.get('/:groupId',protect, getGroupById);
router.put('/:groupId',protect, updateGroup);
router.delete('/:groupId',protect, deleteGroup);
router.post('/:groupId/todo',protect, createTodoForGroup);
router.put('/:groupId/task/:taskId/complete',protect, markTaskComplete);
router.get('/:groupId/leaderboard',protect, getLeaderboard);

export default router;
