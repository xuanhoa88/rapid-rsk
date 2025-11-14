/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/**
 * Services Index
 *
 * Centralized exports for all user module services.
 * This allows for cleaner imports and better organization.
 */

// Export user management services (separated for clarity)
export * as authService from './auth.service';
export * as profileService from './profile.service';
export * as userAdminService from './user-admin.service';

// Export RBAC services (separated for clarity)
export * as roleService from './role.service';
export * as permissionService from './permission.service';
export * as groupService from './group.service';
export * as userRbacService from './user-rbac.service';
