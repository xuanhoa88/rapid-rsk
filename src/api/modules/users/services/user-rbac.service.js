/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

// ========================================================================
// USER RBAC ASSIGNMENT SERVICES
// ========================================================================

/**
 * Assign roles to a user
 *
 * @param {string} userId - User ID
 * @param {string[]} roleIds - Array of role IDs
 * @param {Object} models - Database models
 * @returns {Promise<Object>} User with roles
 */
export async function assignRolesToUser(userId, roleIds, models) {
  const { User, Role } = models;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Verify all roles exist
  const roles = await Role.findAll({
    where: { id: roleIds },
  });

  if (roles.length !== roleIds.length) {
    throw new Error('One or more roles not found');
  }

  // Set roles for user (replaces existing)
  await user.setRoles(roles);

  // Return user with roles
  return await User.findByPk(userId, {
    include: [
      {
        model: Role,
        as: 'roles',
        through: { attributes: [] },
      },
    ],
    attributes: { exclude: ['password'] },
  });
}

/**
 * Assign groups to a user
 *
 * @param {string} userId - User ID
 * @param {string[]} groupIds - Array of group IDs
 * @param {Object} models - Database models
 * @returns {Promise<Object>} User with groups
 */
export async function assignGroupsToUser(userId, groupIds, models) {
  const { User, Group } = models;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Verify all groups exist
  const groups = await Group.findAll({
    where: { id: groupIds },
  });

  if (groups.length !== groupIds.length) {
    throw new Error('One or more groups not found');
  }

  // Set groups for user (replaces existing)
  await user.setGroups(groups);

  // Return user with groups
  return await User.findByPk(userId, {
    include: [
      {
        model: Group,
        as: 'groups',
        through: { attributes: [] },
      },
    ],
    attributes: { exclude: ['password'] },
  });
}

/**
 * Add role to user
 *
 * @param {string} userId - User ID
 * @param {string} roleId - Role ID
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Updated user
 */
export async function addRoleToUser(userId, roleId, models) {
  const { User, Role } = models;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const role = await Role.findByPk(roleId);
  if (!role) {
    throw new Error('Role not found');
  }

  await user.addRole(role);
  return user;
}

/**
 * Remove role from user
 *
 * @param {string} userId - User ID
 * @param {string} roleId - Role ID
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Updated user
 */
export async function removeRoleFromUser(userId, roleId, models) {
  const { User, Role } = models;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const role = await Role.findByPk(roleId);
  if (!role) {
    throw new Error('Role not found');
  }

  await user.removeRole(role);
  return user;
}

/**
 * Add group to user
 *
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Updated user
 */
export async function addGroupToUser(userId, groupId, models) {
  const { User, Group } = models;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const group = await Group.findByPk(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  await user.addGroup(group);
  return user;
}

/**
 * Remove group from user
 *
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Updated user
 */
export async function removeGroupFromUser(userId, groupId, models) {
  const { User, Group } = models;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const group = await Group.findByPk(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  await user.removeGroup(group);
  return user;
}

/**
 * Get user's effective permissions (from roles and groups)
 *
 * @param {string} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<Object[]>} Array of permissions
 */
export async function getUserPermissions(userId, models) {
  const { User, Role, Permission, Group } = models;

  const user = await User.findByPk(userId, {
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
      {
        model: Group,
        as: 'groups',
        through: { attributes: [] },
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
      },
    ],
  });

  if (!user) {
    throw new Error('User not found');
  }

  const permissions = new Set();

  // Add permissions from direct roles
  user.roles.forEach(role => {
    role.permissions.forEach(permission => {
      permissions.add(permission.name);
    });
  });

  // Add permissions from group roles
  user.groups.forEach(group => {
    group.roles.forEach(role => {
      role.permissions.forEach(permission => {
        permissions.add(permission.name);
      });
    });
  });

  return Array.from(permissions).sort();
}

/**
 * Check if user has specific permission
 *
 * @param {string} userId - User ID
 * @param {string} permissionName - Permission name
 * @param {Object} models - Database models
 * @returns {Promise<boolean>} True if user has permission
 */
export async function userHasPermission(userId, permissionName, models) {
  const permissions = await getUserPermissions(userId, models);
  return permissions.includes(permissionName);
}

/**
 * Check if user has any of the specified permissions
 *
 * @param {string} userId - User ID
 * @param {string[]} permissionNames - Array of permission names
 * @param {Object} models - Database models
 * @returns {Promise<boolean>} True if user has any permission
 */
export async function userHasAnyPermission(userId, permissionNames, models) {
  const permissions = await getUserPermissions(userId, models);
  return permissionNames.some(permission => permissions.includes(permission));
}

/**
 * Check if user has all specified permissions
 *
 * @param {string} userId - User ID
 * @param {string[]} permissionNames - Array of permission names
 * @param {Object} models - Database models
 * @returns {Promise<boolean>} True if user has all permissions
 */
export async function userHasAllPermissions(userId, permissionNames, models) {
  const permissions = await getUserPermissions(userId, models);
  return permissionNames.every(permission => permissions.includes(permission));
}

/**
 * Get user's roles
 *
 * @param {string} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<Object[]>} Array of roles
 */
export async function getUserRoles(userId, models) {
  const { User, Role, Permission } = models;

  const user = await User.findByPk(userId, {
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
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user.roles;
}

/**
 * Get user's groups
 *
 * @param {string} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<Object[]>} Array of groups
 */
export async function getUserGroups(userId, models) {
  const { User, Group, Role } = models;

  const user = await User.findByPk(userId, {
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
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user.groups;
}

/**
 * Check if user has specific role
 *
 * @param {string} userId - User ID
 * @param {string} roleName - Role name
 * @param {Object} models - Database models
 * @returns {Promise<boolean>} True if user has role
 */
export async function userHasRole(userId, roleName, models) {
  const roles = await getUserRoles(userId, models);
  return roles.some(role => role.name === roleName);
}

/**
 * Check if user is in specific group
 *
 * @param {string} userId - User ID
 * @param {string} groupName - Group name
 * @param {Object} models - Database models
 * @returns {Promise<boolean>} True if user is in group
 */
export async function userInGroup(userId, groupName, models) {
  const groups = await getUserGroups(userId, models);
  return groups.some(group => group.name === groupName);
}

/**
 * Get user's complete RBAC profile
 *
 * @param {string} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Complete RBAC profile
 */
export async function getUserRBACProfile(userId, models) {
  const { User, Role, Permission, Group } = models;

  const user = await User.findByPk(userId, {
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
      {
        model: Group,
        as: 'groups',
        through: { attributes: [] },
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
      },
    ],
    attributes: { exclude: ['password'] },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get effective permissions
  const permissions = await getUserPermissions(userId, models);

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isActive: user.isActive,
    },
    roles: user.roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map(p => p.name),
    })),
    groups: user.groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      category: group.category,
      type: group.type,
      roles: group.roles.map(role => ({
        id: role.id,
        name: role.name,
        permissions: role.permissions.map(p => p.name),
      })),
    })),
    effectivePermissions: permissions,
  };
}

