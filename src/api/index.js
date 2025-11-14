/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { Router } from 'express';
import { expressjwt as expressJwt } from 'express-jwt';
import expressProxy from 'express-http-proxy';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { sequelize } from './engines/database';
import * as fs from './engines/filesystems';
import * as http from './engines/http';

/**
 * API route prefix
 *
 * All API routes will be mounted under this prefix.
 * Can be configured via RSK_API_PREFIX environment variable.
 *
 * @example
 * // Default
 * RSK_API_PREFIX=/api
 *
 * @example
 * // Versioned API
 * RSK_API_PREFIX=/v1/api
 *
 * @example
 * // Custom prefix
 * RSK_API_PREFIX=/rest
 */
const API_PREFIX = process.env.RSK_API_PREFIX || '/api';

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
 * Load and validate a factory function from a webpack module
 *
 * Safely loads a module and validates it exports a default factory function.
 * Returns null if module is invalid or fails to load.
 *
 * @param {Function} context - Webpack require.context function
 * @param {string} path - Module path relative to context
 * @param {string} type - Type name for logging (e.g., 'models', 'module')
 * @returns {Function|null} Factory function or null if invalid/failed
 */
function loadFactory(context, path, type) {
  try {
    const mod = context(path);
    // eslint-disable-next-line no-underscore-dangle
    const factory = mod.__esModule && mod.default ? mod.default : mod;

    // Validate default export exists
    if (!factory) {
      console.warn(`⚠️  No default export in ${type}: ${path}`);
      return null;
    }

    // Validate default export is a function
    if (typeof factory !== 'function') {
      console.warn(
        `⚠️  Default export is not a factory function in ${type}: ${path}`,
      );
      return null;
    }

    return factory;
  } catch (error) {
    console.error(`❌ Failed to load ${type} "${path}":`, error.message);
    console.error(error.stack);
    return null;
  }
}

/**
 * Process discovered files with consistent logging and error handling
 *
 * @param {Function} context - Webpack require.context function
 * @param {string} typeName - Type name for logging (e.g., 'models', 'modules')
 * @param {Function} processor - Async function to process all discovered files
 * @returns {Promise<*>} Result from processor function
 */
function processFiles(context, typeName, processor) {
  const paths = context.keys();
  console.info(
    `🔍 Discovering ${typeName}... Found ${paths.length} ${typeName}`,
  );
  return processor(context, paths);
}

/**
 * Discover and load API modules with models
 *
 * Auto-discovers models and modules from ./modules directory.
 * First discovers and initializes models, then mounts module routers.
 * Each module receives dependencies via dependency injection.
 *
 * Discovery Process:
 * 1. Discovers all models from ./moduleName/models/index.js
 * 2. Calls model factory functions with (dependencies, app)
 * 3. Collects all models into single object
 * 4. Discovers all modules from ./moduleName/index.js
 * 5. Calls module factory functions with (dependencies + models, app)
 * 6. Mounts all module routers
 * 7. Returns { models, apiRoutes }
 *
 * @param {Object} app - Express app instance (for accessing app-level settings)
 * @param {Object} dependencies - Dependencies to inject into modules
 * @param {Object} dependencies.Model - Sequelize instance for database operations
 * @param {Object} dependencies.jwtConfig - JWT configuration
 * @param {string} dependencies.jwtConfig.secret - JWT secret key
 * @param {string} dependencies.jwtConfig.expiresIn - JWT expiration time (e.g., '7d')
 * @returns {Object} Discovery result
 * @returns {Object} .models - All discovered models from all modules
 * @returns {Router} .apiRoutes - Express router with all module routes mounted
 */
