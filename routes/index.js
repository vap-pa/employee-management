const express = require('express');
const authRoutes = require('./authRoutes');
const employeeRoutes = require('./employeeRoutes');
const funTaskRoutes = require('./funTaskRoutes');
const leaveRoutes = require('./leaveRoutes');
const projectRoutes = require('./projectRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/fun-tasks', funTaskRoutes);
router.use('/leaves', leaveRoutes);
router.use('/projects', projectRoutes);

module.exports = router;