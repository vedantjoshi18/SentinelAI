const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Admin Controller for RBAC & User Management
 */

// GET /api/admin/users
async function getUsers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role.toUpperCase();
    }
    if (req.query.status) {
      filter.status = req.query.status.toLowerCase();
    }
    if (req.query.search) {
      const regex = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      details: error.message,
    });
  }
}

// GET /api/admin/stats
async function getAdminStats(req, res) {
  try {
    const [totalUsers, users] = await Promise.all([
      User.countDocuments({}),
      User.find({}).select('role status lockedUntil failedLoginAttempts'),
    ]);

    const byRole = { USER: 0, ANALYST: 0, ADMIN: 0 };
    const byStatus = { active: 0, suspended: 0, locked: 0 };
    let totalLocked = 0;

    const now = new Date();
    for (const u of users) {
      if (byRole[u.role] !== undefined) byRole[u.role]++;
      if (byStatus[u.status] !== undefined) byStatus[u.status]++;
      if (u.status === 'locked' || (u.lockedUntil && u.lockedUntil > now)) {
        totalLocked++;
      }
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalLocked,
        byRole,
        byStatus,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to aggregate administrative statistics',
      details: error.message,
    });
  }
}

// GET /api/admin/users/:id
async function getUserById(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user identifier format',
      });
    }

    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve user details',
      details: error.message,
    });
  }
}

// PATCH /api/admin/users/:id/role
async function updateUserRole(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user identifier format',
      });
    }

    const { role } = req.body;
    const validRoles = ['USER', 'ANALYST', 'ADMIN'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be one of: ' + validRoles.join(', '),
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Protection: Prevent demoting self from ADMIN
    if (req.user._id.toString() === user._id.toString() && role !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        error: 'Administrators cannot demote their own account role',
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User role updated to ' + role,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to update user role',
      details: error.message,
    });
  }
}

// PATCH /api/admin/users/:id/status
async function updateUserStatus(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user identifier format',
      });
    }

    const { status } = req.body;
    const validStatuses = ['active', 'suspended', 'locked'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be one of: ' + validStatuses.join(', '),
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Protection: Prevent suspending self
    if (req.user._id.toString() === user._id.toString() && status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Administrators cannot suspend or lock their own account',
      });
    }

    user.status = status;
    if (status === 'active') {
      user.lockedUntil = null;
      user.failedLoginAttempts = 0;
    }
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User status changed to ' + status,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to update user status',
      details: error.message,
    });
  }
}

// POST /api/admin/users/:id/unlock
async function unlockUser(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user identifier format',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    user.status = 'active';
    user.lockedUntil = null;
    user.failedLoginAttempts = 0;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User account unlocked and reset to active',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        failedLoginAttempts: 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to unlock user account',
      details: error.message,
    });
  }
}

// DELETE /api/admin/users/:id
async function deleteUser(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user identifier format',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Protection: Prevent deleting self
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Administrators cannot delete their own account',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'User ' + user.email + ' successfully deleted',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to delete user account',
      details: error.message,
    });
  }
}

module.exports = {
  getUsers,
  getAdminStats,
  getUserById,
  updateUserRole,
  updateUserStatus,
  unlockUser,
  deleteUser,
};
