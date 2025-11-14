/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */
import { DataTypes } from 'sequelize';

/**
 * Permission Model Factory
 *
 * Creates the Permission model with the provided Sequelize instance.
 * Defines permissions in the system.
 * Permissions are granular actions that can be assigned to roles.
 *
 * Examples:
 * - resource: 'users', action: 'read', name: 'users:read'
 * - resource: 'users', action: 'write', name: 'users:write'
 * - resource: 'posts', action: 'delete', name: 'posts:delete'
 *
 * @param {Object} Model - Sequelize instance
 * @returns {Model} Permission model
 */
export default function createPermissionModel(Model) {
  const Permission = Model.define(
    'Permission',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        primaryKey: true,
        comment: 'Unique permission identifier',
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Permission name (e.g., users:read, posts:write)',
      },

      resource: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Resource type (e.g., users, posts, comments)',
      },

      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Action type (e.g., read, write, delete, update)',
      },

      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Permission description',
      },

      isActive: {
        type: DataTypes.BOOLEAN,
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

  return Permission;
}
