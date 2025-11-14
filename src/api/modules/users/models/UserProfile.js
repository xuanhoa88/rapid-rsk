/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { DataTypes } from 'sequelize';

/**
 * UserProfile Model Factory
 *
 * Creates the UserProfile model with the provided Sequelize instance.
 * Stores additional user profile information.
 * One-to-one relationship with User model.
 *
 * @param {Object} Model - Sequelize instance
 * @returns {Model} UserProfile model
 */
export default function createUserProfileModel(Model) {
  const UserProfile = Model.define(
    'UserProfile',
    {
      userId: {
        type: DataTypes.UUID,
        primaryKey: true,
        comment: 'User this profile belongs to',
      },

      displayName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'User display name',
      },

      picture: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Profile picture URL',
      },

      gender: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'User gender',
      },

      location: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'User location',
      },

      website: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isUrl: true,
        },
        comment: 'User website URL',
      },

      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'User biography',
      },
    },
    {
      timestamps: true,
    },
  );

  return UserProfile;
}
