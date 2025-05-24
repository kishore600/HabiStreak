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
  updateTodoForGroup,
  requestToJoinGroup,
  acceptJoinRequest,
  getMemberAnalytics,
  getUserVsGroupAnalytics,
} = require('../controllers/group.controller');
const { protect } = require('../middleware/auth.middleware');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.post('/', protect,upload.single("image"), createGroup);
router.get('/user', protect, getuserGroups);
router.get('/', protect, getGroups);
router.get('/:groupId', protect, getGroupById);
router.put('/:groupId', protect,upload.single("image"), updateGroup);
router.delete('/:groupId', protect, deleteGroup);
router.post('/:groupId/todo', protect, createTodoForGroup);
router.put('/:groupId/todos/:taskId/complete', protect, upload.array("images"), markTaskComplete);
router.get('/:groupId/leaderboard', protect, getLeaderboard);
router.put('/:groupId/todo',protect, updateTodoForGroup);
router.post('/:groupId/join-request', protect, requestToJoinGroup);
router.post('/:groupId/accept-request', protect, acceptJoinRequest);
router.get("/:groupId/members", getMemberAnalytics);
router.get("/:groupId/comparison", protect, getUserVsGroupAnalytics);

module.exports = router;
