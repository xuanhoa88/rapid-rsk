/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { hashPassword } from '../utils/password';

// ========================================================================
// USER ADMINISTRATION SERVICES
// ========================================================================

/**
 * Get users with pagination and search
 *
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {string} options.search - Search term (default: '')
 * @param {string} options.role - Filter by role (default: '')
 * @param {string} options.status - Filter by status (default: '')
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Users with pagination info
 */
export async function getUserList(options, models) {
  const { page = 1, limit = 10, search = '', role = '', status = '' } = options;
  const offset = (page - 1) * limit;
  const { User, UserProfile } = models;

  // Build where conditions
  const whereConditions = {};
  const profileWhereConditions = {};

  // Search in email and display name
  if (search) {
    whereConditions[models.Sequelize.Op.or] = [
      { email: { [models.Sequelize.Op.iLike]: `%${search}%` } },
    ];
    profileWhereConditions[models.Sequelize.Op.or] = [
      { displayName: { [models.Sequelize.Op.iLike]: `%${search}%` } },
      { firstName: { [models.Sequelize.Op.iLike]: `%${search}%` } },
      { lastName: { [models.Sequelize.Op.iLike]: `%${search}%` } },
    ];
  }

  // Filter by role
  if (role) {
    whereConditions.role = role;
  }

  // Filter by status
  if (status === 'active') {
    whereConditions.isActive = true;
  } else if (status === 'inactive') {
    whereConditions.isActive = false;
  } else if (status === 'locked') {
    whereConditions.isLocked = true;
  }

  const { count, rows: users } = await User.findAndCountAll({
    where: whereConditions,
    include: [
      {
        model: UserProfile,
        as: 'profile',
        where: search ? profileWhereConditions : undefined,
        required: false,
      },
    ],
    attributes: { exclude: ['password'] },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
  });

  return {
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit),
    },
  };
}

/**
 * Get user by ID with full details
 *
 * @param {string} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<Object>} User with profile and additional details
 * @throws {Error} If user not found
 */