/**
 * Bulk assign roles to multiple users
 *
 * @param {string[]} userIds - Array of user IDs
 * @param {string[]} roleIds - Array of role IDs
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Assignment result
 */
export async function bulkAssignRolesToUsers(userIds, roleIds, models) {
  const { User, Role } = models;

  // Verify users exist
  const users = await User.findAll({
    where: { id: userIds },
  });

  if (users.length !== userIds.length) {
    throw new Error('One or more users not found');
  }

  // Verify roles exist
  const roles = await Role.findAll({
    where: { id: roleIds },
  });

  if (roles.length !== roleIds.length) {
    throw new Error('One or more roles not found');
  }

  let assignedCount = 0;

  // Assign roles to each user
  for (const user of users) {
    await user.addRoles(roles);
    assignedCount++;
  }

  return {
    assignedCount,
    userIds,
    roleIds,
  };
}

/**
 * Initialize default RBAC setup
 *
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Setup result
 */
export async function initializeDefaultRBAC(models) {
  const { roleService } = require('./role.service');
  const { permissionService } = require('./permission.service');
  const { groupService } = require('./group.service');

  // Create default permissions
  const permissions = await permissionService.createDefaultPermissions(models);

  // Create default roles
  const adminRole = await roleService.createRole(
    {
      name: 'admin',
      description: 'System Administrator - Full access',
    },
    models,
  );

  const userRole = await roleService.createRole(
    {
      name: 'user',
      description: 'Regular User - Basic access',
    },
    models,
  );

  const moderatorRole = await roleService.createRole(
    {
      name: 'moderator',
      description: 'Content Moderator - Limited admin access',
    },
    models,
  );

  // Create default groups
  const groups = await groupService.createDefaultGroups(models);

  // Assign all permissions to admin role
  const allPermissions = await models.Permission.findAll();
  await adminRole.setPermissions(allPermissions);

  // Assign basic permissions to user role
  const basicPermissions = await models.Permission.findAll({
    where: {
      name: {
        [models.Sequelize.Op.in]: [
          'users:read',
          'posts:read',
          'comments:read',
          'files:read',
        ],
      },
    },
  });
  await userRole.setPermissions(basicPermissions);

  // Assign moderation permissions to moderator role
  const moderationPermissions = await models.Permission.findAll({
    where: {
      name: {
        [models.Sequelize.Op.in]: [
          'users:read',
          'posts:read',
          'posts:write',
          'comments:read',
          'comments:write',
          'comments:moderate',
          'files:read',
        ],
      },
    },
  });
  await moderatorRole.setPermissions(moderationPermissions);

  // Assign roles to groups
  const adminGroup = groups.find(g => g.name === 'administrators');
  const staffGroup = groups.find(g => g.name === 'staff');
  const moderatorGroup = groups.find(g => g.name === 'moderators');

  if (adminGroup) {
    await adminGroup.addRole(adminRole);
  }

  if (staffGroup) {
    await staffGroup.addRoles([moderatorRole, userRole]);
  }

  if (moderatorGroup) {
    await moderatorGroup.addRole(moderatorRole);
  }

  return {
    permissions: permissions.length,
    roles: 3,
    groups: groups.length,
    message: 'Default RBAC setup completed successfully',
  };
}
