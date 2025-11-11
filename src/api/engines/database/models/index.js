/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import {
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
  initializeUserRelationships,
} from './user';

/**
 * Initialize database models and relationships
 *
 * This function sets up all model relationships (associations).
 * It should be called once during application bootstrap.
 *
 * @returns {Object} All database models
 */
export default function initializeModels() {
  // Initialize user-related relationships
  initializeUserRelationships();

  // TODO: Add other domain relationships here
  // Example:
  // initializeProductRelationships();
  // initializeOrderRelationships();

  // Return all models
  return {
    // Core user models
    User,
    UserLogin,
    UserProfile,
    // RBAC models
    Role,
    Permission,
    Group,
    // Junction tables
    UserRole,
    RolePermission,
    UserGroup,
    GroupRole,
  };
}

// Named exports for backward compatibility
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
