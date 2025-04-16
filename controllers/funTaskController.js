const { FunTask, Employee } = require('../models');

// @desc    Get all fun tasks
// @route   GET /api/fun-tasks
// @access  Private
exports.getFunTasks = async (req, res, next) => {
  try {
    let whereCondition = {};
    
    if (req.params.employeeId) {
      whereCondition.assignedTo = req.params.employeeId;  // Use correct field for foreign key
    }

    const funTasks = await FunTask.findAll({
      where: whereCondition,
      include: [
        {
          model: Employee,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Employee,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: funTasks.length,
      data: funTasks
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single fun task
// @route   GET /api/fun-tasks/:id
// @access  Private
exports.getFunTask = async (req, res, next) => {
  try {
    const funTask = await FunTask.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Employee,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!funTask) {
      return res.status(404).json({
        success: false,
        message: `Fun task not found with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: funTask
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create fun task
// @route   POST /api/fun-tasks
// @access  Private/Manager
exports.createFunTask = async (req, res, next) => {
  try {
    req.body.createdBy = req.employee.id;  // Correct field to be used in Sequelize

    const funTask = await FunTask.create(req.body);

    const newFunTask = await FunTask.findByPk(funTask.id, {
      include: [
        {
          model: Employee,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Employee,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: newFunTask
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

// @desc    Update fun task
// @route   PUT /api/fun-tasks/:id
// @access  Private
exports.updateFunTask = async (req, res, next) => {
  try {
    let funTask = await FunTask.findByPk(req.params.id);

    if (!funTask) {
      return res.status(404).json({
        success: false,
        message: `Fun task not found with id of ${req.params.id}`
      });
    }

    // Make sure employee is task creator or admin
    if (
      funTask.createdBy !== req.employee.id &&
      req.employee.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: `Not authorized to update this task`
      });
    }

    // If task is being marked as completed, set completedAt
    if (req.body.status === 'completed' && funTask.status !== 'completed') {
      req.body.completedAt = new Date();
    }

    await FunTask.update(req.body, {
      where: { id: req.params.id }
    });

    // If task is completed, update employee's points
    if (req.body.status === 'completed') {
      const employee = await Employee.findByPk(funTask.assignedTo);
      employee.funTaskPoints += funTask.points;
      await employee.save();
    }

    const updatedFunTask = await FunTask.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Employee,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: updatedFunTask
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete fun task
// @route   DELETE /api/fun-tasks/:id
// @access  Private/Manager
exports.deleteFunTask = async (req, res, next) => {
  try {
    const funTask = await FunTask.findByPk(req.params.id);

    if (!funTask) {
      return res.status(404).json({
        success: false,
        message: `Fun task not found with id of ${req.params.id}`
      });
    }

    // Make sure employee is task creator or admin
    if (
      funTask.createdBy !== req.employee.id &&
      req.employee.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: `Not authorized to delete this task`
      });
    }

    await funTask.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
