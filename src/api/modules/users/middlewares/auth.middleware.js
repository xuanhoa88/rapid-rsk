/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import jwt from 'jsonwebtoken';

/**
 * Authentication middleware factory
 *
 * Verifies JWT token from cookie and attaches user to request.
 * Returns 401 error if token is missing or invalid.
 *
 * @param {Object} [options] - Configuration options
 * @param {string} [options.tokenSource='cookie'] - Token source: 'cookie', 'header', 'query'
 * @param {string} [options.cookieName='id_token'] - Cookie name when using cookie source
 * @param {string} [options.headerName='authorization'] - Header name when using header source
 * @param {string} [options.queryParam='token'] - Query parameter when using query source
 * @param {boolean} [options.includeFullUser=false] - Include full decoded token in req.user
 * @param {Function} [options.onError] - Custom error handler
 * @returns {Function} Express middleware function
 *
 * @example
 * // Basic usage (cookie-based)
 * app.use('/api/protected', requireAuth());
 *
 * @example
 * // Header-based authentication
 * app.use('/api/mobile', requireAuth({ tokenSource: 'header' }));
 *
 * @example
 * // Custom error handling
 * app.use('/api/custom', requireAuth({
 *   onError: (error, req, res) => {
 *     res.status(403).json({ message: 'Access denied' });
 *   }
 * }));
 */
export function requireAuth(options = {}) {
  const {
    tokenSource = 'cookie',
    cookieName = 'id_token',
    headerName = 'authorization',
    queryParam = 'token',
    includeFullUser = false,
    onError,
  } = options;

  return (req, res, next) => {
    try {
      let token;

      // Extract token based on source
      switch (tokenSource) {
        case 'cookie': {
          token = req.cookies[cookieName];
          break;
        }
        case 'header': {
          const authHeader = req.headers[headerName.toLowerCase()];
          token =
            authHeader && authHeader.startsWith('Bearer ')
              ? authHeader.substring(7)
              : authHeader;
          break;
        }
        case 'query': {
          token = req.query[queryParam];
          break;
        }
        default: {
          token = req.cookies[cookieName];
        }
      }

      if (!token) {
        const error = new Error('No authentication token provided');
        if (onError) {
          return onError(error, req, res, next);
        }
        return res.status(401).json({
          success: false,
          error: error.message,
        });
      }

      // Get JWT secret from app settings (set during bootstrap)
      const secret = req.app.get('jwtSecret');
      if (!secret) {
        const error = new Error('JWT secret not configured');
        if (onError) {
          return onError(error, req, res, next);
        }
        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }

      // Verify and decode token
      const decoded = jwt.verify(token, secret);

      // Attach user info to request
      req.user = includeFullUser
        ? decoded
        : {
            id: decoded.id,
            email: decoded.email,
          };

      req.authMethod = tokenSource;
      next();
    } catch (error) {
      if (onError) {
        return onError(error, req, res, next);
      }

      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Authentication token has expired',
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid authentication token',
        });
      }

      // Handle other errors
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
      });
    }
  };
}

/**
 * Optional authentication middleware factory
 *
 * Attaches user to request if token exists, but doesn't fail if missing.
 * Useful for routes that have different behavior for authenticated vs anonymous users.
 *
 * @param {Object} [options] - Configuration options
 * @param {string} [options.tokenSource='cookie'] - Token source: 'cookie', 'header', 'query'
 * @param {string} [options.cookieName='id_token'] - Cookie name when using cookie source
 * @param {string} [options.headerName='authorization'] - Header name when using header source
 * @param {string} [options.queryParam='token'] - Query parameter when using query source
 * @param {boolean} [options.includeFullUser=false] - Include full decoded token in req.user
 * @param {Function} [options.onError] - Custom error handler (called but doesn't block)
 * @param {boolean} [options.setAuthMethod=true] - Set req.authMethod when authenticated
 * @returns {Function} Express middleware function
 *
 * @example
 * // Basic usage (cookie-based)
 * app.use('/api/public', optionalAuth());
 *
 * @example
 * // Header-based with custom error logging
 * app.use('/api/mixed', optionalAuth({
 *   tokenSource: 'header',
 *   onError: (error, req) => console.log('Auth failed for', req.path)
 * }));
 */
