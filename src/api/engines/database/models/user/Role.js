/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import DataType from 'sequelize';
import Model from '../../sequelize';

/**
 * Role Model
 *
 * Defines roles in the system (e.g., admin, user, moderator).
 * Roles can have multiple permissions.
 *
 * Examples:
 * - name: 'admin', description: 'System administrator'
 * - name: 'user', description: 'Regular user'
 * - name: 'moderator', description: 'Content moderator'
 */
const Role = Model.define(
  'Role',
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV1,
      primaryKey: true,
      comment: 'Unique role identifier',
    },

    name: {
      type: DataType.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Role name (e.g., admin, user, moderator)',
    },

    description: {
      type: DataType.STRING(255),
      allowNull: true,
      comment: 'Role description',
    },

    isActive: {
      type: DataType.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether role is active',
    },
  },
  {
    indexes: [
      { fields: ['name'], unique: true },
      { fields: ['isActive'] },
    ],
    timestamps: true,
  },
);

export default Role;
