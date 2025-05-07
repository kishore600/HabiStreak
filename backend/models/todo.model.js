const mongoose = require('mongoose');


const taskSchema = new mongoose.Schema({
  title: String,
  completedBy: [{ type: String }] 
});

const todoSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  tasks: [taskSchema],
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }
});

module.exports = mongoose.model('Todo', todoSchema);
