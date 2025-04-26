const express = require('express');
const { markTodo, getTodosByGroup } = require('../controllers/todo.controller.js');

const router = express.Router();

router.post('/mark', markTodo);
router.get('/:groupId', getTodosByGroup);

module.exports = router;
