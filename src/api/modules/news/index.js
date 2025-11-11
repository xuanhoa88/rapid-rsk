/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import routes from './news.routes';

/**
 * News Module
 *
 * This module provides news feed data.
 * Routes are mounted directly on the router (will be under /api when mounted by API bootstrap).
 *
 * @param {Object} deps - Dependencies injected by API
 * @param {Function} deps.Router - Express Router constructor
 * @returns {Router} Express router with news routes
 */
export default function main({ Router }) {
  const router = Router();

  // Mount news routes directly
  // Full path will be: /api/news (when mounted by API bootstrap)
  router.use('/news', routes);

  return router;
}
