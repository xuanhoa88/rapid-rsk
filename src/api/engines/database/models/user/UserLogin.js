/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import DataType from 'sequelize';
import Model from '../../sequelize';

/**
 * UserLogin Model
 *
 * Tracks OAuth provider logins for users.
 * Allows users to authenticate via multiple OAuth providers.
 *
 * Examples:
 * - name: 'google', key: 'google-user-id-123'
 * - name: 'facebook', key: 'facebook-user-id-456'
 * - name: 'github', key: 'github-user-id-789'
 */
const UserLogin = Model.define(
  'UserLogin',
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV1,
      primaryKey: true,
      comment: 'Unique login identifier',
    },

    userId: {
      type: DataType.UUID,
      allowNull: false,
      comment: 'User this login belongs to',
    },

    name: {
      type: DataType.STRING(50),
      allowNull: false,
      comment: 'OAuth provider name (google, facebook, github, etc.)',
    },

    key: {
      type: DataType.STRING(255),
      allowNull: false,
      comment: 'OAuth provider user ID',
    },
  },
  {
    indexes: [
      { fields: ['userId'] },
      { fields: ['name', 'key'], unique: true },
    ],
    timestamps: true,
  },
);

export default UserLogin;
