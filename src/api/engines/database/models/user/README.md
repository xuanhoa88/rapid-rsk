# User Models - RBAC System

Complete Role-Based Access Control (RBAC) system for user authentication and authorization.

## 📁 Structure

```
user/
├── User.js              # Core user entity
├── UserProfile.js       # Extended user information
├── UserLogin.js         # OAuth provider tracking
├── Role.js              # User roles (admin, user, moderator)
├── Permission.js        # Granular permissions (resource:action)
├── Group.js             # User groups (Engineering, Marketing)
├── UserRole.js          # User ↔ Role junction table
├── RolePermission.js    # Role ↔ Permission junction table
├── UserGroup.js         # User ↔ Group junction table
├── GroupRole.js         # Group ↔ Role junction table
├── index.js             # Exports models and relationships
└── README.md            # This file
```

## 🎯 Models Overview

### Core User Models

#### User
**Purpose:** Core user entity for authentication

**Fields:**
- `id` (UUID) - Unique identifier
- `email` (STRING, UNIQUE) - User email address
- `emailConfirmed` (BOOLEAN) - Email verification status
- `password` (STRING) - PBKDF2 hashed password (null for OAuth-only users)
- `isActive` (BOOLEAN) - Account activation status
- `isLocked` (BOOLEAN) - Security lockout flag
- `failedLoginAttempts` (INTEGER) - Brute force protection counter
- `lastLoginAt` (DATE) - Last successful login
- `passwordChangedAt` (DATE) - Password rotation tracking

**Relationships:**
- Has many `UserLogin` (OAuth providers)
- Has one `UserProfile` (extended info)
- Belongs to many `Role` (through UserRole)
- Belongs to many `Group` (through UserGroup)

**Features:**
- ✅ Email/password authentication
- ✅ OAuth support (password can be null)
- ✅ Account locking after failed attempts
- ✅ Soft delete (paranoid mode)
- ✅ Login tracking

---

#### UserProfile
**Purpose:** Extended user information (one-to-one with User)

**Fields:**
- `userId` (UUID, PK) - Foreign key to User
- `displayName` (STRING) - User display name
- `picture` (STRING) - Profile picture URL
- `gender` (STRING) - User gender
- `location` (STRING) - User location
- `website` (STRING) - User website (URL validated)
- `bio` (TEXT) - User biography

**Relationships:**
- Belongs to `User`

---

#### UserLogin
**Purpose:** Track OAuth provider logins

**Fields:**
- `id` (UUID) - Unique identifier
- `userId` (UUID) - Foreign key to User
- `name` (STRING) - Provider name (google, facebook, github)
- `key` (STRING) - Provider user ID

**Relationships:**
- Belongs to `User`

**Features:**
- ✅ Multiple OAuth providers per user
- ✅ Unique constraint on (name, key)
- ✅ Supports mixed authentication (local + OAuth)

---

### RBAC Models

#### Role
**Purpose:** Define user roles (admin, user, moderator)

**Fields:**
- `id` (UUID) - Unique identifier
- `name` (STRING, UNIQUE) - Role name
- `description` (STRING) - Role description
- `isActive` (BOOLEAN) - Whether role is active

**Relationships:**
- Belongs to many `User` (through UserRole)
- Belongs to many `Permission` (through RolePermission)
- Belongs to many `Group` (through GroupRole)

**Examples:**
```javascript
{ name: 'admin', description: 'System administrator' }
{ name: 'user', description: 'Regular user' }
{ name: 'moderator', description: 'Content moderator' }
```

---

#### Permission
**Purpose:** Granular permissions (resource:action)

**Fields:**
- `id` (UUID) - Unique identifier
- `name` (STRING, UNIQUE) - Permission name (e.g., users:read)
- `resource` (STRING) - Resource type (users, posts, comments)
- `action` (STRING) - Action type (read, write, delete, update)
- `description` (STRING) - Permission description
- `isActive` (BOOLEAN) - Whether permission is active

**Relationships:**
- Belongs to many `Role` (through RolePermission)

