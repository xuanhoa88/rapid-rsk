/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */
import { DataTypes } from 'sequelize';

/**
 * Role Model Factory
 *
 * Creates the Role model with the provided Sequelize instance.
 * Defines roles in the system (e.g., admin, user, moderator).
 * Roles can have multiple permissions.
 *
 * Examples:
 * - name: 'admin', description: 'System administrator'
 * - name: 'user', description: 'Regular user'
 * - name: 'moderator', description: 'Content moderator'
 *
 * @param {Object} Model - Sequelize instance
 * @returns {Model} Role model
 */
export default function createRoleModel(Model) {
  const Role = Model.define(
    'Role',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        primaryKey: true,
        comment: 'Unique role identifier',
      },

      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Role name (e.g., admin, user, moderator)',
      },

      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Role description',
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Whether role is active',
      },
    },
    {
      indexes: [{ fields: ['name'], unique: true }, { fields: ['isActive'] }],
      timestamps: true,
    },
  );

  return Role;
}