export function optionalAuth(options = {}) {
  const {
    tokenSource = 'cookie',
    cookieName = 'id_token',
    headerName = 'authorization',
    queryParam = 'token',
    includeFullUser = false,
    onError,
    setAuthMethod = true,
  } = options;

  return (req, res, next) => {
    try {
      let token;

      // Extract token based on source
      switch (tokenSource) {
        case 'cookie': {
          token = req.cookies[cookieName];
          break;
        }
        case 'header': {
          const authHeader = req.headers[headerName.toLowerCase()];
          token =
            authHeader && authHeader.startsWith('Bearer ')
              ? authHeader.substring(7)
              : authHeader;
          break;
        }
        case 'query': {
          token = req.query[queryParam];
          break;
        }
        default: {
          token = req.cookies[cookieName];
        }
      }

      if (!token) {
        // No token provided, continue without authentication
        return next();
      }

      // Get JWT secret from app settings
      const secret = req.app.get('jwtSecret');
      if (!secret) {
        // No secret configured, continue without authentication
        return next();
      }

      // Verify and decode token
      const decoded = jwt.verify(token, secret);

      // Attach user info to request
      req.user = includeFullUser
        ? decoded
        : {
            id: decoded.id,
            email: decoded.email,
          };

      if (setAuthMethod) {
        req.authMethod = tokenSource;
      }

      next();
    } catch (error) {
      // Call custom error handler if provided (but don't block)
      if (onError) {
        try {
          onError(error, req, res, next);
        } catch (handlerError) {
          // Ignore handler errors in optional auth
        }
      }

      // Token exists but is invalid, continue without authentication
      // This allows the route to handle anonymous users gracefully
      next();
    }
  };
}

/**
 * API Key authentication middleware factory
 *
 * Alternative authentication method using API keys.
 * Useful for API integrations and service-to-service communication.
 *
 * @param {Object} [options] - Configuration options
 * @param {string} [options.headerName='x-api-key'] - Header name for API key
 * @param {string} [options.queryParam='api_key'] - Query parameter name for API key
 * @param {string[]} [options.validKeys] - Array of valid API keys (overrides env)
 * @param {string} [options.envVar='VALID_API_KEYS'] - Environment variable with comma-separated keys
 * @param {Function} [options.validator] - Custom validation function
 * @param {Function} [options.onError] - Custom error handler
 * @param {boolean} [options.attachKey=true] - Attach API key to req.apiKey
 * @returns {Function} Express middleware function
 *
 * @example
 * // Basic usage
 * app.use('/api/external', requireApiKey());
 *
 * @example
 * // Custom validation
 * app.use('/api/services', requireApiKey({
 *   validator: async (apiKey, req) => {
 *     const service = await Service.findOne({ apiKey });
 *     if (service && service.active) {
 *       req.service = service;
 *       return true;
 *     }
 *     return false;
 *   }
 * }));
 */
export function requireApiKey(options = {}) {
  const {
    headerName = 'x-api-key',
    queryParam = 'api_key',
    validKeys,
    envVar = 'VALID_API_KEYS',
    validator,
    onError,
    attachKey = true,
  } = options;

  return async (req, res, next) => {
    try {
      const apiKey =
        req.headers[headerName.toLowerCase()] || req.query[queryParam];

      if (!apiKey) {
        const error = new Error('API key required');
        if (onError) {
          return onError(error, req, res, next);
        }
        return res.status(401).json({
          success: false,
          error: error.message,
        });
      }

      let isValid = false;

      // Use custom validator if provided
      if (validator) {
        try {
          isValid = await validator(apiKey, req);
        } catch (validatorError) {
          const error = new Error('API key validation failed');
          if (onError) {
            return onError(error, req, res, next);
          }
          return res.status(401).json({
            success: false,
            error: error.message,
          });
        }
      } else {
        // Use provided keys or environment variable
        const allowedKeys =
          validKeys ||
          (process.env[envVar] && process.env[envVar].split(',')) ||
          [];

        isValid = allowedKeys.includes(apiKey);
      }

      if (!isValid) {
        const error = new Error('Invalid API key');
        if (onError) {
          return onError(error, req, res, next);
        }
        return res.status(401).json({
          success: false,
          error: error.message,
        });
      }

      // Attach API key info to request
      if (attachKey) {
        req.apiKey = apiKey;
      }
      req.authMethod = 'api_key';

      next();
    } catch (error) {
      if (onError) {
        return onError(error, req, res, next);
      }
      return res.status(401).json({
        success: false,
        error: 'API key authentication failed',
      });
    }
  };
}

