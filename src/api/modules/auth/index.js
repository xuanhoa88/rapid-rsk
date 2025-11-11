/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import routes from './auth.routes';
import * as service from './auth.service';
import * as controller from './auth.controller';

/**
 * Auth Module
 *
 * This module handles user authentication (register, login, logout).
 * Uses dependency injection - all dependencies are passed explicitly.
 *
 * @param {Object} deps - Dependencies injected by API
 * @param {Function} deps.Router - Express Router constructor
 * @param {Object} deps.sequelize - Sequelize instance
 * @param {Object} deps.models - Sequelize models (User, Role, etc.)
 * @param {Object} deps.jwtConfig - JWT configuration
 * @param {string} deps.jwtConfig.secret - JWT secret key
 * @param {string} deps.jwtConfig.expiresIn - JWT expiration time
 * @returns {Router} Express router with auth routes mounted at /auth
 */
export default function main({ Router, sequelize, models, jwtConfig }) {
  const router = Router();

  // Store dependencies in router for use in routes
  // This makes dependencies available to all route handlers
  router.locals = { sequelize, models, jwtConfig };

  // Mount all auth routes under /auth path
  // Routes: POST /auth/register, POST /auth/login, etc.
  router.use('/auth', routes);

  return router;
}

// Export service and controller for testing/reuse
export { service, controller };
