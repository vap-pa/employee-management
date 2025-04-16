const { Leave, Employee } = require('../models');

// @desc    Get all leaves
// @route   GET /api/leaves
// @access  Private/Manager
exports.getLeaves = async (req, res, next) => {
  try {
    let whereCondition = {};
    
    if (req.params.employeeId) {
      whereCondition.employeeId = req.params.employeeId;
    }

    const leaves = await Leave.findAll({
      where: whereCondition,
      include: [
        {
          model: Employee,
          as: 'employee',  // Matches the alias defined in associations
          attributes: ['id', 'name', 'email']
        },
        {
          model: Employee,
          as: 'approvedBy',  // Matches the alias defined in associations
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['startDate', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single leave
// @route   GET /api/leaves/:id
// @access  Private
exports.getLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Employee,
          as: 'approvedBy',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: `Leave not found with id of ${req.params.id}`
      });
    }

    // Make sure employee is leave owner or manager/admin
    if (
      leave.employeeId !== req.employee.id &&
      req.employee.role !== 'manager' &&
      req.employee.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: `Not authorized to access this leave`
      });
    }

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create leave
// @route   POST /api/leaves
// @access  Private
exports.createLeave = async (req, res, next) => {
  try {
    req.body.employeeId = req.employee.id;

    const leave = await Leave.create(req.body);

    const newLeave = await Leave.findByPk(leave.id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: newLeave
    });
  } catch (err) {
    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(error => error.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    next(err);
  }
};

// @desc    Update leave status
// @route   PUT /api/leaves/:id/status
// @access  Private/Manager
exports.updateLeaveStatus = async (req, res, next) => {
  try {
    let leave = await Leave.findByPk(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: `Leave not found with id of ${req.params.id}`
      });
    }

    // Only manager or admin can update leave status
    if (req.employee.role !== 'manager' && req.employee.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `Not authorized to update leave status`
      });
    }

    // Update leave status and approvedById
    leave.status = req.body.status;
    leave.approvedById = req.employee.id;

    // If leave is approved, update employee's leavesTaken
    if (req.body.status === 'approved' && leave.status !== 'approved') {
      const employee = await Employee.findByPk(leave.employeeId);
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      employee.leavesTaken += days;
      await employee.save();
    }

    await leave.save();

    const updatedLeave = await Leave.findByPk(leave.id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Employee,
          as: 'approvedBy',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: updatedLeave
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete leave
// @route   DELETE /api/leaves/:id
// @access  Private
exports.deleteLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findByPk(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: `Leave not found with id of ${req.params.id}`
      });
    }

    // Make sure employee is leave owner or admin
    if (
      leave.employeeId !== req.employee.id &&
      req.employee.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: `Not authorized to delete this leave`
      });
    }

    await leave.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
