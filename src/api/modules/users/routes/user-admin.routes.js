/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { userAdminController } from '../controllers';

/**
 * User Administration Routes
 *
 * Handles administrative user management operations including user listing,
 * viewing, updating, deleting, role management, and status management.
 *
 * All routes require admin privileges.
 *
 * @param {Object} deps - Dependencies injected by parent router
 * @param {Function} deps.Router - Express Router constructor
 * @param {Object} middlewares - Authentication middlewares
 * @returns {Router} Express router with user admin routes
 */
export default function userAdminRoutes(deps, middlewares) {
  const { Router } = deps;
  const { requireAuth, requireAdmin } = middlewares;
  const router = Router();

  /**
   * @route   GET /list
   * @desc    Get paginated list of all users
   * @access  Admin only
   * @query   { page, limit, search, role, status }
   */
  router.get(
    '/list',
    requireAuth,
    requireAdmin,
    userAdminController.getUserList,
  );

  /**
   * @route   GET /:id
   * @desc    Get specific user by ID
   * @access  Admin only
   * @param   {string} id - User ID
   */
  router.get(
    '/:id',
    requireAuth,
    requireAdmin,
    userAdminController.getUserById,
  );

  /**
   * @route   PUT /:id
   * @desc    Update user by ID
   * @access  Admin only
   * @param   {string} id - User ID
   * @body    { email, displayName, isActive, emailConfirmed }
   */
  router.put(
    '/:id',
    requireAuth,
    requireAdmin,
    userAdminController.updateUserById,
  );

  /**
   * @route   DELETE /:id
   * @desc    Delete user by ID
   * @access  Admin only
   * @param   {string} id - User ID
   */
  router.delete(
    '/:id',
    requireAuth,
    requireAdmin,
    userAdminController.deleteUserById,
  );

  /**
   * @route   PUT /:id/role
   * @desc    Update user role
   * @access  Admin only
   * @param   {string} id - User ID
   * @body    { role }
   */
  router.put(
    '/:id/role',
    requireAuth,
    requireAdmin,
    userAdminController.updateUserRole,
  );

  /**
   * @route   PUT /:id/status
   * @desc    Update user status (active/inactive)
   * @access  Admin only
   * @param   {string} id - User ID
   * @body    { isActive }
   */
  router.put(
    '/:id/status',
    requireAuth,
    requireAdmin,
    userAdminController.updateUserStatus,
  );

  /**
   * @route   GET /stats
   * @desc    Get user statistics
   * @access  Admin only
   */
  router.get(
    '/stats',
    requireAuth,
    requireAdmin,
    userAdminController.getUserStats,
  );

  /**
   * @route   PUT /bulk
   * @desc    Bulk update users
   * @access  Admin only
   * @body    { userIds, updates }
   */
  router.put(
    '/bulk',
    requireAuth,
    requireAdmin,
    userAdminController.bulkUpdateUsers,
  );

  return router;
}
