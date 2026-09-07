const User = require('../models/User');
const { generateToken } = require('../utils/token');
const { behaviourService } = require('../services/behaviourService');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'A user with this email address already exists',
      });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'USER', // Strictly enforce USER role on public self-registration (prevents mass assignment)
    });

    const token = generateToken({ id: user._id, role: user.role });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const clientIp =
      req.ip ||
      req.headers?.['x-forwarded-for'] ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      behaviourService.recordAuthFailure(clientIp);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    if (user.status === 'suspended') {
      behaviourService.recordAuthFailure(clientIp);
      return res.status(403).json({
        success: false,
        error: 'Account is suspended. Please contact a platform administrator.',
      });
    }

    if (user.status === 'locked' && !user.lockedUntil) {
      behaviourService.recordAuthFailure(clientIp);
      return res.status(423).json({
        success: false,
        error: 'Account has been locked by an administrator. Please contact support.',
      });
    }

    if (user.isLocked()) {
      behaviourService.recordAuthFailure(clientIp);
      behaviourService.recordAuthFailure(user._id.toString(), 'USER');
      const remainingMinutes = Math.max(
        1,
        Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000))
      );
      return res.status(423).json({
        success: false,
        error: `Account temporarily locked due to excessive failed attempts. Try again in ${remainingMinutes} minute(s).`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementFailedAttempts();
      behaviourService.recordAuthFailure(clientIp);
      behaviourService.recordAuthFailure(user._id.toString(), 'USER');
      const remainingAttempts = Math.max(0, 5 - user.failedLoginAttempts);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        remainingAttempts,
      });
    }

    await user.resetLoginAttempts();
    behaviourService.recordAuthSuccess(clientIp);
    behaviourService.recordAuthSuccess(user._id.toString());
    const token = generateToken({ id: user._id, role: user.role });

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

module.exports = {
  register,
  login,
  getMe,
};