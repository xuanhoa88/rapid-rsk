/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import DataType from 'sequelize';
import Model from '../../sequelize';

/**
 * RolePermission Model (Junction Table)
 *
 * Links roles to permissions (many-to-many relationship).
 * A role can have multiple permissions, and a permission can belong to multiple roles.
 */
const RolePermission = Model.define(
  'RolePermission',
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV1,
      primaryKey: true,
      comment: 'Unique role-permission assignment identifier',
    },

    roleId: {
      type: DataType.UUID,
      allowNull: false,
      comment: 'Role ID',
    },

    permissionId: {
      type: DataType.UUID,
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

export default RolePermission;
