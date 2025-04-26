
import express from 'express';
import { markTodo, getTodosByGroup } from '../controllers/todo.controller.js';
const router = express.Router();

router.post('/mark', markTodo);
router.get('/:groupId', getTodosByGroup);

export default router;