/**
 * Bearer token authentication middleware factory
 *
 * Alternative authentication method using Bearer tokens in Authorization header.
 * Useful for API clients and mobile applications.
 *
 * @param {Object} [options] - Configuration options
 * @param {string} [options.headerName='authorization'] - Header name for bearer token
 * @param {string} [options.prefix='Bearer '] - Token prefix to strip
 * @param {boolean} [options.includeFullUser=false] - Include full decoded token in req.user
 * @param {Function} [options.onError] - Custom error handler
 * @returns {Function} Express middleware function
 *
 * @example
 * // Basic usage
 * app.use('/api/mobile', requireBearerToken());
 *
 * @example
 * // Custom prefix and error handling
 * app.use('/api/custom', requireBearerToken({
 *   prefix: 'Token ',
 *   onError: (error, req, res) => {
 *     res.status(403).json({ message: 'Token invalid' });
 *   }
 * }));
 */
export function requireBearerToken(options = {}) {
  const {
    headerName = 'authorization',
    prefix = 'Bearer ',
    includeFullUser = false,
    onError,
  } = options;

  return (req, res, next) => {
    try {
      const authHeader = req.headers[headerName.toLowerCase()];

      if (!authHeader || !authHeader.startsWith(prefix)) {
        const error = new Error(`${prefix.trim()} token required`);
        if (onError) {
          return onError(error, req, res, next);
        }
        return res.status(401).json({
          success: false,
          error: error.message,
        });
      }

      const token = authHeader.substring(prefix.length);

      // Get JWT secret from app settings
      const secret = req.app.get('jwtSecret');
      if (!secret) {
        const error = new Error('JWT secret not configured');
        if (onError) {
          return onError(error, req, res, next);
        }
        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }

      // Verify and decode token
      const decoded = jwt.verify(token, secret);

      // Attach user info to request
      req.user = includeFullUser
        ? decoded
        : {
            id: decoded.id,
            email: decoded.email,
          };
      req.authMethod = 'bearer_token';

      next();
    } catch (error) {
      if (onError) {
        return onError(error, req, res, next);
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: `${prefix.trim()} token has expired`,
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: `Invalid ${prefix.trim().toLowerCase()} token`,
        });
      }

      return res.status(401).json({
        success: false,
        error: `${prefix.trim()} token authentication failed`,
      });
    }
  };
}

/**
 * Multi-method authentication middleware factory
 *
 * Supports multiple authentication methods (cookie, bearer, API key).
 * Tries each method in order until one succeeds.
 *
 * @param {Object} [options] - Configuration options
 * @param {string[]} [options.methods=['cookie', 'bearer', 'apikey']] - Auth methods to try in order
 * @param {Object} [options.cookieOptions] - Options for cookie auth
 * @param {Object} [options.bearerOptions] - Options for bearer token auth
 * @param {Object} [options.apiKeyOptions] - Options for API key auth
 * @param {Function} [options.onError] - Custom error handler for final failure
 * @param {boolean} [options.includeFullUser=false] - Include full decoded token in req.user
 * @returns {Function} Express middleware function
 *
 * @example
 * // Basic usage (tries all methods)
 * app.use('/api/flexible', requireAnyAuth());
 *
 * @example
 * // Only try bearer and API key
 * app.use('/api/external', requireAnyAuth({
 *   methods: ['bearer', 'apikey'],
 *   bearerOptions: { prefix: 'Token ' },
 *   apiKeyOptions: { headerName: 'x-service-key' }
 * }));
 */
