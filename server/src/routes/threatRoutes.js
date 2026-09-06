const express = require('express');
const { inspectPayload } = require('../controllers/threatController');

const router = express.Router();

/**
 * Sandbox endpoint for live payload security analysis
 * Allows SOC analysts or users to inspect raw strings without triggering gateway blocks
 */
router.post('/inspect', inspectPayload);

module.exports = router;
