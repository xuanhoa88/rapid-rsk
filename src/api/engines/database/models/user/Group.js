/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import DataType from 'sequelize';
import Model from '../../sequelize';

/**
 * Group Model
 *
 * Defines user groups for organizing users.
 * Groups can have roles and permissions.
 *
 * Examples:
 * - name: 'Engineering', description: 'Engineering team'
 * - name: 'Marketing', description: 'Marketing team'
 * - name: 'Support', description: 'Customer support team'
 */
const Group = Model.define(
  'Group',
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV1,
      primaryKey: true,
      comment: 'Unique group identifier',
    },

    name: {
      type: DataType.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Group name',
    },

    description: {
      type: DataType.STRING(255),
      allowNull: true,
      comment: 'Group description',
    },

    isActive: {
      type: DataType.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether group is active',
    },
  },
  {
    indexes: [{ fields: ['name'], unique: true }, { fields: ['isActive'] }],
    timestamps: true,
  },
);

export default Group;
