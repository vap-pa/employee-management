const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const validator = require('validator');

// Employee Model
const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add a name'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Please provide a valid email'
      },
      notEmpty: {
        msg: 'Please add an email'
      }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [6],
        msg: 'Password must be at least 6 characters'
      },
      notEmpty: {
        msg: 'Please add a password'
      }
    }
  },
  role: {
    type: DataTypes.ENUM('employee', 'manager', 'admin'),
    defaultValue: 'employee'
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add a department'
      }
    }
  },
  position: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add a position'
      }
    }
  },
  joiningDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  contactNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add a contact number'
      }
    }
  },
  profilePicture: {
    type: DataTypes.STRING,
    defaultValue: 'default.jpg'
  },
  leavesTaken: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  funTaskPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  hooks: {
    beforeSave: async (employee) => {
      if (employee.changed('password')) {
        employee.password = await bcrypt.hash(employee.password, 12);
      }
    }
  }
});

// FunTask Model
const FunTask = sequelize.define('FunTask', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add a title'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add a description'
      }
    }
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add points'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'approved'),
    defaultValue: 'pending'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

// Leave Model
const Leave = sequelize.define('Leave', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  leaveType: {
    type: DataTypes.ENUM('sick', 'casual', 'annual', 'maternity', 'paternity', 'unpaid'),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please select leave type'
      }
    }
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add start date'
      }
    }
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add end date'
      }
    }
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add reason'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  }
});

// Project Model
const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add a project name'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add a description'
      }
    }
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add start date'
      }
    }
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add end date'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('not started', 'in progress', 'completed', 'on hold'),
    defaultValue: 'not started'
  }
});

// Task Model (embedded in Project)
const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('todo', 'in progress', 'completed'),
    defaultValue: 'todo'
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
});

// Define Relationships

// Employee has many FunTasks (as creator)
Employee.hasMany(FunTask, {
  foreignKey: 'createdById',
  as: 'createdFunTasks'  // Changed from 'createdTasks'
});
FunTask.belongsTo(Employee, {
  foreignKey: 'createdById',
  as: 'createdBy'
});

// Employee has many FunTasks (as assignee)
Employee.hasMany(FunTask, {
  foreignKey: 'assignedToId',
  as: 'assignedFunTasks'  // Changed from 'assignedTasks'
});
FunTask.belongsTo(Employee, {
  foreignKey: 'assignedToId',
  as: 'assignedTo'
});

// Employee has many Leaves
Employee.hasMany(Leave, {
  foreignKey: 'employeeId'
});
Leave.belongsTo(Employee, {
  foreignKey: 'employeeId',
  as: 'employee'
});

// Employee (manager) approves Leaves
Employee.hasMany(Leave, {
  foreignKey: 'approvedById',
  as: 'approvedLeaves'
});
Leave.belongsTo(Employee, {
  foreignKey: 'approvedById',
  as: 'approvedBy'
});

// Employee (manager) has many Projects
Employee.hasMany(Project, {
  foreignKey: 'managerId',
  as: 'managedProjects'
});
Project.belongsTo(Employee, {
  foreignKey: 'managerId',
  as: 'manager'
});

// Employee belongs to many Projects (as team member)
Employee.belongsToMany(Project, {
  through: 'ProjectTeamMembers',
  as: 'projects',
  foreignKey: 'employeeId'
});
Project.belongsToMany(Employee, {
  through: 'ProjectTeamMembers',
  as: 'teamMembers',
  foreignKey: 'projectId'
});

// Project has many Tasks
Project.hasMany(Task, {
  foreignKey: 'projectId',
  as: 'projectTasks'  // Changed from 'tasks'
});
Task.belongsTo(Project, {
  foreignKey: 'projectId'
});

// Task assigned to Employee
Employee.hasMany(Task, {
  foreignKey: 'assignedToId',
  as: 'assignedProjectTasks'  // Changed from 'assignedTasks'
});
Task.belongsTo(Employee, {
  foreignKey: 'assignedToId',
  as: 'assignedTo'
});

// Add instance method to Employee for password comparison
Employee.prototype.correctPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = {
  Employee,
  FunTask,
  Leave,
  Project,
  Task
};