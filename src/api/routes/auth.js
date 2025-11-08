/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { Router } from 'express';
import * as authController from '../controllers/auth';

const router = Router();

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authController.getCurrentUser);

/**
 * @route   POST /auth/reset-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/reset-password', (req, res) => {
  // TODO: Implement password reset functionality
  // 1. Validate email
  // 2. Check if user exists
  // 3. Generate reset token
  // 4. Send email with reset link
  // 5. Return success (even if user doesn't exist - security best practice)

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Email is required',
    });
  }

  // For now, just return success
  // In production, implement actual password reset logic
  return res.status(200).json({
    message:
      'If an account exists with that email, you will receive a password reset link shortly.',
  });
});

export default router;
