/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import DataType from 'sequelize';
import Model from '../../sequelize';

/**
 * UserRole Model (Junction Table)
 *
 * Links users to roles (many-to-many relationship).
 * A user can have multiple roles, and a role can be assigned to multiple users.
 */
const UserRole = Model.define(
  'UserRole',
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV1,
      primaryKey: true,
      comment: 'Unique user-role assignment identifier',
    },

    userId: {
      type: DataType.UUID,
      allowNull: false,
      comment: 'User ID',
    },

    roleId: {
      type: DataType.UUID,
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

export default UserRole;
