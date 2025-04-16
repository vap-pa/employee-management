const express = require('express');
const {
  getFunTasks,
  getFunTask,
  createFunTask,
  updateFunTask,
  deleteFunTask,
} = require('../controllers/funTaskController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getFunTasks)
  .post(authorize('manager', 'admin'), createFunTask);

router
  .route('/:id')
  .get(getFunTask)
  .put(updateFunTask)
  .delete(authorize('manager', 'admin'), deleteFunTask);

router.route('/employee/:employeeId').get(getFunTasks);

module.exports = router;