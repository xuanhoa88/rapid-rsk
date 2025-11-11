/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import DataType from 'sequelize';
import Model from '../../sequelize';

/**
 * User Model
 *
 * Core user entity for authentication and authorization.
 * Supports both local (email/password) and OAuth authentication.
 */
const User = Model.define(
  'User',
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV1,
      primaryKey: true,
      comment: 'Unique user identifier',
    },

    email: {
      type: DataType.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
      comment: 'User email address (unique)',
    },

    emailConfirmed: {
      type: DataType.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether email has been verified',
    },

    password: {
      type: DataType.STRING(255),
      allowNull: true,
      comment: 'Hashed password (PBKDF2) - null for OAuth-only users',
    },

    isActive: {
      type: DataType.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether user account is active',
    },

    isLocked: {
      type: DataType.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether user account is locked (security)',
    },

    failedLoginAttempts: {
      type: DataType.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Number of failed login attempts',
    },

    lastLoginAt: {
      type: DataType.DATE,
      allowNull: true,
      comment: 'Last successful login timestamp',
    },

    passwordChangedAt: {
      type: DataType.DATE,
      allowNull: true,
      comment: 'When password was last changed',
    },
  },
  {
    indexes: [
      { fields: ['email'], unique: true },
      { fields: ['isActive'] },
      { fields: ['isLocked'] },
    ],
    timestamps: true,
    paranoid: true, // Soft delete support
  },
);

export default User;
