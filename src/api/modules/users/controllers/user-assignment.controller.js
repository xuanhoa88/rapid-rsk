/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { userRbacService } from '../services';
// Note: HTTP utilities are accessed via req.app.get('http')

// ========================================================================
// USER ASSIGNMENT CONTROLLERS
// ========================================================================

/**
 * Assign roles to a user
 *
 * @route   PUT /api/users/:id/roles
 * @access  Admin (requires 'users:manage' permission)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function assignRolesToUser(req, res) {
  const http = req.app.get('http');
  try {
    const { id } = req.params;
    const { roleIds } = req.body;

    // Validate input
    if (!Array.isArray(roleIds)) {
      return http.sendValidationError(res, {
        roleIds: 'Role IDs must be an array',
      });
    }

    // Get models from app context
    const models = req.app.get('models');

    // Assign roles
    const user = await userRbacService.assignRolesToUser(id, roleIds, models);

    return http.sendSuccess(res, { user });
  } catch (error) {
    if (error.message === 'User not found') {
      return http.sendNotFound(res, error.message);
    }

    if (error.message.includes('roles not found')) {
      return http.sendValidationError(res, {
        roleIds: error.message,
      });
    }

    return http.sendServerError(res, 'Failed to assign roles to user');
  }
}

/**
 * Get user roles
 *
 * @route   GET /api/users/:id/roles
 * @access  Admin (requires 'users:read' permission) or Self
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getUserRoles(req, res) {
  const http = req.app.get('http');
  try {
    const { id } = req.params;
    const models = req.app.get('models');
    const { User, Role, Permission } = models;

    const user = await User.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
          include: [
            {
              model: Permission,
              as: 'permissions',
              through: { attributes: [] },
            },
          ],
        },
      ],
      attributes: ['id', 'email', 'displayName'],
    });

    if (!user) {
      return http.sendNotFound(res, 'User not found');
    }

    return http.sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      roles: user.roles,
    });
  } catch (error) {
    return http.sendServerError(res, 'Failed to get user roles');
  }
}

/**
 * Assign groups to a user
 *
 * @route   PUT /api/users/:id/groups
 * @access  Admin (requires 'users:manage' permission)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function assignGroupsToUser(req, res) {
  const http = req.app.get('http');
  try {
    const { id } = req.params;
    const { groupIds } = req.body;

    // Validate input
    if (!Array.isArray(groupIds)) {
      return http.sendValidationError(res, {
        groupIds: 'Group IDs must be an array',
      });
    }

    // Get models from app context
    const models = req.app.get('models');

    // Assign groups
    const user = await userRbacService.assignGroupsToUser(id, groupIds, models);

    return http.sendSuccess(res, { user });
  } catch (error) {
    if (error.message === 'User not found') {
      return http.sendNotFound(res, error.message);
    }

    if (error.message.includes('groups not found')) {
      return http.sendValidationError(res, {
        groupIds: error.message,
      });
    }

    return http.sendServerError(res, 'Failed to assign groups to user');
  }
}

/**
 * Get user groups
 *
 * @route   GET /api/users/:id/groups
 * @access  Admin (requires 'users:read' permission) or Self
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getUserGroups(req, res) {
  const http = req.app.get('http');
  try {
    const { id } = req.params;
    const models = req.app.get('models');
    const { User, Group, Role } = models;

    const user = await User.findByPk(id, {
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] },
          include: [
            {
              model: Role,
              as: 'roles',
              through: { attributes: [] },
            },
          ],
        },
      ],
      attributes: ['id', 'email', 'displayName'],
    });

    if (!user) {
      return http.sendNotFound(res, 'User not found');
    }

    return http.sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      groups: user.groups,
    });
  } catch (error) {
    return http.sendServerError(res, 'Failed to get user groups');
  }
}

/**
 * Get user's effective permissions
 *
 * @route   GET /api/users/:id/permissions
 * @access  Admin (requires 'users:read' permission) or Self
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getUserPermissions(req, res) {
  const http = req.app.get('http');
  try {
    const { id } = req.params;

    // Get models from app context
    const models = req.app.get('models');

    // Get user permissions
    const permissions = await userRbacService.getUserPermissions(id, models);

    return http.sendSuccess(res, { permissions });
  } catch (error) {
    if (error.message === 'User not found') {
      return http.sendNotFound(res, error.message);
    }

    return http.sendServerError(res, 'Failed to get user permissions');
  }
}

/**
 * Check if user has specific permission
 *
 * @route   GET /api/users/:id/permissions/:permission
 * @access  Admin (requires 'users:read' permission) or Self
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function checkUserPermission(req, res) {
  const http = req.app.get('http');
  try {
    const { id, permission } = req.params;

    // Get models from app context
    const models = req.app.get('models');

    // Check permission
    const hasPermission = await userRbacService.userHasPermission(
      id,
      permission,
      models,
    );

    return http.sendSuccess(res, {
      userId: id,
      permission,
      hasPermission,
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return http.sendNotFound(res, error.message);
    }

    return http.sendServerError(res, 'Failed to check user permission');
  }
}

/**
 * Remove role from user
 *
 * @route   DELETE /api/users/:id/roles/:roleId
 * @access  Admin (requires 'users:manage' permission)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function removeRoleFromUser(req, res) {
  const http = req.app.get('http');
  try {
    const { id, roleId } = req.params;
    const models = req.app.get('models');
    const { User, Role } = models;

    const user = await User.findByPk(id);
    if (!user) {
      return http.sendNotFound(res, 'User not found');
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return http.sendNotFound(res, 'Role not found');
    }

    // Remove role from user
    await user.removeRole(role);

    return http.sendSuccess(res, {
      message: `Role '${role.name}' removed from user successfully`,
    });
  } catch (error) {
    return http.sendServerError(res, 'Failed to remove role from user');
  }
}

/**
 * Remove group from user
 *
 * @route   DELETE /api/users/:id/groups/:groupId
 * @access  Admin (requires 'users:manage' permission)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function removeGroupFromUser(req, res) {
  const http = req.app.get('http');
  try {
    const { id, groupId } = req.params;
    const models = req.app.get('models');
    const { User, Group } = models;

    const user = await User.findByPk(id);
    if (!user) {
      return http.sendNotFound(res, 'User not found');
    }

    const group = await Group.findByPk(groupId);
    if (!group) {
      return http.sendNotFound(res, 'Group not found');
    }

    // Remove group from user
    await user.removeGroup(group);

    return http.sendSuccess(res, {
      message: `Group '${group.name}' removed from user successfully`,
    });
  } catch (error) {
    return http.sendServerError(res, 'Failed to remove group from user');
  }
}
