const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Import sequelize instance

// Define the FunTask model
const FunTask = sequelize.define('FunTask', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'approved'),
    defaultValue: 'pending',
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Define relationships (associations)
FunTask.belongsTo(Employee, { foreignKey: 'createdBy', as: 'creator' });
FunTask.belongsTo(Employee, { foreignKey: 'assignedTo', as: 'assignee' });

module.exports = FunTask;
