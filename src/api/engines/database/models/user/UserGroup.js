/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import DataType from 'sequelize';
import Model from '../../sequelize';

/**
 * UserGroup Model (Junction Table)
 *
 * Links users to groups (many-to-many relationship).
 * A user can belong to multiple groups, and a group can have multiple users.
 */
const UserGroup = Model.define(
  'UserGroup',
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV1,
      primaryKey: true,
      comment: 'Unique user-group membership identifier',
    },

    userId: {
      type: DataType.UUID,
      allowNull: false,
      comment: 'User ID',
    },

    groupId: {
      type: DataType.UUID,
      allowNull: false,
      comment: 'Group ID',
    },
  },
  {
    indexes: [
      { fields: ['userId'] },
      { fields: ['groupId'] },
      { fields: ['userId', 'groupId'], unique: true },
    ],
    timestamps: true,
  },
);

export default UserGroup;
