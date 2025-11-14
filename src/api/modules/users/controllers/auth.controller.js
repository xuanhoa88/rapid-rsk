/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { authService } from '../services';
import { generateToken, setTokenCookie, clearTokenCookie } from '../utils/jwt';
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendNotFound,
  sendServerError,
} from '../../../engines/http';
import { validateRegistration, validateLogin } from '../utils/validation';

// ========================================================================
// AUTHENTICATION CONTROLLERS
// ========================================================================

/**
 * Register a new user
 *
 * @route   POST /api/users/register
 * @access  Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function register(req, res) {
  try {
    const { email, password, displayName } = req.body;

    // Validate input
    const validationErrors = validateRegistration({
      email,
      password,
      displayName,
    });
    if (Object.keys(validationErrors).length > 0) {
      return sendValidationError(res, validationErrors);
    }

    // Get models from app context
    const models = req.app.get('models');

    // Register user
    const user = await authService.registerUser(
      {
        email,
        password,
        displayName,
      },
      models,
    );

    // Generate JWT token
    const token = generateToken(
      { id: user.id, email: user.email },
      req.app.get('jwtSecret'),
      req.app.get('jwtExpiresIn'),
    );

    // Set token cookie
    setTokenCookie(res, token);

    // Return user data
    return sendSuccess(
      res,
      {
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
      },
      201,
    );
  } catch (error) {
    if (error.message === 'User already exists') {
      return sendError(res, 'User with this email already exists', 409);
    }

    return sendServerError(res, 'Registration failed');
  }
}

/**
 * Login user
 *
 * @route   POST /api/users/login
 * @access  Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validate input
    const validationErrors = validateLogin({ email, password });
    if (Object.keys(validationErrors).length > 0) {
      return sendValidationError(res, validationErrors);
    }

    // Get models from app context
    const models = req.app.get('models');

    // Authenticate user
    const user = await authService.authenticateUser(email, password, models);

    // Generate JWT token
    const token = generateToken(
      { id: user.id, email: user.email },
      req.app.get('jwtSecret'),
      req.app.get('jwtExpiresIn'),
    );

    // Set token cookie
    setTokenCookie(res, token);

    // Return user data
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
    if (error.message === 'Invalid credentials') {
      return sendUnauthorized(res, 'Invalid email or password');
    }

    if (error.message === 'Account is inactive') {
      return sendUnauthorized(res, 'Account is inactive');
    }

    return sendServerError(res, 'Login failed');
  }
}

/**
 * Logout user
 *
 * @route   POST /api/users/logout
 * @access  Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function logout(req, res) {
  try {
    // Clear token cookie
    clearTokenCookie(res);

    return sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    return sendServerError(res, 'Logout failed');
  }
}

/**
 * Get current authenticated user
 *
 * @route   GET /api/users/me
 * @access  Private (requires authentication)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getCurrentUser(req, res) {
  try {
    // Get models from app context
    const models = req.app.get('models');

    // Get user with profile
    const user = await authService.getUserWithProfile(req.user.id, models);

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

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
    return sendServerError(res, 'Failed to get user information');
  }
}

/**
 * Refresh authentication token
 *
 * @route   POST /api/users/refresh
 * @access  Private (requires authentication)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function refreshToken(req, res) {
  try {
    // Generate new JWT token
    const token = generateToken(
      { id: req.user.id, email: req.user.email },
      req.app.get('jwtSecret'),
      req.app.get('jwtExpiresIn'),
    );

    // Set new token cookie
    setTokenCookie(res, token);

    return sendSuccess(res, { message: 'Token refreshed successfully' });
  } catch (error) {
    return sendServerError(res, 'Failed to refresh token');
  }
}

/**
 * Verify email address
 *
 * @route   POST /api/users/verify-email
 * @access  Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function verifyEmail(req, res) {
  try {
    const { token } = req.body;

    if (!token) {
      return sendValidationError(res, {
        token: 'Verification token is required',
      });
    }

    // Get models from app context
    const models = req.app.get('models');

    // Verify email with token
    const user = await authService.verifyEmail(token, models);

    return sendSuccess(res, {
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        emailConfirmed: user.emailConfirmed,
      },
    });
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      return sendError(res, 'Invalid or expired verification token', 400);
    }

    return sendServerError(res, 'Email verification failed');
  }
}

/**
 * Request password reset
 *
 * @route   POST /api/users/forgot-password
 * @access  Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return sendValidationError(res, {
        email: 'Email is required',
      });
    }

    // Get models from app context
    const models = req.app.get('models');

    // Request password reset
    await authService.requestPasswordReset(email, models);

    // Always return success for security (don't reveal if email exists)
    return sendSuccess(res, {
      message: 'If the email exists, a password reset link has been sent',
    });
  } catch (error) {
    return sendServerError(res, 'Failed to process password reset request');
  }
}

/**
 * Reset password with token
 *
 * @route   POST /api/users/reset-password
 * @access  Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    // Validate input
    const errors = {};
    if (!token) errors.token = 'Reset token is required';
    if (!password) errors.password = 'New password is required';

    if (Object.keys(errors).length > 0) {
      return sendValidationError(res, errors);
    }

    // Get models from app context
    const models = req.app.get('models');

    // Reset password with token
    await authService.resetPassword(token, password, models);

    return sendSuccess(res, {
      message: 'Password reset successfully',
    });
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      return sendError(res, 'Invalid or expired reset token', 400);
    }

    return sendServerError(res, 'Password reset failed');
  }
}
