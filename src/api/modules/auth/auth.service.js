/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { User, UserProfile } from '../../engines/database/models';
import { hashPassword, verifyPassword } from '../../engines/security';

/**
 * Register a new user
 *
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.displayName - User display name (optional)
 * @returns {Promise<Object>} Created user with profile
 * @throws {Error} If user already exists or creation fails
 */
export async function registerUser(userData) {
  const { email, password, displayName } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user with profile
  const user = await User.create(
    {
      email,
      emailConfirmed: false,
      password: hashedPassword,
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
 * @returns {Promise<Object>} User with profile
 * @throws {Error} If credentials are invalid
 */
export async function authenticateUser(email, password) {
  // Find user by email
  const user = await User.findOne({
    where: { email },
    include: [{ model: UserProfile, as: 'profile' }],
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  return user;
}

/**
 * Get user by ID
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User with profile
 * @throws {Error} If user not found
 */
export async function getUserById(userId) {
  const user = await User.findByPk(userId, {
    include: [{ model: UserProfile, as: 'profile' }],
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

/**
 * Format user data for response
 * Removes sensitive information like password
 *
 * @param {Object} user - User model instance
 * @returns {Object} Formatted user data
 */
export function formatUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    emailConfirmed: user.emailConfirmed,
    displayName: user.profile ? user.profile.displayName : user.email,
    picture: user.profile ? user.profile.picture : null,
  };
}
