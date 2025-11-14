/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */
import { DataTypes } from 'sequelize';

/**
 * UserLogin Model Factory
 *
 * Creates the UserLogin model with the provided Sequelize instance.
 * Tracks OAuth provider logins for users.
 * Allows users to authenticate via multiple OAuth providers.
 *
 * Examples:
 * - name: 'google', key: 'google-user-id-123'
 * - name: 'facebook', key: 'facebook-user-id-456'
 * - name: 'github', key: 'github-user-id-789'
 *
 * @param {Object} Model - Sequelize instance
 * @returns {Model} UserLogin model
 */
export default function createUserLoginModel(Model) {
  const UserLogin = Model.define(
    'UserLogin',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        primaryKey: true,
        comment: 'Unique login identifier',
      },

      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'User this login belongs to',
      },

      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'OAuth provider name (google, facebook, github, etc.)',
      },

      key: {
        type: DataTypes.STRING(255),
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

  return UserLogin;
}
