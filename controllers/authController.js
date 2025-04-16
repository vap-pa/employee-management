const { Employee } = require('../models');
const generateToken = require('../config/jwt');

// Helper function to send token response
const sendTokenResponse = (employee, statusCode, res) => {
  const token = generateToken(employee.id);

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  console.log({})
  res.status(statusCode).json({
    success: true,
    token,
    data: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role
    }
  });
};

// @desc    Register employee
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, department, position, contactNumber } = req.body;

    const employee = await Employee.create({
      name,
      email,
      password,
      role,
      department,
      position,
      contactNumber
    });

    sendTokenResponse(employee, 200, res);
  } catch (err) {
    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(error => error.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    // Handle duplicate email
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    next(err);
  }
};

// @desc    Login employee
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for employee with password
    const employee = await Employee.findOne({ 
      where: { email },
      attributes: ['id', 'name', 'email', 'password', 'role']
    });

    console.log(employee)

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await employee.correctPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    sendTokenResponse(employee, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in employee
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.employee.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (err) {
    next(err);
  }
};