/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import DataType from 'sequelize';
import Model from '../../sequelize';

/**
 * GroupRole Model (Junction Table)
 *
 * Links groups to roles (many-to-many relationship).
 * A group can have multiple roles, and a role can be assigned to multiple groups.
 */
const GroupRole = Model.define(
  'GroupRole',
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV1,
      primaryKey: true,
      comment: 'Unique group-role assignment identifier',
    },

    groupId: {
      type: DataType.UUID,
      allowNull: false,
      comment: 'Group ID',
    },

    roleId: {
      type: DataType.UUID,
      allowNull: false,
      comment: 'Role ID',
    },
  },
  {
    indexes: [
      { fields: ['groupId'] },
      { fields: ['roleId'] },
      { fields: ['groupId', 'roleId'], unique: true },
    ],
    timestamps: true,
  },
);

export default GroupRole;
