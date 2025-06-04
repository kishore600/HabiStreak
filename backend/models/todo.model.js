const mongoose = require('mongoose');

const proofSchema = new mongoose.Schema({
  type: { type: String, required: true },
  url: String,     
  content: String  
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  requireProof: { type: Boolean, default: false },
  days: [String],
  completedBy: [
    {
      userDateKey: String,
      proof:  [proofSchema]
    }
  ]
});

const todoSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  tasks: [taskSchema],
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }
});

module.exports = mongoose.model('Todo', todoSchema);
