/**
 * Authentication Middleware
 *
 * Comprehensive authentication middleware collection using the auth engine utilities.
 * Provides ready-to-use middleware for various authentication scenarios.
 */

import { manageCookie } from './cookies';
import {
  verifyTypedToken,
  isTokenExpired,
  refreshTokenPair,
  getTokenTimeLeft,
} from './jwt';

/**
 * Extract token from various sources
 *
 * @param {Object} req - Express request object
 * @param {Object} [options] - Extraction options
 * @returns {string|null} Extracted token or null
 */
function extractToken(req, options = {}) {
  const {
    sources = ['cookie', 'header', 'query'],
    headerName = 'authorization',
    headerPrefix = 'Bearer ',
    queryParam = 'token',
  } = options;

  for (const source of sources) {
    let token = null;

    switch (source) {
      case 'cookie':
        token = manageCookie('get', 'jwt', { req });
        break;

      case 'header': {
        const authHeader = req.headers[headerName.toLowerCase()];
        if (authHeader && authHeader.startsWith(headerPrefix)) {
          token = authHeader.slice(headerPrefix.length);
        }
        break;
      }

      case 'query':
        token = req.query[queryParam];
        break;
    }

    if (token) {
      return token;
    }
  }

  return null;
}

/**
 * Basic JWT authentication middleware
 *
 * @param {Object} [options] - Middleware options
 * @returns {Function} Express middleware
 */
export function requireAuth(options = {}) {
  const {
    tokenType = 'access',
    sources = ['cookie', 'header'],
    onError,
    includeUser = true,
    jwtSecret,
  } = options;

  return async (req, res, next) => {
    try {
      const token = extractToken(req, { sources });

      if (!token) {
        const error = new Error('Authentication token required');
        error.status = 401;
        error.code = 'TOKEN_REQUIRED';

        if (onError) {
          return onError(error, req, res, next);
        }
        return res.status(401).json({
          success: false,
          error: error.message,
          code: error.code,
        });
      }

      const decoded = verifyTypedToken(token, tokenType, jwtSecret);

      if (includeUser) {
        req.user = decoded;
      }
      req.token = token;
      req.authMethod = 'jwt';

      next();
    } catch (error) {
      error.status = 401;
      error.code =
        error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID';

      if (onError) {
        return onError(error, req, res, next);
      }

      return res.status(401).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }
  };
}

/**
 * Optional JWT authentication middleware
 *
 * @param {Object} [options] - Middleware options
 * @returns {Function} Express middleware
 */
export function optionalAuth(options = {}) {
  const {
    tokenType = 'access',
    sources = ['cookie', 'header'],
    includeUser = true,
    jwtSecret,
  } = options;

  return async (req, res, next) => {
    try {
      const token = extractToken(req, { sources });

      if (!token) {
        return next(); // No token, continue without authentication
      }

      const decoded = verifyTypedToken(token, tokenType, jwtSecret);

      if (includeUser) {
        req.user = decoded;
      }
      req.token = token;
      req.authMethod = 'jwt';
      req.authenticated = true;

      next();
    } catch (error) {
      req.authenticated = false;
      next();
    }
  };
}

/**
 * Token refresh middleware
 *
 * @param {Object} [options] - Refresh options
 * @returns {Function} Express middleware
 */
