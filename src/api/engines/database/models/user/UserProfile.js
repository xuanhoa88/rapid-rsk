/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import DataType from 'sequelize';
import Model from '../../sequelize';

/**
 * UserProfile Model
 *
 * Stores additional user profile information.
 * One-to-one relationship with User model.
 */
const UserProfile = Model.define(
  'UserProfile',
  {
    userId: {
      type: DataType.UUID,
      primaryKey: true,
      comment: 'User this profile belongs to',
    },

    displayName: {
      type: DataType.STRING(100),
      allowNull: true,
      comment: 'User display name',
    },

    picture: {
      type: DataType.STRING(255),
      allowNull: true,
      comment: 'Profile picture URL',
    },

    gender: {
      type: DataType.STRING(50),
      allowNull: true,
      comment: 'User gender',
    },

    location: {
      type: DataType.STRING(100),
      allowNull: true,
      comment: 'User location',
    },

    website: {
      type: DataType.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true,
      },
      comment: 'User website URL',
    },

    bio: {
      type: DataType.TEXT,
      allowNull: true,
      comment: 'User biography',
    },
  },
  {
    timestamps: true,
  },
);

export default UserProfile;
