/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { profileService } from '../services';
import {
  sendSuccess,
  sendValidationError,
  sendNotFound,
  sendServerError,
} from '../../../engines/http';
import { validatePassword } from '../utils/validation';

// ========================================================================
// PROFILE MANAGEMENT CONTROLLERS
// ========================================================================

/**
 * Get user profile with extended information
 *
 * @route   GET /api/users/profile
 * @access  Private (requires authentication)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getProfile(req, res) {
  try {
    // Get models from app context
    const models = req.app.get('models');

    // Get user with profile
    const user = await profileService.getUserWithProfile(req.user.id, models);

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    return sendSuccess(res, {
      profile: {
        id: user.id,
        email: user.email,
        emailConfirmed: user.emailConfirmed,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        displayName: (user.profile && user.profile.displayName) || null,
        firstName: (user.profile && user.profile.firstName) || null,
        lastName: (user.profile && user.profile.lastName) || null,
        picture: (user.profile && user.profile.picture) || null,
        bio: (user.profile && user.profile.bio) || null,
        location: (user.profile && user.profile.location) || null,
        website: (user.profile && user.profile.website) || null,
        role: user.role || 'user',
      },
    });
  } catch (error) {
    return sendServerError(res, 'Failed to get user profile');
  }
}

/**
 * Update user profile information
 *
 * @route   PUT /api/users/profile
 * @access  Private (requires authentication)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function updateProfile(req, res) {
  try {
    const { displayName, firstName, lastName, bio, location, website } =
      req.body;

    // Get models from app context
    const models = req.app.get('models');

    // Update user profile
    const user = await profileService.updateUserProfile(
      req.user.id,
      {
        displayName,
        firstName,
        lastName,
        bio,
        location,
        website,
      },
      models,
    );

    return sendSuccess(res, {
      profile: {
        id: user.id,
        email: user.email,
        emailConfirmed: user.emailConfirmed,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        displayName: (user.profile && user.profile.displayName) || null,
        firstName: (user.profile && user.profile.firstName) || null,
        lastName: (user.profile && user.profile.lastName) || null,
        picture: (user.profile && user.profile.picture) || null,
        bio: (user.profile && user.profile.bio) || null,
        location: (user.profile && user.profile.location) || null,
        website: (user.profile && user.profile.website) || null,
        role: user.role || 'user',
      },
    });
  } catch (error) {
    return sendServerError(res, 'Failed to update profile');
  }
}

/**
 * Upload user avatar image
 *
 * @route   POST /api/users/avatar
 * @access  Private (requires authentication)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return sendValidationError(res, {
        avatar: 'Avatar image is required',
      });
    }

    // Get filesystem actions and models from app context
    const fs = req.app.get('fs');
    const models = req.app.get('models');

    // Upload avatar
    const user = await profileService.uploadUserAvatar(req.user.id, req.file, {
      models,
      fs,
    });

    // Respond with success message and updated profile
    return sendSuccess(res, {
      message: 'Avatar uploaded successfully',
      profile: {
        id: user.id,
        email: user.email,
        picture: (user.profile && user.profile.picture) || null,
      },
    });
  } catch (error) {
    if (error.message === 'Invalid file type') {
      return sendValidationError(res, {
        avatar: 'Invalid file type. Only JPEG, PNG, and GIF are allowed',
      });
    }

    if (error.message === 'File too large') {
      return sendValidationError(res, {
        avatar: 'File too large. Maximum size is 5MB',
      });
    }

    return sendServerError(res, 'Failed to upload avatar');
  }
}

/**
 * Remove user avatar
 *
 * @route   DELETE /api/users/avatar
 * @access  Private (requires authentication)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function removeAvatar(req, res) {
  try {
    // Get filesystem actions and models from app context
    const fs = req.app.get('fs');
    const models = req.app.get('models');

    // Remove avatar
    const user = await profileService.removeUserAvatar(req.user.id, {
      models,
      fs,
    });

    return sendSuccess(res, {
      message: 'Avatar removed successfully',
      profile: {
        id: user.id,
        email: user.email,
        picture: null,
      },
    });
  } catch (error) {
    return sendServerError(res, 'Failed to remove avatar');
  }
}

/**
 * Change user password
 *
 * @route   PUT /api/users/password
 * @access  Private (requires authentication)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    const errors = {};
    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        errors.newPassword = passwordValidation.errors[0];
      }
    }

    if (Object.keys(errors).length > 0) {
      return sendValidationError(res, errors);
    }

    // Get models from app context
    const models = req.app.get('models');

    // Change password
    await profileService.changeUserPassword(
      req.user.id,
      currentPassword,
      newPassword,
      models,
    );

    return sendSuccess(res, {
      message: 'Password changed successfully',
    });
  } catch (error) {
    if (error.message === 'Invalid current password') {
      return sendValidationError(res, {
        currentPassword: 'Current password is incorrect',
      });
    }

    return sendServerError(res, 'Failed to change password');
  }
}

/**
 * Get user activity log
 *
 * @route   GET /api/users/profile/activity
 * @access  Private (requires authentication)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getActivity(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Get models from app context
    const models = req.app.get('models');

    // Get user activity
    const result = await profileService.getUserActivity(
      req.user.id,
      { page, limit },
      models,
    );

    return sendSuccess(res, result);
  } catch (error) {
    return sendServerError(res, 'Failed to get user activity');
  }
}

/**
 * Update user preferences
 *
 * @route   PUT /api/users/profile/preferences
 * @access  Private (requires authentication)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function updatePreferences(req, res) {
  try {
    const { language, timezone, notifications, theme } = req.body;

    // Get models from app context
    const models = req.app.get('models');

    // Update preferences
    const preferences = await profileService.updateUserPreferences(
      req.user.id,
      {
        language,
        timezone,
        notifications,
        theme,
      },
      models,
    );

    return sendSuccess(res, {
      message: 'Preferences updated successfully',
      preferences,
    });
  } catch (error) {
    return sendServerError(res, 'Failed to update preferences');
  }
}

/**
 * Get user preferences
 *
 * @route   GET /api/users/profile/preferences
 * @access  Private (requires authentication)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getPreferences(req, res) {
  try {
    // Get models from app context
    const models = req.app.get('models');

    // Get preferences
    const preferences = await profileService.getUserPreferences(
      req.user.id,
      models,
    );

    return sendSuccess(res, { preferences });
  } catch (error) {
    return sendServerError(res, 'Failed to get preferences');
  }
}

/**
 * Delete user account
 *
 * @route   DELETE /api/users/profile
 * @access  Private (requires authentication)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function deleteAccount(req, res) {
  try {
    const { password, confirm } = req.body;

    // Validate input
    const errors = {};
    if (!password) {
      errors.password = 'Password is required to delete account';
    }
    if (confirm !== 'DELETE_MY_ACCOUNT') {
      errors.confirm = 'Must provide exact confirmation: DELETE_MY_ACCOUNT';
    }

    if (Object.keys(errors).length > 0) {
      return sendValidationError(res, errors);
    }

    // Get models from app context
    const models = req.app.get('models');

    // Delete account
    await profileService.deleteUserAccount(req.user.id, password, models);

    // Clear token cookie
    res.clearCookie('id_token');

    return sendSuccess(res, {
      message: 'Account deleted successfully',
    });
  } catch (error) {
    if (error.message === 'Invalid password') {
      return sendValidationError(res, {
        password: 'Password is incorrect',
      });
    }

    return sendServerError(res, 'Failed to delete account');
  }
}
