const express = require('express');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addProjectTask,
  updateProjectTask,
  deleteProjectTask,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getProjects)
  .post(authorize('manager', 'admin'), createProject);

router.route('/employee/:employeeId').get(getProjects);

router
  .route('/:id')
  .get(getProject)
  .put(authorize('manager', 'admin'), updateProject)
  .delete(authorize('manager', 'admin'), deleteProject);

router
  .route('/:id/tasks')
  .post(authorize('manager', 'admin'), addProjectTask);

router
  .route('/:id/tasks/:taskId')
  .put(updateProjectTask)
  .delete(authorize('manager', 'admin'), deleteProjectTask);

module.exports = router;