async function discoverModules(app, dependencies) {
  // Step 1: Discover and initialize models
  const modelsContext = require.context(
    './modules',
    true,
    /^\.\/[^/]+\/models\/index\.(js|ts)$/,
  );
  const models = await processFiles(
    modelsContext,
    'models',
    async (ctx, paths) => {
      const allModels = {};
      let successCount = 0;

      // Process all model factories in parallel (supports both sync and async)
      await Promise.all(
        paths.map(async path => {
          console.info(`📦 Loading models: ${path}`);

          const factory = loadFactory(ctx, path, 'models');
          if (!factory) return;

          try {
            // Support both sync and async factories
            const modelSet = await Promise.resolve(factory(dependencies, app));

            if (!modelSet || typeof modelSet !== 'object') {
              console.warn(
                `⚠️  Models factory did not return an object: ${path}`,
              );
              return;
            }

            const modelCount = Object.keys(modelSet).length;
            if (modelCount === 0) {
              console.warn(`⚠️  Models factory returned empty object: ${path}`);
              return;
            }

            Object.assign(allModels, modelSet);
            successCount++;
            console.info(
              `✅ Models initialized: ${path} (${modelCount} models)`,
            );
          } catch (error) {
            console.error(
              `❌ Failed to initialize models "${path}":`,
              error.message,
            );
            console.error(error.stack);
          }
        }),
      );

      console.info(
        `✅ Model discovery complete. Initialized ${Object.keys(allModels).length} models from ${successCount}/${paths.length} modules`,
      );

      return allModels;
    },
  );

  // Step 2: Discover and mount API modules with models as dependency
  const modulesContext = require.context(
    './modules',
    true,
    /^\.\/[^/]+\/index\.(js|ts)$/,
  );
  const routes = await processFiles(
    modulesContext,
    'modules',
    async (ctx, paths) => {
      const routes = Router();
      let successCount = 0;

      // Create app guard once for all modules (optimization)
      const guardedApp = createAppGuard(app);

      // Process all module factories in parallel (supports both sync and async)
      await Promise.all(
        paths.map(async path => {
          console.info(`📦 Loading module: ${path}`);

          const factory = loadFactory(ctx, path, 'module');
          if (!factory) return;

          try {
            // Support both sync and async factories
            // Pass the shared guarded app to prevent modules from modifying critical dependencies
            const moduleRouter = await Promise.resolve(
              factory(
                Object.assign(dependencies, { models, Router }),
                guardedApp,
              ),
            );

            if (!moduleRouter) {
              console.warn(
                `⚠️  Module factory returned null/undefined: ${path}`,
              );
              return;
            }

            // Use duck typing instead of instanceof to avoid webpack module issues
            if (typeof moduleRouter.use !== 'function') {
              console.warn(`⚠️  Module did not return a Router: ${path}`);
              return;
            }

            routes.use(moduleRouter);
            successCount++;
            console.info(`✅ Module mounted: ${path}`);
          } catch (error) {
            console.error(
              `❌ Failed to mount module "${path}":`,
              error.message,
            );
            console.error(error.stack);
          }
        }),
      );

      console.info(
        `✅ Module discovery complete. Mounted ${successCount}/${paths.length} modules`,
      );

      return routes;
    },
  );

  return { apiModels: models, apiRoutes: routes };
}

/**
 * Create API configuration object with defaults and validation
 *
 * @param {Object} config - Raw configuration
 * @returns {Object} Validated configuration
 */
function createApiConfig(config = {}) {
  // Validate required JWT secret
  if (!config.jwtSecret) {
    throw new Error(
      'RSK_JWT_SECRET environment variable is required. Generate one with: openssl rand -base64 32',
    );
  }

  return {
    jwtSecret: config.jwtSecret,
    jwtExpiresIn: config.jwtExpiresIn || '7d',
    apiProxyUrl: config.apiProxyUrl,
    environment: process.env.NODE_ENV || 'development',
    version: process.env.RSK_API_VERSION || '1.0.0',
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: config.environment === 'production' ? 50 : 100,
      authMax: config.environment === 'production' ? 5 : 10,
    },
    cors: {
      // Origin configuration
      origin:
        config.environment === 'production'
          ? (process.env.RSK_CORS_ORIGIN &&
              process.env.RSK_CORS_ORIGIN.split(',')) ||
            false
          : process.env.RSK_CORS_ORIGIN === 'false'
            ? false
            : true,

      // Credentials support
      credentials: process.env.RSK_CORS_CREDENTIALS !== 'false',

      // HTTP methods
      methods: (process.env.RSK_CORS_METHODS &&
        process.env.RSK_CORS_METHODS.split(',')) || [
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'PATCH',
        'OPTIONS',
        'HEAD',
      ],

      // Allowed headers
      allowedHeaders: (process.env.RSK_CORS_ALLOWED_HEADERS &&
        process.env.RSK_CORS_ALLOWED_HEADERS.split(',')) || [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
        'X-File-Name',
      ],

      // Exposed headers
      exposedHeaders: (process.env.RSK_CORS_EXPOSED_HEADERS &&
        process.env.RSK_CORS_EXPOSED_HEADERS.split(',')) || [
        'RateLimit-Limit',
        'RateLimit-Remaining',
        'RateLimit-Reset',
        'X-Total-Count',
        'X-Request-ID',
      ],

      // Preflight cache duration
      maxAge: parseInt(process.env.RSK_CORS_MAX_AGE, 10) || 86400, // 24 hours

      // Preflight continue
      preflightContinue: process.env.RSK_CORS_PREFLIGHT_CONTINUE === 'true',

      // Options success status
      optionsSuccessStatus:
        parseInt(process.env.RSK_CORS_OPTIONS_STATUS, 10) || 204,
    },
  };
}

