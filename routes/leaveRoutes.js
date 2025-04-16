const express = require('express');
const {
  getLeaves,
  getLeave,
  createLeave,
  updateLeaveStatus,
  deleteLeave,
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/').get(authorize('manager', 'admin'), getLeaves).post(createLeave);

router.route('/employee/:employeeId').get(getLeaves);

router
  .route('/:id')
  .get(getLeave)
  .delete(deleteLeave);

router
  .route('/:id/status')
  .put(authorize('manager', 'admin'), updateLeaveStatus);

module.exports = router;