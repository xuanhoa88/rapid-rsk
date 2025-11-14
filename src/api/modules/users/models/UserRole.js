/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */
import { DataTypes } from 'sequelize';

/**
 * UserRole Model Factory (Junction Table)
 *
 * Creates the UserRole model with the provided Sequelize instance.
 * Links users to roles (many-to-many relationship).
 * A user can have multiple roles, and a role can be assigned to multiple users.
 *
 * @param {Object} Model - Sequelize instance
 * @returns {Model} UserRole model
 */
export default function createUserRoleModel(Model) {
  const UserRole = Model.define(
    'UserRole',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        primaryKey: true,
        comment: 'Unique user-role assignment identifier',
      },

      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'User ID',
      },

      roleId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Role ID',
      },
    },
    {
      indexes: [
        { fields: ['userId'] },
        { fields: ['roleId'] },
        { fields: ['userId', 'roleId'], unique: true },
      ],
      timestamps: true,
    },
  );

  return UserRole;
}
