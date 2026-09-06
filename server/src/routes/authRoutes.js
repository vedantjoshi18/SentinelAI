const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../validators/authValidator');
const { handleValidationErrors } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', validateRegister, handleValidationErrors, register);
router.post('/login', validateLogin, handleValidationErrors, login);
router.get('/me', authenticate, getMe);

module.exports = router;