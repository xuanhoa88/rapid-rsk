/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import DataType from 'sequelize';
import Model from '../../sequelize';

/**
 * Permission Model
 *
 * Defines permissions in the system.
 * Permissions are granular actions that can be assigned to roles.
 *
 * Examples:
 * - resource: 'users', action: 'read', name: 'users:read'
 * - resource: 'users', action: 'write', name: 'users:write'
 * - resource: 'posts', action: 'delete', name: 'posts:delete'
 */
const Permission = Model.define(
  'Permission',
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV1,
      primaryKey: true,
      comment: 'Unique permission identifier',
    },

    name: {
      type: DataType.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Permission name (e.g., users:read, posts:write)',
    },

    resource: {
      type: DataType.STRING(50),
      allowNull: false,
      comment: 'Resource type (e.g., users, posts, comments)',
    },

    action: {
      type: DataType.STRING(50),
      allowNull: false,
      comment: 'Action type (e.g., read, write, delete, update)',
    },

    description: {
      type: DataType.STRING(255),
      allowNull: true,
      comment: 'Permission description',
    },

    isActive: {
      type: DataType.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether permission is active',
    },
  },
  {
    indexes: [
      { fields: ['name'], unique: true },
      { fields: ['resource'] },
      { fields: ['action'] },
      { fields: ['resource', 'action'], unique: true },
      { fields: ['isActive'] },
    ],
    timestamps: true,
  },
);

export default Permission;
