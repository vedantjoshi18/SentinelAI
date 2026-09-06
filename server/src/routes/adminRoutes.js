const express = require('express');
const {
  getUsers,
  getAdminStats,
  getUserById,
  updateUserRole,
  updateUserStatus,
  unlockUser,
  deleteUser,
} = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Enforce authentication & ADMIN role on all admin routes
router.use(authenticate);
router.use(authorizeRoles('ADMIN'));

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);
router.post('/users/:id/unlock', unlockUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
