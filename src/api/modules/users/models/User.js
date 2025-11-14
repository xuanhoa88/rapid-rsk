/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { DataTypes } from 'sequelize';

/**
 * User Model Factory
 *
 * Creates the User model with the provided Sequelize instance.
 * Core user model for authentication and user management.
 *
 * @param {Object} Model - Sequelize instance
 * @returns {Model} User model
 */
export default function createUserModel(Model) {
  const User = Model.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        primaryKey: true,
        comment: 'Unique user identifier',
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
        comment: 'User email address (unique)',
      },

      emailConfirmed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether email has been verified',
      },

      password: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Hashed password (PBKDF2) - null for OAuth-only users',
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Whether user account is active',
      },

      isLocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether user account is locked (security)',
      },

      failedLoginAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Number of failed login attempts',
      },

      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Last successful login timestamp',
      },

      passwordChangedAt: {
        type: DataTypes.DATE,
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

  return User;
}
