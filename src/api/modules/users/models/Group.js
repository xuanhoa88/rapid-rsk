/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */
import { DataTypes } from 'sequelize';

/**
 * Group Model Factory
 *
 * Creates the Group model with the provided Sequelize instance.
 * Defines user groups for organizing users.
 * Groups can have roles and permissions.
 *
 * Examples:
 * - name: 'Engineering', description: 'Engineering team'
 * - name: 'Marketing', description: 'Marketing team'
 * - name: 'Support', description: 'Customer support team'
 *
 * @param {Object} Model - Sequelize instance
 * @returns {Model} Group model
 */
export default function createGroupModel(Model) {
  const Group = Model.define(
    'Group',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        primaryKey: true,
        comment: 'Unique group identifier',
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Group name',
      },

      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Group description',
      },

      isActive: {
        type: DataTypes.BOOLEAN,
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

  return Group;
}
