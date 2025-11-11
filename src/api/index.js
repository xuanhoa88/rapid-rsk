/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { Router } from 'express';
import { expressjwt as expressJwt } from 'express-jwt';
import expressProxy from 'express-http-proxy';
import { sequelize, initializeModels } from './engines/database';

/**
 * Synchronize database models
 *
 * Creates tables if they don't exist. Optionally can alter or force recreate tables.
 * Warning: Use force/alter options with caution in production!
 *
 * @param {Object} [options={}] - Sequelize sync options
 * @param {boolean} [options.force] - Drop tables before recreating (dangerous!)
 * @param {boolean} [options.alter] - Alter tables to fit models (use migrations instead)
 * @param {boolean} [options.logging] - Enable SQL logging (default: false)
 * @returns {Promise<void>}
 *
 * @example
 * // Simple sync (creates tables if missing)
 * await syncDatabase();
 *
 * @example
 * // Sync with logging
 * await syncDatabase({ logging: console.log });
 *
 * @example
 * // Development: alter tables to match models
 * await syncDatabase({ alter: true, logging: console.log });
 */
async function syncDatabase(options = {}) {
  try {
    await sequelize.sync(options);
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
    throw error;
  }
}

/**
 * Discover and load API modules
 *
 * Auto-discovers all modules in ./modules directory and mounts them on a router.
 * Each module receives dependencies via dependency injection.
 *
 * @param {Object} dependencies - Dependencies to inject into modules
 * @param {Function} dependencies.Router - Express Router constructor
 * @param {Object} dependencies.sequelize - Sequelize instance
 * @param {Object} dependencies.models - Database models
 * @param {Object} dependencies.jwtConfig - JWT configuration
 * @returns {Router} Router with all discovered modules mounted
 */
function discoverModules(dependencies) {
  const apiRoutes = Router();

  // Auto-discover all modules
  const modulesContext = require.context(
    './modules',
    true,
    /\/index\.(js|ts)$/,
  );

  const moduleKeys = modulesContext.keys();
  console.info(
    `🔍 Discovering API modules... Found ${moduleKeys.length} modules`,
  );

  // Load each module and mount its router
  moduleKeys.forEach(modulePath => {
    try {
      console.info(`📦 Loading module: ${modulePath}`);
      // Import module's default export (factory function)
      // modulePath looks like: './auth/index.js' or './user/index.ts'
      const moduleFactory = modulesContext(modulePath).default;

      if (typeof moduleFactory === 'function') {
        // Call factory with dependencies (dependency injection)
        // Each module receives explicit dependencies instead of global state
        const moduleRouter = moduleFactory(dependencies);

        // Verify it returned a valid router (check for router methods)
        // Use duck typing instead of instanceof to avoid webpack module issues
        if (moduleRouter && typeof moduleRouter.use === 'function') {
          apiRoutes.use(moduleRouter);
          console.info(`✅ Module mounted: ${modulePath}`);
        } else {
          console.warn(`⚠️  Module did not return a Router: ${modulePath}`);
        }
      } else {
        console.warn(
          `⚠️  Module default export is not a function: ${modulePath}`,
        );
      }
    } catch (error) {
      // Log error but continue loading other modules
      console.error(`❌ Failed to load module "${modulePath}":`, error.message);
      console.error(error.stack);
    }
  });

  console.info(
    `✅ API module discovery complete. Mounted ${moduleKeys.length} modules`,
  );
  return apiRoutes;
}

/**
 * Bootstrap the API
 *
 * Initializes database models, sets up JWT authentication, auto-discovers
 * modules, mounts routers, syncs database, and returns reusable API functions.
 *
 * @param {Object} app - Express app instance
 * @param {Object} config - Configuration object
 * @param {string} config.jwtSecret - JWT secret key (required)
 * @param {string} [config.jwtExpiresIn='7d'] - JWT expiration time
 * @param {string} [config.apiProxyUrl] - External API URL to proxy requests to
 * @returns {Promise<void>} Resolves when API is fully bootstrapped and database is synced
 */
export default async function main(app, config = {}) {
  // Validate required JWT secret
  if (!config.jwtSecret) {
    throw new Error(
      'RSK_JWT_SECRET environment variable is required. Generate one with: openssl rand -base64 32',
    );
  }

  // Initialize database models and relationships
  initializeModels();

  // Prepare JWT configuration for modules and return
  const jwtConfig = {
    secret: config.jwtSecret,
    expiresIn: config.jwtExpiresIn || '7d',
  };

  // JWT authentication middleware on /api routes only
  // Extracts JWT token from cookie and validates it
  // Sets req.auth with decoded token payload if valid
  app.use(
    '/api',
    expressJwt({
      secret: jwtConfig.secret,
      algorithms: ['HS256'],
      credentialsRequired: false,
      getToken: req => req.cookies.id_token,
    }),
  );

  // Auto-discover and load all API modules
  const apiRoutes = discoverModules({
    Router,
    sequelize,
    models: sequelize.models,
    jwtConfig,
  });

  // Mount all API routes under /api
  app.use('/api', apiRoutes);

  // Setup API proxy if configured
  // Proxies /api/* requests to external API (e.g., https://api.github.com)
  if (config.apiProxyUrl) {
    app.use(
      '/api',
      expressProxy(config.apiProxyUrl, {
        // Remove /api prefix before forwarding
        // Example: /api/products → /products
        proxyReqPathResolver: req => req.url.replace(/^\/api/, ''),
      }),
    );
  }

  // This ensures database is ready before server accepts requests
  await syncDatabase();
}
