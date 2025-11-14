/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

// Core user models (factory functions)
import createUserModel from './User';
import createUserLoginModel from './UserLogin';
import createUserProfileModel from './UserProfile';

// RBAC models (factory functions)
import createRoleModel from './Role';
import createPermissionModel from './Permission';
import createGroupModel from './Group';

// Junction tables (factory functions)
import createUserRoleModel from './UserRole';
import createRolePermissionModel from './RolePermission';
import createUserGroupModel from './UserGroup';
import createGroupRoleModel from './GroupRole';

/**
 * Initialize user-related model relationships
 *
 * This function sets up all relationships between user models.
 * Called internally by the factory function.
 *
 * @param {Object} models - All model instances
 */
function initializeUserRelationships(models) {
  const {
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
  } = models;
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

/**
 * Auth Models Factory
 *
 * Factory function for initializing user models and their relationships.
 * Called by API bootstrap during model discovery.
 *
 * This function sets up all Sequelize model relationships for the user module:
 * - User <-> UserLogin (One-to-Many)
 * - User <-> UserProfile (One-to-One)
 * - User <-> Role (Many-to-Many through UserRole)
 * - Role <-> Permission (Many-to-Many through RolePermission)
 * - User <-> Group (Many-to-Many through UserGroup)
 * - Group <-> Role (Many-to-Many through GroupRole)
 *
 * @param {Object} deps - Dependencies injected by API bootstrap
 * @param {Object} deps.Model - Sequelize instance for database operations
 * @param {Object} deps.jwtConfig - JWT configuration
 * @param {string} deps.jwtConfig.secret - JWT secret key
 * @param {string} deps.jwtConfig.expiresIn - JWT expiration time
 * @param {Object} app - Express app instance (for accessing app-level settings like jwtSecret)
 * @returns {Object} Auth models with initialized relationships
 * @returns {Model} .User - User model
 * @returns {Model} .UserLogin - UserLogin model (OAuth providers)
 * @returns {Model} .UserProfile - UserProfile model
 * @returns {Model} .Role - Role model (RBAC)
 * @returns {Model} .Permission - Permission model (RBAC)
 * @returns {Model} .Group - Group model (RBAC)
 * @returns {Model} .UserRole - UserRole junction table
 * @returns {Model} .RolePermission - RolePermission junction table
 * @returns {Model} .UserGroup - UserGroup junction table
 * @returns {Model} .GroupRole - GroupRole junction table
 *
 * @example
 * // Called by API bootstrap during model discovery
 * const userModels = initializeAuthModels(
 *   { sequelize, jwtConfig },
 *   app
 * );
 * // Returns: { User, UserLogin, UserProfile, Role, Permission, ... }
 */
export default function initializeAuthModels(deps) {
  // Extract sequelize from dependencies
  const { sequelize } = deps;

  // Initialize all models with sequelize instance
  const User = createUserModel(sequelize);
  const UserLogin = createUserLoginModel(sequelize);
  const UserProfile = createUserProfileModel(sequelize);
  const Role = createRoleModel(sequelize);
  const Permission = createPermissionModel(sequelize);
  const Group = createGroupModel(sequelize);
  const UserRole = createUserRoleModel(sequelize);
  const RolePermission = createRolePermissionModel(sequelize);
  const UserGroup = createUserGroupModel(sequelize);
  const GroupRole = createGroupRoleModel(sequelize);

  // Prepare models object for relationships
  const models = {
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

  // Initialize all model relationships
  initializeUserRelationships(models);

  // Return all models
  return models;
}
