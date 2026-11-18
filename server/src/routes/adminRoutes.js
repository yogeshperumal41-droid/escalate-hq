const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserRole } = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// All admin routes strictly require admin role
router.use(protect, authorizeRoles('admin'));

router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);

module.exports = router;
