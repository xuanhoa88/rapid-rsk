/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import jwt from 'jsonwebtoken';
import { User, UserProfile } from '../models';

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function register(req, res) {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email already exists',
      });
    }

    // Create new user
    const user = await User.create(
      {
        email,
        emailConfirmed: false,
        password, // In production, hash this password with bcrypt
        profile: {
          displayName: displayName || email.split('@')[0],
        },
      },
      {
        include: [{ model: UserProfile, as: 'profile' }],
      },
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      req.app.get('jwtSecret'),
      { expiresIn: req.app.get('jwtExpiresIn') },
    );

    // Set token as HTTP-only cookie
    const expiresIn = 60 * 60 * 24 * 7; // 7 days
    res.cookie('id_token', token, {
      maxAge: 1000 * expiresIn,
      httpOnly: true,
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile.displayName,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: 'Registration failed',
    });
  }
}

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Find user by email
    const user = await User.findOne({
      where: { email },
      include: [{ model: UserProfile, as: 'profile' }],
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // In production, use bcrypt to compare hashed passwords
    // For now, simple comparison (NOT SECURE - FOR DEMO ONLY)
    if (user.password !== password) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      req.app.get('jwtSecret'),
      { expiresIn: req.app.get('jwtExpiresIn') },
    );

    // Set token as HTTP-only cookie
    const expiresIn = 60 * 60 * 24 * 7; // 7 days
    res.cookie('id_token', token, {
      maxAge: 1000 * expiresIn,
      httpOnly: true,
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile ? user.profile.displayName : email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Login failed',
    });
  }
}

/**
 * Logout user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export function logout(req, res) {
  res.clearCookie('id_token');
  return res.json({ success: true });
}

/**
 * Get current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getCurrentUser(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
      });
    }

    const user = await User.findByPk(req.user.id, {
      include: [{ model: UserProfile, as: 'profile' }],
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile ? user.profile.displayName : user.email,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      error: 'Failed to get user',
    });
  }
}
