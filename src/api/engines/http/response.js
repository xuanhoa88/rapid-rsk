/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/**
 * Send success response
 *
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    ...data,
  });
}

/**
 * Send error response
 *
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {Object} errors - Validation errors (optional)
 */
export function sendError(res, message, statusCode = 400, errors = null) {
  const response = {
    success: false,
    error: message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send validation error response
 *
 * @param {Object} res - Express response object
 * @param {Object} errors - Validation errors
 */
export function sendValidationError(res, errors) {
  return sendError(res, 'Validation failed', 400, errors);
}

/**
 * Send unauthorized error response
 *
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: 'Unauthorized')
 */
export function sendUnauthorized(res, message = 'Unauthorized') {
  return sendError(res, message, 401);
}

/**
 * Send not found error response
 *
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: 'Not found')
 */
export function sendNotFound(res, message = 'Not found') {
  return sendError(res, message, 404);
}

/**
 * Send internal server error response
 *
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: 'Internal server error')
 */
export function sendServerError(res, message = 'Internal server error') {
  return sendError(res, message, 500);
}
