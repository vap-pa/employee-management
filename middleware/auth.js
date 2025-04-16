const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // No token present
  if (!token) {
    console.log('❌ No token found in request');
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Decoded token:', decoded);

    // Fetch employee using Sequelize
    const employee = await Employee.findByPk(decoded.id);
    console.log('✅ Fetched employee:', employee ? employee.dataValues : null);

    // Employee not found
    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'No employee found with this token',
      });
    }

    // Attach employee to request
    req.employee = employee;
    next();
  } catch (err) {
    console.error('❌ JWT verification failed:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.employee.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.employee.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
