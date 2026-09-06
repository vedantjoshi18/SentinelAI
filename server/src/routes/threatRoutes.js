const express = require('express');
const {
  inspectPayload,
  getThreatEvents,
  getThreatStats,
  getThreatById,
  updateThreatStatus,
} = require('../controllers/threatController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// 1. Sandbox Live Inspection (Exempt from security gateway blocks)
router.post('/inspect', inspectPayload);

// 2. SOC Audit APIs (Restricted to ANALYST and ADMIN roles)
router.get('/', authenticate, authorizeRoles('ANALYST', 'ADMIN'), getThreatEvents);
router.get('/stats', authenticate, authorizeRoles('ANALYST', 'ADMIN'), getThreatStats);
router.get('/:id', authenticate, authorizeRoles('ANALYST', 'ADMIN'), getThreatById);
router.patch('/:id/status', authenticate, authorizeRoles('ANALYST', 'ADMIN'), updateThreatStatus);

module.exports = router;