**Examples:**
```javascript
{ name: 'users:read', resource: 'users', action: 'read' }
{ name: 'users:write', resource: 'users', action: 'write' }
{ name: 'posts:delete', resource: 'posts', action: 'delete' }
```

---

#### Group
**Purpose:** Organize users into groups

**Fields:**
- `id` (UUID) - Unique identifier
- `name` (STRING, UNIQUE) - Group name
- `description` (STRING) - Group description
- `isActive` (BOOLEAN) - Whether group is active

**Relationships:**
- Belongs to many `User` (through UserGroup)
- Belongs to many `Role` (through GroupRole)

**Examples:**
```javascript
{ name: 'Engineering', description: 'Engineering team' }
{ name: 'Marketing', description: 'Marketing team' }
{ name: 'Support', description: 'Customer support team' }
```

---

### Junction Tables

#### UserRole
**Purpose:** Link users to roles (many-to-many)

**Fields:**
- `id` (UUID) - Unique identifier
- `userId` (UUID) - User ID
- `roleId` (UUID) - Role ID

**Constraints:**
- Unique (userId, roleId)

---

#### RolePermission
**Purpose:** Link roles to permissions (many-to-many)

**Fields:**
- `id` (UUID) - Unique identifier
- `roleId` (UUID) - Role ID
- `permissionId` (UUID) - Permission ID

**Constraints:**
- Unique (roleId, permissionId)

---

#### UserGroup
**Purpose:** Link users to groups (many-to-many)

**Fields:**
- `id` (UUID) - Unique identifier
- `userId` (UUID) - User ID
- `groupId` (UUID) - Group ID

**Constraints:**
- Unique (userId, groupId)

---

#### GroupRole
**Purpose:** Link groups to roles (many-to-many)

**Fields:**
- `id` (UUID) - Unique identifier
- `groupId` (UUID) - Group ID
- `roleId` (UUID) - Role ID

**Constraints:**
- Unique (groupId, roleId)

---

## 🔗 Relationships Diagram

```
User ──┬─→ UserLogin (OAuth providers)
       │
       ├─→ UserProfile (extended info)
       │
       ├─→ UserRole ──→ Role ──→ RolePermission ──→ Permission
       │                  │
       │                  └──→ GroupRole ──→ Group
       │
       └─→ UserGroup ──→ Group ──→ GroupRole ──→ Role ──→ Permission
```

### Authorization Paths

**Direct User Permissions:**
```
User → UserRole → Role → RolePermission → Permission
```

**Group-Based Permissions:**
```
User → UserGroup → Group → GroupRole → Role → RolePermission → Permission
```

---

## 💡 Usage Examples

### 1. Create User with Role

```javascript
import { User, Role, UserRole } from './models';

// Create user
const user = await User.create({
  email: 'admin@example.com',
  password: hashedPassword,
  emailConfirmed: true,
});

// Find admin role
const adminRole = await Role.findOne({ where: { name: 'admin' } });

// Assign role to user
await user.addRole(adminRole);
// Or: await UserRole.create({ userId: user.id, roleId: adminRole.id });
```

### 2. Create Role with Permissions

```javascript
import { Role, Permission, RolePermission } from './models';

// Create role
const moderatorRole = await Role.create({
  name: 'moderator',
  description: 'Content moderator',
});

// Create permissions
const readPosts = await Permission.create({
  name: 'posts:read',
  resource: 'posts',
  action: 'read',
});

const deletePosts = await Permission.create({
  name: 'posts:delete',
  resource: 'posts',
  action: 'delete',
});

// Assign permissions to role
await moderatorRole.addPermissions([readPosts, deletePosts]);
```

### 3. Check User Permissions

```javascript
import { User, Role, Permission } from './models';

// Get user with roles and permissions
const user = await User.findByPk(userId, {
  include: [
    {
      model: Role,
      as: 'roles',
      include: [
        {
          model: Permission,
          as: 'permissions',
        },
      ],
    },
  ],
});

// Check if user has specific permission
const hasPermission = user.roles.some(role =>
  role.permissions.some(p => p.name === 'users:write'),
);
```

