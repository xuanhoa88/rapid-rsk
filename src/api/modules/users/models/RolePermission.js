/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */
import { DataTypes } from 'sequelize';

/**
 * RolePermission Model Factory (Junction Table)
 *
 * Creates the RolePermission model with the provided Sequelize instance.
 * Links roles to permissions (many-to-many relationship).
 * A role can have multiple permissions, and a permission can belong to multiple roles.
 *
 * @param {Object} Model - Sequelize instance
 * @returns {Model} RolePermission model
 */
export default function createRolePermissionModel(Model) {
  const RolePermission = Model.define(
    'RolePermission',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        primaryKey: true,
        comment: 'Unique role-permission assignment identifier',
      },

      roleId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Role ID',
      },

      permissionId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Permission ID',
      },
    },
    {
      indexes: [
        { fields: ['roleId'] },
        { fields: ['permissionId'] },
        { fields: ['roleId', 'permissionId'], unique: true },
      ],
      timestamps: true,
    },
  );

  return RolePermission;
}
