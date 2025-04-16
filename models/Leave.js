const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Adjust the path to your sequelize config

const Leave = sequelize.define('Leave', {
  leaveType: {
    type: DataTypes.ENUM('sick', 'casual', 'annual', 'maternity', 'paternity', 'unpaid'),
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  // Define the relationships
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Employees', // Make sure this matches the table name of the Employee model
      key: 'id',
    },
  },
  approvedById: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Employees', // Make sure this matches the table name of the Employee model
      key: 'id',
    },
  },
}, {
  timestamps: true,
});

// Define associations
Leave.associate = (models) => {
  // Employee that is requesting the leave
  Leave.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });

  // Employee that approved the leave
  Leave.belongsTo(models.Employee, { foreignKey: 'approvedById', as: 'approvedBy' });
};

module.exports = Leave;
