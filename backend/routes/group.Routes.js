const express = require('express');
const {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  createTodoForGroup,
  markTaskComplete,
  getLeaderboard,
  getuserGroups,
} = require('../controllers/group.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware.js');

const router = express.Router();

router.post('/', protect,upload.single("image"), createGroup);
router.get('/user', protect, getuserGroups);
router.get('/', protect, getGroups);
router.get('/:groupId', protect, getGroupById);
router.put('/:groupId', protect,upload.single("image"), updateGroup);
router.delete('/:groupId', protect, deleteGroup);
router.post('/:groupId/todo', protect, createTodoForGroup);
router.put('/:groupId/task/:taskId/complete', protect, markTaskComplete);
router.get('/:groupId/leaderboard', protect, getLeaderboard);

module.exports = router;