export function requireAnyAuth(options = {}) {
  const {
    methods = ['cookie', 'bearer', 'apikey'],
    cookieOptions = {},
    bearerOptions = {},
    apiKeyOptions = {},
    onError,
    includeFullUser = false,
  } = options;

  // Create middleware instances with shared options
  const sharedOptions = { includeFullUser };
  const cookieAuth = requireAuth({ ...sharedOptions, ...cookieOptions });
  const bearerAuth = requireBearerToken({ ...sharedOptions, ...bearerOptions });
  const apiKeyAuth = requireApiKey({ ...sharedOptions, ...apiKeyOptions });

  return (req, res, next) => {
    let currentMethodIndex = 0;

    function tryNextMethod(error) {
      if (currentMethodIndex >= methods.length) {
        // All methods failed
        if (onError) {
          return onError(error, req, res, next);
        }
        return res.status(401).json({
          success: false,
          error: `Authentication required (${methods.join(', ')})`,
        });
      }

      const method = methods[currentMethodIndex];
      currentMethodIndex++;

      // Check if the required data is present for this method
      let hasRequiredData = false;
      let middleware;

      switch (method) {
        case 'cookie': {
          const cookieName = cookieOptions.cookieName || 'id_token';
          hasRequiredData = !!req.cookies[cookieName];
          middleware = cookieAuth;
          break;
        }
        case 'bearer': {
          const headerName = bearerOptions.headerName || 'authorization';
          const prefix = bearerOptions.prefix || 'Bearer ';
          const authHeader = req.headers[headerName.toLowerCase()];
          hasRequiredData = !!(authHeader && authHeader.startsWith(prefix));
          middleware = bearerAuth;
          break;
        }
        case 'apikey': {
          const headerName = apiKeyOptions.headerName || 'x-api-key';
          const queryParam = apiKeyOptions.queryParam || 'api_key';
          hasRequiredData = !!(
            req.headers[headerName.toLowerCase()] || req.query[queryParam]
          );
          middleware = apiKeyAuth;
          break;
        }
        default: {
          // Unknown method, skip to next
          return tryNextMethod(error);
        }
      }

      if (!hasRequiredData) {
        // Required data not present, try next method
        return tryNextMethod(error);
      }

      // Try this authentication method
      middleware(req, res, err => {
        if (!err) {
          // Success!
          return next();
        }
        // This method failed, try next
        tryNextMethod(err);
      });
    }

    // Start trying methods
    tryNextMethod();
  };
}

// Backward compatibility - deprecated, use optionalAuth instead
export const optionalAuthenticate = optionalAuth;

/**
 * Summary of available authentication middleware:
 *
 * 1. requireAuth(options) - Strict JWT authentication (cookie/header/query)
 * 2. optionalAuth(options) - Optional JWT authentication (renamed from optionalAuthenticate)
 * 3. requireApiKey(options) - API key authentication with custom validation
 * 4. requireBearerToken(options) - Bearer token authentication
 * 5. requireAnyAuth(options) - Multi-method authentication (tries multiple methods)
 *
 * All middleware now support:
 * - Configurable token sources (cookie, header, query)
 * - Custom error handlers
 * - Full user data inclusion
 * - Flexible validation options
 *
 * Migration from old API:
 * - requireAuth() -> requireAuth() (now returns middleware function)
 * - optionalAuthenticate() -> optionalAuth() (renamed for consistency)
 * - All other functions now return middleware instead of being middleware directly
 *
 * @example Basic usage (backward compatible):
 * app.use('/api/protected', requireAuth());
 * app.use('/api/public', optionalAuth());
 *
 * @example Advanced usage with options:
 * app.use('/api/mobile', requireAuth({ tokenSource: 'header', includeFullUser: true }));
 * app.use('/api/services', requireApiKey({ validator: customValidator }));
 * app.use('/api/flexible', requireAnyAuth({ methods: ['bearer', 'apikey'] }));
 */