export function refreshToken(options = {}) {
  const {
    refreshThreshold = 5 * 60, // 5 minutes in seconds
    autoRefresh = true,
    onRefresh,
    jwtSecret,
  } = options;

  return async (req, res, next) => {
    try {
      const token = extractToken(req);

      if (!token) {
        return next();
      }

      // Check if token needs refresh
      if (isTokenExpired(token)) {
        const error = new Error('Token has expired');
        error.status = 401;
        error.code = 'TOKEN_EXPIRED';
        return res.status(401).json({
          success: false,
          error: error.message,
          code: error.code,
        });
      }

      // Check if token is close to expiration
      const timeLeft = getTokenTimeLeft(token);

      if (timeLeft < refreshThreshold) {
        req.tokenNeedsRefresh = true;

        if (autoRefresh) {
          // Try to get refresh token
          const refreshToken = manageCookie('get', 'refresh', { req });

          if (refreshToken) {
            try {
              const newTokens = refreshTokenPair(refreshToken, jwtSecret);

              // Set new tokens
              manageCookie('set', 'jwt', { res }, newTokens.accessToken);
              manageCookie('set', 'refresh', { res }, newTokens.refreshToken);

              req.token = newTokens.accessToken;
              req.tokenRefreshed = true;

              if (onRefresh) {
                onRefresh(req, res, newTokens);
              }
            } catch (refreshError) {
              // Refresh failed, let the request continue with existing token
              req.refreshFailed = true;
            }
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Session-based authentication middleware
 *
 * @param {Object} [options] - Session options
 * @returns {Function} Express middleware
 */
export function requireSession(options = {}) {
  const {
    sessionStore, // Function to get session data by ID
    onError,
  } = options;

  return async (req, res, next) => {
    try {
      const sessionId = manageCookie('get', 'session', { req });

      if (!sessionId) {
        const error = new Error('Session required');
        error.status = 401;
        error.code = 'SESSION_REQUIRED';

        if (onError) {
          return onError(error, req, res, next);
        }

        return res.status(401).json({
          success: false,
          error: error.message,
          code: error.code,
        });
      }

      // Get session data from store (if provided)
      if (sessionStore) {
        const sessionData = await sessionStore(sessionId);

        if (!sessionData) {
          const error = new Error('Invalid session');
          error.status = 401;
          error.code = 'INVALID_SESSION';

          if (onError) {
            return onError(error, req, res, next);
          }

          return res.status(401).json({
            success: false,
            error: error.message,
            code: error.code,
          });
        }

        req.session = sessionData;
      }

      req.sessionId = sessionId;
      req.authMethod = 'session';

      next();
    } catch (error) {
      if (onError) {
        return onError(error, req, res, next);
      }

      return res.status(500).json({
        success: false,
        error: 'Session validation failed',
        code: 'SESSION_ERROR',
      });
    }
  };
}

/**
 * Combined authentication middleware (tries multiple methods)
 *
 * @param {Object} [options] - Combined auth options
 * @returns {Function} Express middleware
 */
export function requireAnyAuth(options = {}) {
  const {
    methods = ['jwt', 'session'],
    jwtOptions = {},
    sessionOptions = {},
    onError,
    jwtSecret,
  } = options;

  return async (req, res, next) => {
    const errors = [];

    // Try JWT authentication
    if (methods.includes('jwt')) {
      try {
        const token = extractToken(req, jwtOptions.sources);
        if (token) {
          const decoded = verifyTypedToken(
            token,
            jwtOptions.tokenType || 'access',
            jwtSecret,
          );

          req.user = decoded;
          req.token = token;
          req.authMethod = 'jwt';
          return next();
        }
      } catch (error) {
        errors.push({ method: 'jwt', error: error.message });
      }
    }

    // Try session authentication
    if (methods.includes('session')) {
      try {
        const sessionId = manageCookie('get', 'session', { req });
        if (sessionId) {
          if (sessionOptions.sessionStore) {
            const sessionData = await sessionOptions.sessionStore(sessionId);
            if (sessionData) {
              req.session = sessionData;
              req.sessionId = sessionId;
              req.authMethod = 'session';
              return next();
            }
          } else {
            req.sessionId = sessionId;
            req.authMethod = 'session';
            return next();
          }
        }
      } catch (error) {
        errors.push({ method: 'session', error: error.message });
      }
    }

    // No authentication method succeeded
    const error = new Error('Authentication required');
    error.status = 401;
    error.code = 'AUTH_REQUIRED';
    error.attempts = errors;

    if (onError) {
      return onError(error, req, res, next);
    }

    return res.status(401).json({
      success: false,
      error: error.message,
      code: error.code,
      attempts: errors,
    });
  };
}
