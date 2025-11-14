/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { authController } from '../controllers';

/**
 * Authentication Routes
 *
 * Handles user authentication operations including registration, login, logout,
 * and current user retrieval.
 *
 * All routes are public except /me which requires authentication.
 *
 * @param {Object} deps - Dependencies injected by parent router
 * @param {Function} deps.Router - Express Router constructor
 * @param {Object} middlewares - Authentication middlewares
 * @returns {Router} Express router with authentication routes
 */
export default function authRoutes(deps, middlewares) {
  const { Router } = deps;
  const { requireAuth } = middlewares;
  const router = Router();

  /**
   * @route   POST /register
   * @desc    Register a new user
   * @access  Public
   * @body    { email, password, displayName }
   */
  router.post('/register', authController.register);

  /**
   * @route   POST /login
   * @desc    Login user and set JWT cookie
   * @access  Public
   * @body    { email, password }
   */
  router.post('/login', authController.login);

  /**
   * @route   POST /logout
   * @desc    Logout user and clear JWT cookie
   * @access  Public
   */
  router.post('/logout', authController.logout);

  /**
   * @route   GET /me
   * @desc    Get current authenticated user
   * @access  Private (requires authentication)
   */
  router.get('/me', requireAuth, authController.getCurrentUser);

  return router;
}