/**
 * Create rate limiting middleware
 *
 * @param {Object} config - API configuration
 * @returns {Function} Rate limiting middleware
 */
function createApiRateLimiter(config) {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Create health check endpoint handler
 *
 * @param {Object} config - API configuration
 * @returns {Function} Health check handler
 */
function createHealthCheckHandler(config) {
  return async (req, res) => {
    try {
      // Check database connectivity
      await sequelize.authenticate();

      const healthData = {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.environment,
        version: config.version,
        database: 'connected',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB',
        },
      };

      res.status(200).json(healthData);
    } catch (error) {
      const errorData = {
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        database: 'disconnected',
      };

      res.status(503).json(errorData);
    }
  };
}

/**
 * Setup app dependencies in Express app settings
 *
 * Protects shared objects from modification by freezing them.
 * This prevents accidental mutations that could affect other parts of the application.
 *
 * @param {Object} app - Express app
 * @param {Object} config - API configuration
 */
function setupAppDependencies(app, config) {
  // Freeze primitive values (strings are already immutable)
  app.set('jwtSecret', config.jwtSecret);
  app.set('jwtExpiresIn', config.jwtExpiresIn);

  // Freeze complex objects to prevent modification
  app.set('sequelize', Object.freeze(sequelize));
  // Note: fs module is already read-only, but we freeze it for consistency
  app.set('fs', fs);
  // HTTP utilities for request/response handling
  app.set('http', Object.freeze(http));

  // Create and freeze JWT middleware configuration
  const jwtMiddleware = expressJwt({
    secret: config.jwtSecret,
    algorithms: ['HS256'],
    credentialsRequired: false,
    getToken: req => req.cookies.id_token,
  });

  app.set('jwtMiddleware', Object.freeze(jwtMiddleware));
}

/**
 * Create an app guard that prevents modules from modifying critical dependencies
 *
 * @param {Object} app - Original Express app
 * @returns {Object} Guarded app proxy
 */
function createAppGuard(app) {
  // List of protected dependency keys that modules cannot modify
  const protectedKeys = new Set([
    'jwtSecret',
    'jwtExpiresIn',
    'sequelize',
    'fs',
    'jwtMiddleware',
    'models', // Will be added later
  ]);

  // Create a proxy that intercepts app.set() and app.unset() calls
  return new Proxy(app, {
    get(target, prop) {
      const originalMethod = target[prop];

      // Intercept app.set() to prevent modification of protected keys
      if (prop === 'set') {
        return function (key, value) {
          if (protectedKeys.has(key)) {
            console.warn(
              `⚠️  Module attempted to modify protected dependency: ${key}`,
            );
            return target; // Return app for chaining, but don't actually set
          }
          return originalMethod.call(target, key, value);
        };
      }

      // Intercept app.unset() to prevent removal of protected keys
      if (prop === 'unset') {
        return function (key) {
          if (protectedKeys.has(key)) {
            console.warn(
              `⚠️  Module attempted to remove protected dependency: ${key}`,
            );
            return target; // Return app for chaining, but don't actually unset
          }
          return originalMethod.call(target, key);
        };
      }

      // For all other methods/properties, return as normal
      if (typeof originalMethod === 'function') {
        return originalMethod.bind(target);
      }
      return originalMethod;
    },
  });
}

/**
 * Create CORS middleware
 *
 * @param {Object} config - API configuration
 * @returns {Function} CORS middleware
 */
function createApiCorsMiddleware(config) {
  return cors({
    // Origin configuration - supports dynamic origin function
    origin:
      typeof config.cors.origin === 'boolean'
        ? config.cors.origin
        : function (origin, callback) {
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) {
              return callback(null, true);
            }

            // Check if origin is in allowed list
            if (Array.isArray(config.cors.origin)) {
              const isAllowed = config.cors.origin.some(allowedOrigin => {
                // Support wildcards
                if (allowedOrigin.includes('*')) {
                  const pattern = allowedOrigin.replace(/\*/g, '.*');
                  return new RegExp(`^${pattern}$`).test(origin);
                }
                return allowedOrigin === origin;
              });
              return callback(null, isAllowed);
            }

            // Fallback to default behavior
            return callback(null, config.cors.origin);
          },

    // Credentials support
    credentials: config.cors.credentials,

    // HTTP methods
    methods: config.cors.methods,

    // Allowed headers
    allowedHeaders: config.cors.allowedHeaders,

    // Exposed headers
    exposedHeaders: config.cors.exposedHeaders,

    // Preflight cache duration (in seconds)
    maxAge: config.cors.maxAge,

    // Preflight continue
    preflightContinue: config.cors.preflightContinue,

    // Options success status
    optionsSuccessStatus: config.cors.optionsSuccessStatus,
  });
}

