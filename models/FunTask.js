const mongoose = require('mongoose');

const funTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  points: {
    type: Number,
    required: [true, 'Please add points'],
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'approved'],
    default: 'pending',
  },
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('FunTask', funTaskSchema);