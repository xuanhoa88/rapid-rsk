/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { userAdminService } from '../services';
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendServerError,
} from '../../../engines/http';

// ========================================================================
// USER ADMINISTRATION CONTROLLERS (Admin Only)
// ========================================================================

/**
 * Get paginated list of all users
 *
 * @route   GET /api/users/list
 * @access  Admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getUserList(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = '',
    } = req.query;

    // Get models from app context
    const models = req.app.get('models');

    // Get user list
    const result = await userAdminService.getUserList(
      { page, limit, search, role, status },
      models,
    );

    return sendSuccess(res, result);
  } catch (error) {
    return sendServerError(res, 'Failed to get user list');
  }
}

/**
 * Get specific user by ID
 *
 * @route   GET /api/users/:id
 * @access  Admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getUserById(req, res) {
  try {
    const { id } = req.params;

    // Get models from app context
    const models = req.app.get('models');

    // Get user by ID
    const user = await userAdminService.getUserWithProfile(id, models);

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    return sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        emailConfirmed: user.emailConfirmed,
        isActive: user.isActive,
        isLocked: user.isLocked,
        failedLoginAttempts: user.failedLoginAttempts,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        displayName: (user.profile && user.profile.displayName) || null,
        firstName: (user.profile && user.profile.firstName) || null,
        lastName: (user.profile && user.profile.lastName) || null,
        picture: (user.profile && user.profile.picture) || null,
        bio: (user.profile && user.profile.bio) || null,
        location: (user.profile && user.profile.location) || null,
        website: (user.profile && user.profile.website) || null,
        role: user.role || 'user',
      },
    });
  } catch (error) {
    return sendServerError(res, 'Failed to get user');
  }
}

/**
 * Update user by ID
 *
 * @route   PUT /api/users/:id
 * @access  Admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function updateUserById(req, res) {
  try {
    const { id } = req.params;
    const {
      email,
      displayName,
      firstName,
      lastName,
      bio,
      location,
      website,
      role,
      isActive,
    } = req.body;

    // Prevent admin from updating themselves
    if (req.user.id === id) {
      return sendError(res, 'Cannot update your own account', 400);
    }

    // Get models from app context
    const models = req.app.get('models');

    // Update user
    const user = await userAdminService.updateUserById(
      id,
      {
        email,
        displayName,
        firstName,
        lastName,
        bio,
        location,
        website,
        role,
        isActive,
      },
      models,
    );

    return sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        emailConfirmed: user.emailConfirmed,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        displayName: (user.profile && user.profile.displayName) || null,
        firstName: (user.profile && user.profile.firstName) || null,
        lastName: (user.profile && user.profile.lastName) || null,
        picture: (user.profile && user.profile.picture) || null,
        bio: (user.profile && user.profile.bio) || null,
        location: (user.profile && user.profile.location) || null,
        website: (user.profile && user.profile.website) || null,
        role: user.role || 'user',
      },
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return sendNotFound(res, error.message);
    }

    if (error.message === 'Email already exists') {
      return sendValidationError(res, {
        email: 'Email is already in use by another user',
      });
    }

    return sendServerError(res, 'Failed to update user');
  }
}

/**
 * Delete user by ID
 *
 * @route   DELETE /api/users/:id
 * @access  Admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function deleteUserById(req, res) {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      return sendValidationError(res, {
        id: 'Cannot delete your own account',
      });
    }

    // Get models from app context
    const models = req.app.get('models');
    const { User } = models;

    // Get user
    const user = await User.findByPk(id);
    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    // Delete user (cascade will handle profile)
    await user.destroy();

    return sendSuccess(res, {
      message: `User ${user.email} deleted successfully`,
    });
  } catch (error) {
    return sendServerError(res, 'Failed to delete user');
  }
}

/**
 * Update user role
 *
 * @route   PUT /api/users/:id/role
 * @access  Admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['user', 'admin', 'moderator'];
    if (!role || !validRoles.includes(role)) {
      return sendValidationError(res, {
        role: `Role must be one of: ${validRoles.join(', ')}`,
      });
    }

    // Prevent admin from changing their own role
    if (req.user.id === id) {
      return sendError(res, 'Cannot change your own role', 400);
    }

    // Get models from app context
    const models = req.app.get('models');

    // Update user role
    const user = await userAdminService.updateUserRole(id, role, models);

    return sendSuccess(res, {
      message: `User role updated to ${role}`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return sendNotFound(res, error.message);
    }

    return sendServerError(res, 'Failed to update user role');
  }
}

/**
 * Update user status (active/inactive)
 *
 * @route   PUT /api/users/:id/status
 * @access  Admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validate status
    if (typeof isActive !== 'boolean') {
      return sendValidationError(res, {
        isActive: 'Status must be true or false',
      });
    }

    // Prevent admin from deactivating themselves
    if (req.user.id === id && !isActive) {
      return sendError(res, 'Cannot deactivate your own account', 400);
    }

    // Get models from app context
    const models = req.app.get('models');

    // Update user status
    const user = await userAdminService.updateUserStatus(id, isActive, models);

    return sendSuccess(res, {
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return sendNotFound(res, error.message);
    }

    return sendServerError(res, 'Failed to update user status');
  }
}

/**
 * Lock/unlock user account
 *
 * @route   PUT /api/users/:id/lock
 * @access  Admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function updateUserLockStatus(req, res) {
  try {
    const { id } = req.params;
    const { isLocked, reason } = req.body;

    // Validate input
    if (typeof isLocked !== 'boolean') {
      return sendValidationError(res, {
        isLocked: 'Lock status must be true or false',
      });
    }

    // Prevent admin from locking themselves
    if (req.user.id === id && isLocked) {
      return sendError(res, 'Cannot lock your own account', 400);
    }

    // Get models from app context
    const models = req.app.get('models');

    // Update user lock status
    const user = await userAdminService.updateUserLockStatus(
      id,
      isLocked,
      reason,
      models,
    );

    return sendSuccess(res, {
      message: `User account ${isLocked ? 'locked' : 'unlocked'} successfully`,
      user: {
        id: user.id,
        email: user.email,
        isLocked: user.isLocked,
        failedLoginAttempts: user.failedLoginAttempts,
      },
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return sendNotFound(res, error.message);
    }

    return sendServerError(res, 'Failed to update user lock status');
  }
}

/**
 * Get user statistics
 *
 * @route   GET /api/users/stats
 * @access  Admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getUserStats(req, res) {
  try {
    // Get models from app context
    const models = req.app.get('models');

    // Get user statistics
    const stats = await userAdminService.getUserStats(models);

    return sendSuccess(res, { stats });
  } catch (error) {
    return sendServerError(res, 'Failed to get user statistics');
  }
}

/**
 * Bulk update users
 *
 * @route   PUT /api/users/bulk
 * @access  Admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function bulkUpdateUsers(req, res) {
  try {
    const { userIds, updates } = req.body;

    // Validate input
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return sendValidationError(res, {
        userIds: 'User IDs must be a non-empty array',
      });
    }

    if (!updates || typeof updates !== 'object') {
      return sendValidationError(res, {
        updates: 'Updates must be an object',
      });
    }

    // Prevent admin from updating themselves
    if (userIds.includes(req.user.id)) {
      return sendError(res, 'Cannot bulk update your own account', 400);
    }

    // Get models from app context
    const models = req.app.get('models');

    // Perform bulk update
    const result = await userAdminService.bulkUpdateUsers(
      userIds,
      updates,
      models,
    );

    return sendSuccess(res, {
      message: `${result.updatedCount} users updated successfully`,
      ...result,
    });
  } catch (error) {
    return sendServerError(res, 'Failed to bulk update users');
  }
}
