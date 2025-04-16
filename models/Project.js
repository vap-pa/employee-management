const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a project name'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  startDate: {
    type: Date,
    required: [true, 'Please add start date'],
  },
  endDate: {
    type: Date,
    required: [true, 'Please add end date'],
  },
  status: {
    type: String,
    enum: ['not started', 'in progress', 'completed', 'on hold'],
    default: 'not started',
  },
  manager: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
    required: true,
  },
  teamMembers: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Employee',
    },
  ],
  tasks: [
    {
      name: String,
      description: String,
      assignedTo: {
        type: mongoose.Schema.ObjectId,
        ref: 'Employee',
      },
      status: {
        type: String,
        enum: ['todo', 'in progress', 'completed'],
        default: 'todo',
      },
      dueDate: Date,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Project', projectSchema);