/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { hashPassword, verifyPassword } from '../utils/password';

// ========================================================================
// AUTHENTICATION SERVICES
// ========================================================================

/**
 * Register a new user
 *
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.displayName - User display name (optional)
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Created user with profile
 * @throws {Error} If user already exists or creation fails
 */
export async function registerUser(userData, models) {
  const { email, password, displayName } = userData;
  const { User, UserProfile } = models;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user with profile
  const user = await User.create(
    {
      email,
      emailConfirmed: false,
      password: hashedPassword,
      isActive: true,
      isLocked: false,
      failedLoginAttempts: 0,
      role: 'user',
      profile: {
        displayName: displayName || email.split('@')[0],
      },
    },
    {
      include: [{ model: UserProfile, as: 'profile' }],
    },
  );

  return user;
}

/**
 * Authenticate user with email and password
 *
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} models - Database models
 * @returns {Promise<Object>} User with profile
 * @throws {Error} If credentials are invalid
 */
export async function authenticateUser(email, password, models) {
  const { User, UserProfile, UserLogin } = models;

  // Find user with profile
  const user = await User.findOne({
    where: { email },
    include: [{ model: UserProfile, as: 'profile' }],
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new Error('Account is inactive');
  }

  // Check if account is locked
  if (user.isLocked) {
    throw new Error('Account is locked');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    // Increment failed login attempts
    await user.increment('failedLoginAttempts');

    // Lock account after 5 failed attempts
    if (user.failedLoginAttempts >= 4) {
      await user.update({ isLocked: true });
    }

    throw new Error('Invalid credentials');
  }

  // Reset failed login attempts on successful login
  if (user.failedLoginAttempts > 0) {
    await user.update({ failedLoginAttempts: 0 });
  }

  // Log successful login
  if (UserLogin) {
    await UserLogin.create({
      userId: user.id,
      ipAddress: null, // This would be set by the controller
      userAgent: null, // This would be set by the controller
      loginAt: new Date(),
      success: true,
    });
  }

  return user;
}

/**
 * Verify email address with token
 *
 * @param {string} token - Email verification token
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Updated user
 * @throws {Error} If token is invalid or expired
 */
export async function verifyEmail(token, models) {
  const { User } = models;

  // In a real implementation, you would decode and verify the JWT token
  // For now, we'll simulate token verification
  try {
    // Decode token to get user ID (simplified)
    const userId = token; // In reality, decode JWT token

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Invalid or expired token');
    }

    if (user.emailConfirmed) {
      throw new Error('Email already verified');
    }

    // Update email confirmation status
    await user.update({ emailConfirmed: true });

    return user;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Request password reset
 *
 * @param {string} email - User email
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Reset token info
 * @throws {Error} If user not found
 */
export async function requestPasswordReset(email, models) {
  const { User } = models;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    // Don't reveal if email exists for security
    return { message: 'If the email exists, a reset link has been sent' };
  }

  // Generate reset token (in real implementation, use JWT with expiration)
  const resetToken = user.id; // Simplified - use proper JWT in production

  // In a real implementation, you would:
  // 1. Generate a secure JWT token with expiration
  // 2. Store token hash in database or use stateless JWT
  // 3. Send email with reset link

  return {
    resetToken,
    message: 'Password reset link sent to email',
  };
}

/**
 * Reset password with token
 *
 * @param {string} token - Password reset token
 * @param {string} newPassword - New password
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Updated user
 * @throws {Error} If token is invalid or expired
 */
export async function resetPassword(token, newPassword, models) {
  const { User } = models;

  try {
    // Decode token to get user ID (simplified)
    const userId = token; // In reality, decode and verify JWT token

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Invalid or expired token');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and reset failed login attempts
    await user.update({
      password: hashedPassword,
      failedLoginAttempts: 0,
      isLocked: false,
    });

    return user;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Get user with profile for authentication
 *
 * @param {string} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<Object>} User with profile
 * @throws {Error} If user not found
 */
export async function getUserWithProfile(userId, models) {
  const { User, UserProfile } = models;

  const user = await User.findByPk(userId, {
    include: [{ model: UserProfile, as: 'profile' }],
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

/**
 * Update user's last login timestamp
 *
 * @param {string} userId - User ID
 * @param {Object} loginData - Login data (IP, user agent, etc.)
 * @param {Object} models - Database models
 * @returns {Promise<void>}
 */
export async function updateLastLogin(userId, loginData, models) {
  const { User, UserLogin } = models;

  // Update user's last login
  await User.update({ lastLoginAt: new Date() }, { where: { id: userId } });

  // Create login record
  if (UserLogin) {
    await UserLogin.create({
      userId,
      ipAddress: loginData.ipAddress,
      userAgent: loginData.userAgent,
      loginAt: new Date(),
      success: true,
    });
  }
}

/**
 * Check if user account is locked
 *
 * @param {string} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<boolean>} True if account is locked
 */
export async function isAccountLocked(userId, models) {
  const { User } = models;

  const user = await User.findByPk(userId, {
    attributes: ['isLocked', 'failedLoginAttempts'],
  });

  return user ? user.isLocked : false;
}

/**
 * Unlock user account
 *
 * @param {string} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Updated user
 */
export async function unlockAccount(userId, models) {
  const { User } = models;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  await user.update({
    isLocked: false,
    failedLoginAttempts: 0,
  });

  return user;
}
