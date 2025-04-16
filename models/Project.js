const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');

// Project Model
const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add a project name',
      },
    },
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add a description',
      },
    },
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add start date',
      },
    },
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add end date',
      },
      isAfter(value) {
        if (new Date(value) <= new Date(this.startDate)) {
          throw new Error('End date must be after start date');
        }
      },
    },
  },
  status: {
    type: DataTypes.ENUM('not started', 'in progress', 'completed', 'on hold'),
    defaultValue: 'not started',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  deletedAt: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
});

// Define Relationships

// Manager (Employee) has many Projects
Project.belongsTo(Employee, {
  foreignKey: 'managerId',
  as: 'manager',
});

// Employee belongs to many Projects (as team member)
Project.belongsToMany(Employee, {
  through: 'ProjectTeamMembers',
  as: 'teamMembers',
  foreignKey: 'projectId',
});

// Project has many Tasks
Project.hasMany(Task, {
  foreignKey: 'projectId',
  as: 'tasks',
});

Task.belongsTo(Project, {
  foreignKey: 'projectId',
});

// Add `timestamps` and `paranoid` for soft deletes
Project.addHook('beforeDestroy', (project) => {
  project.deletedAt = new Date();
});

Project.addHook('afterFind', (result) => {
  if (Array.isArray(result)) {
    result.forEach((project) => {
      if (project.deletedAt) {
        project.dataValues.status = 'deleted'; // Mark project as deleted
      }
    });
  } else if (result && result.deletedAt) {
    result.dataValues.status = 'deleted';
  }
});

// Define the Task Model for reference
const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Employees',
      key: 'id',
    },
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('not started', 'in progress', 'completed', 'on hold', 'planned'),
    defaultValue: 'todo',
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

// Example: Employee Model (Already in your schema)
const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('employee', 'manager', 'admin'),
    defaultValue: 'employee',
  },
});

module.exports = { Project, Task, Employee };