### 4. Group Management

```javascript
import { Group, Role, User } from './models';

// Create group
const engineeringGroup = await Group.create({
  name: 'Engineering',
  description: 'Engineering team',
});

// Add users to group
await engineeringGroup.addUsers([user1, user2, user3]);

// Assign roles to group
const developerRole = await Role.findOne({ where: { name: 'developer' } });
await engineeringGroup.addRole(developerRole);

// Get all users in group with their roles
const group = await Group.findByPk(groupId, {
  include: [
    { model: User, as: 'users' },
    { model: Role, as: 'roles' },
  ],
});
```

### 5. Complete Permission Check

```javascript
async function checkUserAccess(userId, resource, action) {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Role,
        as: 'roles',
        include: [{ model: Permission, as: 'permissions' }],
      },
      {
        model: Group,
        as: 'groups',
        include: [
          {
            model: Role,
            as: 'roles',
            include: [{ model: Permission, as: 'permissions' }],
          },
        ],
      },
    ],
  });

  // Check direct user roles
  const directPermissions = user.roles.flatMap(r => r.permissions);
  
  // Check group roles
  const groupPermissions = user.groups.flatMap(g =>
    g.roles.flatMap(r => r.permissions),
  );

  // Combine all permissions
  const allPermissions = [...directPermissions, ...groupPermissions];

  // Check if user has permission
  return allPermissions.some(
    p => p.resource === resource && p.action === action,
  );
}

// Usage
const canWrite = await checkUserAccess(userId, 'users', 'write');
```

### 6. Authentication Tracking

```javascript
import { User } from './models';

// Track failed login
const user = await User.findOne({ where: { email } });
await user.increment('failedLoginAttempts');

// Lock account after 5 failed attempts
if (user.failedLoginAttempts >= 5) {
  await user.update({ isLocked: true });
}

// Reset on successful login
await user.update({
  failedLoginAttempts: 0,
  lastLoginAt: new Date(),
});
```

### 7. OAuth Login

```javascript
import { User, UserLogin } from './models';

// Link OAuth provider
await UserLogin.create({
  userId: user.id,
  name: 'google',
  key: googleUserId,
});

// Find user by OAuth
const login = await UserLogin.findOne({
  where: { name: 'google', key: googleUserId },
  include: [User],
});

if (login) {
  const user = login.user;
  // User found via OAuth
}
```

---

## 🔒 Security Features

### Password Security
- ✅ PBKDF2 hashing (10,000 iterations, SHA-512)
- ✅ Random salt per password
- ✅ Password change tracking
- ✅ Supports OAuth-only users (null password)

### Account Security
- ✅ Account locking after failed attempts
- ✅ Failed login attempt counter
- ✅ Email verification flag
- ✅ Active/inactive account status
- ✅ Soft delete (paranoid mode)

### Authorization Security
- ✅ Granular permissions (resource:action)
- ✅ Role-based access control
- ✅ Group-based permissions
- ✅ Permission inheritance via roles
- ✅ Active/inactive roles and permissions

---

## 📊 Database Schema

### Indexes

**User:**
- `email` (unique)
- `isActive`
- `isLocked`

**Role:**
- `name` (unique)
- `isActive`

**Permission:**
- `name` (unique)
- `resource`
- `action`
- `(resource, action)` (unique)
- `isActive`

**Group:**
- `name` (unique)
- `isActive`

**UserLogin:**
- `userId`
- `(name, key)` (unique)

**UserRole:**
- `userId`
- `roleId`
- `(userId, roleId)` (unique)

**RolePermission:**
- `roleId`
- `permissionId`
- `(roleId, permissionId)` (unique)

**UserGroup:**
- `userId`
- `groupId`
- `(userId, groupId)` (unique)

**GroupRole:**
- `groupId`
- `roleId`
- `(groupId, roleId)` (unique)

---

## 🎯 Best Practices

