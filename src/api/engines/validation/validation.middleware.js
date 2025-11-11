/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/**
 * Validation middleware factory
 * Creates middleware that validates request data against a schema
 *
 * @param {Function} schema - Validation schema function
 * @returns {Function} Express middleware
 *
 * @example
 * const validateLogin = validateRequest((data) => {
 *   const errors = {};
 *   if (!data.email) errors.email = 'Email is required';
 *   if (!data.password) errors.password = 'Password is required';
 *   return errors;
 * });
 *
 * router.post('/login', validateLogin, authController.login);
 */
export function validateRequest(schema) {
  return (req, res, next) => {
    const errors = schema(req.body);

    if (errors && Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors,
      });
    }

    next();
  };
}
