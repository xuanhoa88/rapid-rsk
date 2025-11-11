/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

// Core user models
import User from './User';
import UserLogin from './UserLogin';
import UserProfile from './UserProfile';

// RBAC models
import Role from './Role';
import Permission from './Permission';
import Group from './Group';

// Junction tables
import UserRole from './UserRole';
import RolePermission from './RolePermission';
import UserGroup from './UserGroup';
import GroupRole from './GroupRole';

/**
 * Initialize user-related model relationships
 *
 * This function sets up all relationships between user models.
 * Should be called during application bootstrap.
 */
export function initializeUserRelationships() {
  // ============================================================================
  // User Relationships
  // ============================================================================

  // User <-> UserLogin (One-to-Many)
  User.hasMany(UserLogin, {
    foreignKey: 'userId',
    as: 'logins',
    onUpdate: 'cascade',
    onDelete: 'cascade',
  });
  UserLogin.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });

  // User <-> UserProfile (One-to-One)
  User.hasOne(UserProfile, {
    foreignKey: 'userId',
    as: 'profile',
    onUpdate: 'cascade',
    onDelete: 'cascade',
  });
  UserProfile.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });

  // ============================================================================
  // RBAC Relationships
  // ============================================================================

  // User <-> Role (Many-to-Many through UserRole)
  User.belongsToMany(Role, {
    through: UserRole,
    foreignKey: 'userId',
    otherKey: 'roleId',
    as: 'roles',
  });
  Role.belongsToMany(User, {
    through: UserRole,
    foreignKey: 'roleId',
    otherKey: 'userId',
    as: 'users',
  });

  // Role <-> Permission (Many-to-Many through RolePermission)
  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: 'roleId',
    otherKey: 'permissionId',
    as: 'permissions',
  });
  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: 'permissionId',
    otherKey: 'roleId',
    as: 'roles',
  });

  // User <-> Group (Many-to-Many through UserGroup)
  User.belongsToMany(Group, {
    through: UserGroup,
    foreignKey: 'userId',
    otherKey: 'groupId',
    as: 'groups',
  });
  Group.belongsToMany(User, {
    through: UserGroup,
    foreignKey: 'groupId',
    otherKey: 'userId',
    as: 'users',
  });

  // Group <-> Role (Many-to-Many through GroupRole)
  Group.belongsToMany(Role, {
    through: GroupRole,
    foreignKey: 'groupId',
    otherKey: 'roleId',
    as: 'roles',
  });
  Role.belongsToMany(Group, {
    through: GroupRole,
    foreignKey: 'roleId',
    otherKey: 'groupId',
    as: 'groups',
  });
}

// Export all models
export {
  User,
  UserLogin,
  UserProfile,
  Role,
  Permission,
  Group,
  UserRole,
  RolePermission,
  UserGroup,
  GroupRole,
};