### 1. Use Roles for Common Permissions
```javascript
// ✅ Good - Assign role with multiple permissions
await user.addRole(moderatorRole); // Includes posts:read, posts:delete, etc.

// ❌ Bad - Assign individual permissions to user
// (Use UserClaim for this - but we removed it!)
```

### 2. Use Groups for Team-Based Access
```javascript
// ✅ Good - Add user to group, group has roles
await engineeringGroup.addUser(user);
await engineeringGroup.addRole(developerRole);

// ❌ Bad - Assign same role to each user individually
```

### 3. Check Permissions, Not Roles
```javascript
// ✅ Good - Check specific permission
const canDelete = await checkUserAccess(userId, 'posts', 'delete');

// ❌ Bad - Check role name
const isAdmin = user.roles.some(r => r.name === 'admin');
```

### 4. Use Resource:Action Pattern
```javascript
// ✅ Good - Clear resource and action
{ name: 'users:write', resource: 'users', action: 'write' }

// ❌ Bad - Vague permission name
{ name: 'manage_users', resource: '?', action: '?' }
```

### 5. Keep Roles Active/Inactive
```javascript
// ✅ Good - Deactivate instead of delete
await role.update({ isActive: false });

// ❌ Bad - Delete role (breaks relationships)
await role.destroy();
```

---

## 🚀 Initialization

The relationships are initialized automatically when you call `initializeModels()`:

```javascript
import { initializeModels } from './models';

// Initialize all models and relationships
const models = initializeModels();

// Access models
const { User, Role, Permission, Group } = models;
```

The `initializeUserRelationships()` function is called internally by `initializeModels()`.

---

## 📝 Notes

### Why No UserClaim?
We removed `UserClaim` because it was redundant with the proper RBAC system. Everything UserClaim did is now better handled by:
- **Roles** - Structured roles with metadata
- **Permissions** - Granular resource:action permissions
- **Groups** - User organization
- **Junction tables** - Proper many-to-many relationships

### Soft Delete
The `User` model uses `paranoid: true` for soft deletes:
- Deleted users are marked with `deletedAt` timestamp
- Not returned in normal queries
- Can be restored if needed
- Maintains referential integrity

### OAuth Support
Users can authenticate via:
- **Local** - Email/password (password field populated)
- **OAuth** - Google, Facebook, GitHub (password field null)
- **Mixed** - Both local and OAuth (password field populated)

---

## 🔧 Extending the System

### Add New Permission
```javascript
const newPermission = await Permission.create({
  name: 'comments:moderate',
  resource: 'comments',
  action: 'moderate',
  description: 'Moderate user comments',
});

await moderatorRole.addPermission(newPermission);
```

### Add New Role
```javascript
const editorRole = await Role.create({
  name: 'editor',
  description: 'Content editor',
});

// Assign permissions
await editorRole.addPermissions([
  readPermission,
  writePermission,
  updatePermission,
]);
```

### Add New Group
```javascript
const salesGroup = await Group.create({
  name: 'Sales',
  description: 'Sales team',
});

// Assign roles
await salesGroup.addRole(salesRole);

// Add users
await salesGroup.addUsers([user1, user2]);
```

---

## 📚 Related Documentation

- [Database Engine](../../README.md) - Database configuration and sync
- [API Models](../README.md) - All database models
- [Authentication](../../../../controllers/auth.js) - Auth controller
- [Middleware](../../../../middleware/auth.js) - Auth middleware

---

## ✅ Summary

This RBAC system provides:
- ✅ **Complete authentication** - Email/password + OAuth
- ✅ **Granular permissions** - Resource:action pattern
- ✅ **Role hierarchy** - Roles with multiple permissions
- ✅ **Group support** - Team-based access control
- ✅ **Security features** - Account locking, soft delete, tracking
- ✅ **Flexible architecture** - Easy to extend and customize
- ✅ **Production ready** - Indexes, constraints, validation

**Total Models:** 10 (3 core + 3 RBAC + 4 junction tables)