export async function getUserById(userId, models) {
  const { User, UserProfile, UserLogin } = models;

  const user = await User.findByPk(userId, {
    include: [{ model: UserProfile, as: 'profile' }],
    attributes: { exclude: ['password'] },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get additional stats
  const loginCount = UserLogin
    ? await UserLogin.count({
        where: { userId, success: true },
      })
    : 0;

  const lastLogin = UserLogin
    ? await UserLogin.findOne({
        where: { userId, success: true },
        order: [['loginAt', 'DESC']],
        attributes: ['loginAt', 'ipAddress'],
      })
    : null;

  return {
    ...user.toJSON(),
    stats: {
      loginCount,
      lastLogin: (lastLogin && lastLogin.loginAt) || null,
      lastLoginIp: (lastLogin && lastLogin.ipAddress) || null,
    },
  };
}

/**
 * Update user by admin
 *
 * @param {string} userId - User ID
 * @param {Object} userData - User data to update
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Updated user with profile
 * @throws {Error} If user not found or email already exists
 */
export async function updateUserById(userId, userData, models) {
  const { User, UserProfile } = models;
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
  } = userData;

  const user = await User.findByPk(userId, {
    include: [{ model: UserProfile, as: 'profile' }],
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if email is already taken by another user
  if (email && email !== user.email) {
    const existingUser = await User.findOne({
      where: { email, id: { [models.Sequelize.Op.ne]: userId } },
    });
    if (existingUser) {
      throw new Error('Email already exists');
    }
  }

  // Update user fields
  const userUpdates = {};
  if (email) userUpdates.email = email;
  if (role) userUpdates.role = role;
  if (typeof isActive === 'boolean') userUpdates.isActive = isActive;

  if (Object.keys(userUpdates).length > 0) {
    await user.update(userUpdates);
  }

  // Update profile fields
  const profileUpdates = {};
  if (displayName !== undefined) profileUpdates.displayName = displayName;
  if (firstName !== undefined) profileUpdates.firstName = firstName;
  if (lastName !== undefined) profileUpdates.lastName = lastName;
  if (bio !== undefined) profileUpdates.bio = bio;
  if (location !== undefined) profileUpdates.location = location;
  if (website !== undefined) profileUpdates.website = website;

  if (Object.keys(profileUpdates).length > 0) {
    if (user.profile) {
      await user.profile.update(profileUpdates);
    } else {
      await UserProfile.create({
        userId,
        ...profileUpdates,
      });
    }
  }

  // Reload user with updated data
  await user.reload({
    include: [{ model: UserProfile, as: 'profile' }],
    attributes: { exclude: ['password'] },
  });

  return user;
}

/**
 * Delete user by admin
 *
 * @param {string} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<boolean>} Success status
 * @throws {Error} If user not found
 */
export async function deleteUserById(userId, models) {
  const { User } = models;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Delete user (cascade will handle related records)
  await user.destroy();

  return true;
}

/**
 * Update user role
 *
 * @param {string} userId - User ID
 * @param {string} role - New role
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Updated user
 * @throws {Error} If user not found
 */
export async function updateUserRole(userId, role, models) {
  const { User } = models;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  await user.update({ role });

  return user;
}

/**
 * Update user status (active/inactive)
 *
 * @param {string} userId - User ID
 * @param {boolean} isActive - Active status
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Updated user
 * @throws {Error} If user not found
 */
export async function updateUserStatus(userId, isActive, models) {
  const { User } = models;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  await user.update({ isActive });

  return user;
}

/**
 * Update user lock status
 *
 * @param {string} userId - User ID
 * @param {boolean} isLocked - Lock status
 * @param {string} reason - Lock reason (optional)
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Updated user
 * @throws {Error} If user not found
 */
export async function updateUserLockStatus(userId, isLocked, reason, models) {
  const { User } = models;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const updates = {
    isLocked,
    lockReason: isLocked ? reason : null,
  };

  // Reset failed login attempts when unlocking
  if (!isLocked) {
    updates.failedLoginAttempts = 0;
  }

  await user.update(updates);

  return user;
}

/**
 * Get user statistics
 *
 * @param {Object} models - Database models
 * @returns {Promise<Object>} User statistics
 */
export async function getUserStats(models) {
  const { User, UserLogin } = models;

  // Get user counts
  const totalUsers = await User.count();
  const activeUsers = await User.count({ where: { isActive: true } });
  const inactiveUsers = await User.count({ where: { isActive: false } });
  const lockedUsers = await User.count({ where: { isLocked: true } });
  const verifiedUsers = await User.count({ where: { emailConfirmed: true } });

  // Get role distribution
  const roleStats = await User.findAll({
    attributes: [
      'role',
      [models.Sequelize.fn('COUNT', models.Sequelize.col('role')), 'count'],
    ],
    group: ['role'],
    raw: true,
  });

  // Get recent registrations (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentRegistrations = await User.count({
    where: {
      createdAt: {
        [models.Sequelize.Op.gte]: thirtyDaysAgo,
      },
    },
  });

  // Get login statistics (if UserLogin model exists)
  let loginStats = null;
  if (UserLogin) {
    const totalLogins = await UserLogin.count({ where: { success: true } });
    const uniqueLoginsToday = await UserLogin.count({
      distinct: true,
      col: 'userId',
      where: {
        success: true,
        loginAt: {
          [models.Sequelize.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    loginStats = {
      totalLogins,
      uniqueLoginsToday,
    };
  }

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      locked: lockedUsers,
      verified: verifiedUsers,
      recentRegistrations,
    },
    roles: roleStats.reduce((acc, stat) => {
      acc[stat.role] = parseInt(stat.count);
      return acc;
    }, {}),
    logins: loginStats,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Bulk update users
 *
 * @param {string[]} userIds - Array of user IDs
 * @param {Object} updates - Updates to apply
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Update result
 */
export async function bulkUpdateUsers(userIds, updates, models) {
  const { User, UserProfile } = models;

  // Separate user and profile updates
  const userUpdates = {};
  const profileUpdates = {};

  // User fields
  if (updates.role) userUpdates.role = updates.role;
  if (typeof updates.isActive === 'boolean')
    userUpdates.isActive = updates.isActive;
  if (typeof updates.isLocked === 'boolean')
    userUpdates.isLocked = updates.isLocked;

  // Profile fields
  if (updates.displayName !== undefined)
    profileUpdates.displayName = updates.displayName;
  if (updates.firstName !== undefined)
    profileUpdates.firstName = updates.firstName;
  if (updates.lastName !== undefined)
    profileUpdates.lastName = updates.lastName;

  let updatedCount = 0;

  // Update users
  if (Object.keys(userUpdates).length > 0) {
    const [affectedRows] = await User.update(userUpdates, {
      where: { id: userIds },
    });
    updatedCount = affectedRows;
  }

  // Update profiles
  if (Object.keys(profileUpdates).length > 0) {
    await UserProfile.update(profileUpdates, {
      where: { userId: userIds },
    });
  }

  return {
    updatedCount,
    userIds,
    updates: { ...userUpdates, ...profileUpdates },
  };
}

/**
 * Reset user password (admin action)
 *
 * @param {string} userId - User ID
 * @param {string} newPassword - New password
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Updated user
 * @throws {Error} If user not found
 */
export async function resetUserPassword(userId, newPassword, models) {
  const { User } = models;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password and reset security fields
  await user.update({
    password: hashedPassword,
    failedLoginAttempts: 0,
    isLocked: false,
  });

  return user;
}
