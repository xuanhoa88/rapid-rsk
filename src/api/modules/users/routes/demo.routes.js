/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/**
 * Demo Routes
 *
 * Example routes demonstrating different RBAC patterns and middleware usage.
 * These routes show how to use various authentication and authorization
 * middlewares in real-world scenarios.
 *
 * @param {Object} deps - Dependencies injected by parent router
 * @param {Function} deps.Router - Express Router constructor
 * @param {Object} middlewares - Authentication and authorization middlewares
 * @returns {Router} Express router with demo routes
 */
export default function demoRoutes(deps, middlewares) {
  const { Router } = deps;
  const { requireAuth, requireAnyPermission, requireGroup, requireAnyGroup } =
    middlewares;
  const router = Router();

  /**
   * @route   GET /admin/dashboard
   * @desc    Admin dashboard (multiple permission options)
   * @access  Admin (requires any of: 'system:admin', 'users:manage', 'roles:read')
   * @example Demonstrates requireAnyPermission middleware
   */
  router.get(
    '/admin/dashboard',
    requireAuth,
    requireAnyPermission(['system:admin', 'users:manage', 'roles:read']),
    (req, res) => {
      res.json({
        success: true,
        message: 'Welcome to admin dashboard',
        user: {
          id: req.user.id,
          email: req.user.email,
          permissions: req.user.permissions || [],
        },
        features: [
          'User Management',
          'Role Management',
          'System Settings',
          'Analytics Dashboard',
        ],
      });
    },
  );

  /**
   * @route   GET /team/workspace
   * @desc    Team workspace (group-based access)
   * @access  Members of 'staff' or 'administrators' groups
   * @example Demonstrates requireAnyGroup middleware
   */
  router.get(
    '/team/workspace',
    requireAuth,
    requireAnyGroup(['staff', 'administrators']),
    (req, res) => {
      res.json({
        success: true,
        message: 'Welcome to team workspace',
        user: {
          id: req.user.id,
          email: req.user.email,
          groups: req.user.groups || [],
        },
        workspace: {
          name: 'Team Collaboration Hub',
          tools: ['Project Management', 'File Sharing', 'Team Chat'],
          members: 'Staff and Administrators',
        },
      });
    },
  );

  /**
   * @route   GET /developer/tools
   * @desc    Developer tools (specific group access)
   * @access  Members of 'developers' group
   * @example Demonstrates requireGroup middleware
   */
  router.get(
    '/developer/tools',
    requireAuth,
    requireGroup('developers'),
    (req, res) => {
      res.json({
        success: true,
        message: 'Welcome to developer tools',
        user: {
          id: req.user.id,
          email: req.user.email,
          group: 'developers',
        },
        tools: [
          'API Documentation',
          'Database Console',
          'Log Viewer',
          'Performance Monitor',
          'Code Repository',
        ],
        environment: process.env.NODE_ENV || 'development',
      });
    },
  );

  /**
   * @route   GET /public/info
   * @desc    Public information endpoint
   * @access  Public (no authentication required)
   * @example Demonstrates public route
   */
  router.get('/public/info', (req, res) => {
    res.json({
      success: true,
      message: 'Public information endpoint',
      info: {
        name: 'React Starter Kit User Module',
        version: '1.0.0',
        features: [
          'User Authentication',
          'Role-Based Access Control',
          'Permission Management',
          'Group Management',
          'Profile Management',
        ],
        documentation: '/api/docs',
      },
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @route   GET /protected/basic
   * @desc    Basic protected endpoint
   * @access  Authenticated users only
   * @example Demonstrates basic authentication requirement
   */
  router.get('/protected/basic', requireAuth, (req, res) => {
    res.json({
      success: true,
      message: 'You are authenticated!',
      user: {
        id: req.user.id,
        email: req.user.email,
      },
      accessLevel: 'basic',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
