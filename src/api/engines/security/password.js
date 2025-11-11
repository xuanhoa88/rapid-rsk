/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import crypto from 'crypto';

/**
 * Hash a password using PBKDF2
 *
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password in format: salt:hash
 */
export async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString('hex');

    // Hash password with salt using PBKDF2
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      // Store salt and hash together
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify a password against a hash
 *
 * @param {string} password - Plain text password to verify
 * @param {string} hashedPassword - Hashed password in format: salt:hash
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(password, hashedPassword) {
  return new Promise((resolve, reject) => {
    // Split salt and hash
    const [salt, hash] = hashedPassword.split(':');

    // Hash the provided password with the same salt
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      // Compare hashes
      resolve(hash === derivedKey.toString('hex'));
    });
  });
}
