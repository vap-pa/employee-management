const { Project, Employee, Task } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    let whereCondition = {};
    let includeCondition = [
      {
        model: Employee,
        as: 'manager',
        attributes: ['id', 'name', 'email']
      },
      {
        model: Employee,
        as: 'teamMembers',
        attributes: ['id', 'name', 'email'],
        through: { attributes: [] }
      },
      {
        model: Task,
        as: 'projectTasks',
        include: [
          {
            model: Employee,
            as: 'assignedTo',
            attributes: ['id', 'name', 'email']
          }
        ]
      }
    ];

    // Filtering projects by employee ID
    if (req.params.employeeId) {
      whereCondition = {
        [Op.or]: [
          { managerId: req.params.employeeId },
          { '$teamMembers.id$': req.params.employeeId }
        ]
      };
    }

    const projects = await Project.findAll({
      where: whereCondition,
      include: includeCondition,
      order: [['startDate', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Employee,
          as: 'teamMembers',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] }
        },
        {
          model: Task,
          as: 'projectTasks',
          include: [
            {
              model: Employee,
              as: 'assignedTo',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id of ${req.params.id}`
      });
    }

    // Make sure employee is part of the project or admin
    const isTeamMember = project.teamMembers.some(
      member => member.id === req.employee.id
    );
    
    if (
      !isTeamMember &&
      project.managerId !== req.employee.id &&
      req.employee.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: `Not authorized to access this project`
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private/Manager
exports.createProject = async (req, res, next) => {
  try {
    req.body.managerId = req.employee.id;

    const project = await Project.create(req.body, {
      include: [
        {
          model: Employee,
          as: 'teamMembers'
        }
      ]
    });

    // If teamMembers are provided, add them to the project
    if (req.body.teamMembers && req.body.teamMembers.length > 0) {
      await project.setTeamMembers(req.body.teamMembers);
    }

    const newProject = await Project.findByPk(project.id, {
      include: [
        {
          model: Employee,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Employee,
          as: 'teamMembers',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: newProject
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

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private/Manager
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id of ${req.params.id}`
      });
    }

    // Make sure employee is project manager or admin
    if (
      project.managerId !== req.employee.id &&
      req.employee.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: `Not authorized to update this project`
      });
    }

    // Update basic project info
    await project.update(req.body);

    // Update team members if provided
    if (req.body.teamMembers) {
      await project.setTeamMembers(req.body.teamMembers);
    }

    const updatedProject = await Project.findByPk(project.id, {
      include: [
        {
          model: Employee,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Employee,
          as: 'teamMembers',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] }
        },
        {
          model: Task,
          as: 'projectTasks',
          include: [
            {
              model: Employee,
              as: 'assignedTo',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: updatedProject
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Manager
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id of ${req.params.id}`
      });
    }

    // Make sure employee is project manager or admin
    if (
      project.managerId !== req.employee.id &&
      req.employee.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: `Not authorized to delete this project`
      });
    }

    await project.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add task to project
// @route   POST /api/projects/:id/tasks
// @access  Private/Manager
exports.addProjectTask = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id of ${req.params.id}`
      });
    }

    // Make sure employee is project manager or admin
    if (
      project.managerId !== req.employee.id &&
      req.employee.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: `Not authorized to add tasks to this project`
      });
    }

    req.body.projectId = project.id;
    const task = await Task.create(req.body);

    const newTask = await Task.findByPk(task.id, {
      include: [
        {
          model: Employee,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    const updatedProject = await Project.findByPk(project.id, {
      include: [
        {
          model: Employee,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Employee,
          as: 'teamMembers',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] }
        },
        {
          model: Task,
          as: 'projectTasks',
          include: [
            {
              model: Employee,
              as: 'assignedTo',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: updatedProject
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update project task
// @route   PUT /api/projects/:id/tasks/:taskId
// @access  Private
exports.updateProjectTask = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: Task,
          as: 'projectTasks',
          where: { id: req.params.taskId }
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project or task not found`
      });
    }

    const task = project.projectTasks[0];

    // Make sure employee is task assignee or project manager or admin
    if (
      task.assignedToId !== req.employee.id &&
      project.managerId !== req.employee.id &&
      req.employee.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: `Not authorized to update this task`
      });
    }

    await task.update(req.body);

    const updatedProject = await Project.findByPk(project.id, {
      include: [
        {
          model: Employee,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Employee,
          as: 'teamMembers',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] }
        },
        {
          model: Task,
          as: 'projectTasks',
          include: [
            {
              model: Employee,
              as: 'assignedTo',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: updatedProject
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete project task
// @route   DELETE /api/projects/:id/tasks/:taskId
// @access  Private/Manager
exports.deleteProjectTask = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: Task,
          as: 'projectTasks',
          where: { id: req.params.taskId }
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project or task not found`
      });
    }

    const task = project.projectTasks[0];

    // Make sure employee is project manager or admin
    if (
      project.managerId !== req.employee.id &&
      req.employee.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: `Not authorized to delete this task`
      });
    }

    await task.destroy();

    const updatedProject = await Project.findByPk(project.id, {
      include: [
        {
          model: Employee,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Employee,
          as: 'teamMembers',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] }
        },
        {
          model: Task,
          as: 'projectTasks',
          include: [
            {
              model: Employee,
              as: 'assignedTo',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: updatedProject
    });
  } catch (err) {
    next(err);
  }
};