/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import * as authService from './auth.service';
import {
  generateToken,
  setTokenCookie,
  clearTokenCookie,
} from '../../engines/security';
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendNotFound,
  sendServerError,
} from '../../engines/http';
import { validateRegistration, validateLogin } from '../../engines/validation';

/**
 * Register a new user
 *
 * @route   POST /api/auth/register
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

    // Register user
    const user = await authService.registerUser({
      email,
      password,
      displayName,
    });

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
        user: authService.formatUserResponse(user),
      },
      201,
    );
  } catch (error) {
    console.error('Registration error:', error);

    if (error.message === 'User with this email already exists') {
      return sendError(res, error.message, 409);
    }

    return sendServerError(res, 'Registration failed');
  }
}

/**
 * Login user
 *
 * @route   POST /api/auth/login
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

    // Authenticate user
    const user = await authService.authenticateUser(email, password);

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
      user: authService.formatUserResponse(user),
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error.message === 'Invalid email or password') {
      return sendUnauthorized(res, error.message);
    }

    return sendServerError(res, 'Login failed');
  }
}

/**
 * Logout user
 *
 * @route   POST /api/auth/logout
 * @access  Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export function logout(req, res) {
  clearTokenCookie(res);
  return sendSuccess(res, { message: 'Logged out successfully' });
}

/**
 * Get current user
 *
 * @route   GET /api/auth/me
 * @access  Private (requires authentication)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getCurrentUser(req, res) {
  try {
    if (!req.user) {
      return sendUnauthorized(res, 'Not authenticated');
    }

    // Get user by ID
    const user = await authService.getUserById(req.user.id);

    // Return user data
    return sendSuccess(res, {
      user: authService.formatUserResponse(user),
    });
  } catch (error) {
    console.error('Get current user error:', error);

    if (error.message === 'User not found') {
      return sendNotFound(res, error.message);
    }

    return sendServerError(res, 'Failed to get user');
  }
}