/**
 * Create security middleware (Helmet)
 *
 * @param {Object} config - API configuration
 * @returns {Function} Security middleware
 */
function createSecurityMiddleware() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for API compatibility
  });
}

/**
 * Create compression middleware
 *
 * @param {Object} config - API configuration
 * @returns {Function} Compression middleware
 */
function createCompressionMiddleware(config) {
  return compression({
    filter: (req, res) => {
      // Don't compress responses if the request includes a cache-control: no-transform directive
      if (
        req.headers['cache-control'] &&
        req.headers['cache-control'].includes('no-transform')
      ) {
        return false;
      }
      // Use compression filter function
      return compression.filter(req, res);
    },
    level: config.environment === 'production' ? 6 : 1, // Higher compression in production
  });
}

/**
 * Create logging middleware (Morgan)
 *
 * @param {Object} config - API configuration
 * @returns {Function} Logging middleware
 */
function createLoggingMiddleware(config) {
  const format =
    config.environment === 'production'
      ? 'combined' // Apache combined log format for production
      : 'dev'; // Colored output for development

  return morgan(format, {
    skip: req => {
      // Skip logging for health checks in production
      if (config.environment === 'production' && req.url === '/health') {
        return true;
      }
      return false;
    },
  });
}

/**
 * Setup API proxy if configured
 *
 * @param {Object} app - Express app
 * @param {Object} config - API configuration
 */
function setupApiProxy(app, config) {
  if (!config.apiProxyUrl) return;

  console.info(`🔀 API Proxy enabled: ${config.apiProxyUrl}`);
  app.use(
    API_PREFIX,
    expressProxy(config.apiProxyUrl, {
      proxyReqPathResolver: req =>
        req.url.replace(new RegExp(`^${API_PREFIX}`), ''),
    }),
  );
}

/**
 * Bootstrap the API
 *
 * Simplified and robust API initialization with proper error handling,
 * configuration validation, and modular setup.
 *
 * @param {Object} app - Express app instance
 * @param {Object} options - Configuration object
 * @param {string} options.jwtSecret - JWT secret key (required)
 * @param {string} [options.jwtExpiresIn='7d'] - JWT expiration time
 * @param {string} [options.apiProxyUrl] - External API URL to proxy
 * @returns {Promise<void>} Resolves when API is fully bootstrapped
 * @throws {Error} If configuration is invalid or initialization fails
 *
 * @example
 * await main(app, {
 *   jwtSecret: process.env.RSK_JWT_SECRET,
 *   jwtExpiresIn: '24h',
 *   apiProxyUrl: 'https://api.github.com',
 * });
 */
export default async function main(app, options = {}) {
  try {
    // 1. Create and validate configuration
    const config = createApiConfig(options);

    // 2. Setup app dependencies for dependency injection
    setupAppDependencies(app, config);

    // 3. Create middleware
    const corsMiddleware = createApiCorsMiddleware(config);
    const securityMiddleware = createSecurityMiddleware(config);
    const compressionMiddleware = createCompressionMiddleware(config);
    const loggingMiddleware = createLoggingMiddleware(config);
    const rateLimiter = createApiRateLimiter(config);
    const healthCheckHandler = createHealthCheckHandler(config);

    // Note: JWT middleware is created and stored in app settings for modules to use
    // Authentication is handled at route level using requireAuth middleware

    // 4. Apply global middleware (order matters!)
    app.use(loggingMiddleware); // Log all requests first
    app.use(securityMiddleware); // Security headers
    app.use(corsMiddleware); // CORS handling
    app.use(compressionMiddleware); // Response compression

    // 5. Setup health check endpoint (before API routes)
    app.get('/health', rateLimiter, healthCheckHandler);

    // 6. Discover and initialize modules
    const { apiModels, apiRoutes } = await discoverModules(app, {
      sequelize,
      jwtConfig: {
        secret: config.jwtSecret,
        expiresIn: config.jwtExpiresIn,
      },
    });

    // 7. Store models in app settings (freeze to prevent modification)
    app.set('models', Object.freeze(apiModels));

    // 8. Mount API routes with rate limiting only
    // Authentication is handled at route level using requireAuth middleware
    app.use(API_PREFIX, rateLimiter, apiRoutes);

    // 9. Setup filesystem routes using controller
    app.use(`${API_PREFIX}/files`, rateLimiter, fs.createRouter(Router));

    // 10. Setup optional API proxy
    setupApiProxy(app, config);

    // 11. Synchronize database
    await syncDatabase();

    console.info('✅ API bootstrap completed successfully');
  } catch (error) {
    console.error('❌ API bootstrap failed:', error.message);
    throw error;
  }
}
