/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import jwt from 'jsonwebtoken';

/**
 * Generate JWT token
 *
 * @param {Object} payload - Token payload
 * @param {string} secret - JWT secret
 * @param {string} expiresIn - Token expiration (default: '7d')
 * @returns {string} JWT token
 */
export function generateToken(payload, secret, expiresIn = '7d') {
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verify JWT token
 *
 * @param {string} token - JWT token
 * @param {string} secret - JWT secret
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

/**
 * Set JWT token as HTTP-only cookie
 *
 * @param {Object} res - Express response object
 * @param {string} token - JWT token
 * @param {number} maxAge - Cookie max age in milliseconds (default: 7 days)
 */
export function setTokenCookie(res, token, maxAge = 7 * 24 * 60 * 60 * 1000) {
  res.cookie('id_token', token, {
    maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

/**
 * Clear JWT token cookie
 *
 * @param {Object} res - Express response object
 */
export function clearTokenCookie(res) {
  res.clearCookie('id_token');
}
