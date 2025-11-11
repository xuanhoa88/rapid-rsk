# API Module - Dependency Injection Architecture

Professional modular API with **engines** (shared core) and **modules** (isolated features) using **dependency injection** for loose coupling and testability.

## 📁 Structure

```
api/
├── engines/              # Core shared functionality
│   ├── database/        # Database engine
│   │   ├── models/      # Sequelize models
│   │   ├── sequelize.js # Database connection
│   │   └── index.js
│   ├── security/        # Security engine (password, JWT, auth)
│   ├── validation/      # Validation engine
│   ├── http/            # HTTP response helpers
│   └── index.js         # Engines aggregation
├── modules/             # Feature modules (auto-discovered)
│   ├── auth/           # Authentication module
│   │   ├── auth.service.js
│   │   ├── auth.controller.js
│   │   ├── auth.routes.js
│   │   └── index.js    # Module factory (receives dependencies)
│   └── news/           # News module
│       ├── news.routes.js
│       └── index.js    # Module factory
└── index.js            # API bootstrap + auto-discovery
```

## 🎯 Key Principle: Dependency Injection

**All dependencies are passed explicitly to modules - no global state!**

### Why Dependency Injection?

**❌ Global State Problems:**
```javascript
// Hidden dependencies - hard to test, tightly coupled
export default function myModule({ Router }) {
  const models = req.app.get('models'); // Where did this come from?
  const jwtSecret = req.app.get('jwtSecret'); // Hidden dependency!
}
```

**✅ Dependency Injection Solution:**
```javascript
// Explicit dependencies - easy to test, loosely coupled
export default function myModule({ Router, models, jwtConfig }) {
  // Dependencies are clear and visible!
  const { User } = models;
  const token = jwt.sign(payload, jwtConfig.secret);
}
```

### Benefits

| Aspect | Global State | Dependency Injection |
|--------|--------------|---------------------|
| **Dependencies** | Hidden | Explicit |
| **Testing** | Hard (need full Express app) | Easy (pass mocks) |
| **Coupling** | Tight (depends on Express) | Loose (framework agnostic) |
| **Type Safety** | Runtime errors | Compile-time safety |
| **Reusability** | Only works in Express | Works anywhere |

## 🔧 Module Factory Pattern

**Every module exports a factory function that receives dependencies:**

```javascript
/**
 * Module factory function
 * 
 * @param {Object} deps - Dependencies injected by API bootstrap
 * @param {Function} deps.Router - Express Router constructor
 * @param {Object} deps.sequelize - Sequelize instance
 * @param {Object} deps.models - Database models (User, Role, etc.)
 * @param {Object} deps.jwtConfig - JWT configuration
 * @param {string} deps.jwtConfig.secret - JWT secret key
 * @param {string} deps.jwtConfig.expiresIn - JWT expiration time
 * @returns {Router} Express router
 */
export default function myModule({ Router, sequelize, models, jwtConfig }) {
  const router = Router();

  // Store dependencies in router.locals for route handlers
  router.locals = { sequelize, models, jwtConfig };

  // Mount routes
  router.use('/my-path', myRoutes);

  return router;
}
```

### Available Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| `Router` | Function | Express Router constructor |
| `sequelize` | Object | Sequelize instance for transactions, raw queries |
| `models` | Object | All Sequelize models (User, Role, Permission, etc.) |
| `jwtConfig` | Object | JWT configuration ({ secret, expiresIn }) |

## 📦 Creating a New Module

### Step 1: Create Module Directory

```bash
mkdir -p src/api/modules/user
```

### Step 2: Create Service (Optional)

```javascript
// modules/user/user.service.js
export async function getAllUsers(models) {
  const { User } = models;
  return await User.findAll();
}

export async function getUserById(models, id) {
  const { User } = models;
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}
```

### Step 3: Create Controller (Optional)

```javascript
// modules/user/user.controller.js
import * as userService from './user.service';
import { sendSuccess, sendNotFound, sendServerError } from '../../engines/http';

export async function getUsers(req, res) {
  try {
    const { models } = req.router.locals;
    const users = await userService.getAllUsers(models);
    return sendSuccess(res, { users });
  } catch (error) {
    return sendServerError(res);
  }
}

export async function getUser(req, res) {
  try {
    const { models } = req.router.locals;
    const user = await userService.getUserById(models, req.params.id);
    return sendSuccess(res, { user });
  } catch (error) {
    if (error.message === 'User not found') {
      return sendNotFound(res, error.message);
    }
    return sendServerError(res);
  }
}
```

### Step 4: Create Routes (Required)

```javascript
// modules/user/user.routes.js
import { Router } from 'express';
import * as userController from './user.controller';

const router = Router();

router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);

export default router;
```

### Step 5: Create Module Factory (Required)

```javascript
// modules/user/index.js
import routes from './user.routes';
import * as service from './user.service';
import * as controller from './user.controller';

/**
 * User module factory
 * 
 * @param {Object} deps - Dependencies injected by API
 * @param {Function} deps.Router - Express Router constructor
 * @param {Object} deps.sequelize - Sequelize instance
 * @param {Object} deps.models - Database models
 * @param {Object} deps.jwtConfig - JWT configuration
 * @returns {Router} Express router
 */
export default function userModule({ Router, sequelize, models, jwtConfig }) {
  const router = Router();

  // Store dependencies for route handlers
  router.locals = { sequelize, models, jwtConfig };

  // Mount routes at /users
  router.use('/users', routes);

  return router;
}

// Export for testing
export { service, controller };
```

**That's it!** The module is automatically discovered and mounted at `/api/users`.

## 🎯 Using Dependencies in Routes

### Access via router.locals

```javascript
// user.routes.js
import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.get('/', async (req, res) => {
  // Get dependencies from router.locals (set by module factory)
  const { models } = req.router.locals;
  const { User } = models;

  // Use models
  const users = await User.findAll();
  res.json(users);
});

router.post('/', async (req, res) => {
  const { models, jwtConfig, sequelize } = req.router.locals;
  const { User } = models;

  // Use transaction
  const transaction = await sequelize.transaction();

  try {
    const user = await User.create(req.body, { transaction });
    await transaction.commit();

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    res.json({ user, token });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

export default router;
```

### Destructure What You Need

```javascript
router.get('/profile', async (req, res) => {
  // Only get what you need
  const { models } = req.router.locals;
  const { User, UserProfile } = models;

  const user = await User.findByPk(req.auth.userId, {
    include: [{ model: UserProfile, as: 'profile' }],
  });

  res.json(user);
});
```

## 🧪 Testing with Dependency Injection

### Test Module Factory

**Easy to test - just pass mock dependencies:**

```javascript
import express from 'express';
import authModule from './modules/auth';

describe('Auth Module', () => {
  it('should create router with dependencies', () => {
    // Mock dependencies
    const mockModels = {
      User: { findOne: jest.fn(), create: jest.fn() },
    };
    const mockJwtConfig = {
      secret: 'test-secret',
      expiresIn: '1h',
    };
    const mockSequelize = {
      transaction: jest.fn(),
    };

    // Create module with mocks
    const router = authModule({
      Router: express.Router,
      sequelize: mockSequelize,
      models: mockModels,
      jwtConfig: mockJwtConfig,
    });

    // Test router
    expect(router).toBeDefined();
    expect(router.locals.models).toBe(mockModels);
    expect(router.locals.jwtConfig).toBe(mockJwtConfig);
  });
});
```

### Test Services

```javascript
import * as userService from './user.service';

describe('userService.getAllUsers', () => {
  it('should return all users', async () => {
    const mockModels = {
      User: {
        findAll: jest.fn().mockResolvedValue([{ id: 1, email: 'test@example.com' }]),
      },
    };

    const users = await userService.getAllUsers(mockModels);

    expect(users).toHaveLength(1);
    expect(mockModels.User.findAll).toHaveBeenCalled();
  });
});
```

### Test Routes

```javascript
import request from 'supertest';
import express from 'express';
import userModule from './modules/user';

describe('User Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Create module with mock dependencies
    const router = userModule({
      Router: express.Router,
      models: mockModels,
      jwtConfig: mockJwtConfig,
      sequelize: mockSequelize,
    });

    app.use('/api', router);
  });

  it('GET /api/users should return users', async () => {
    const res = await request(app).get('/api/users');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});
```

## 🔧 Engines (Shared Core)

### Database Engine

```javascript
import { sequelize, initializeModels } from './engines/database';

// Sequelize instance
sequelize.query('SELECT * FROM users');
sequelize.transaction();

// Initialize models
initializeModels();

// Access models
sequelize.models.User
sequelize.models.Role
```

### Security Engine

```javascript
import { hashPassword, verifyPassword } from './engines/security';

// Password hashing (PBKDF2)
const hashed = await hashPassword('password123');
const isValid = await verifyPassword('password123', hashed);
```

### Validation Engine

```javascript
import { isValidEmail, validatePassword } from './engines/validation';

// Validation
const valid = isValidEmail('user@example.com');
const errors = validatePassword('weak');
```

### HTTP Engine

```javascript
import { sendSuccess, sendError, sendNotFound } from './engines/http';

// Response helpers
sendSuccess(res, { user }, 201);
sendError(res, 'Invalid input', 400);
sendNotFound(res, 'User not found');
```

## 📚 Best Practices

### 1. Always Use Dependency Injection

```javascript
// ✅ Good - Explicit dependencies
export default function myModule({ Router, models, jwtConfig }) {
  // Dependencies are clear
}

// ❌ Bad - Hidden global dependencies
export default function myModule({ Router }) {
  const models = req.app.get('models'); // Hidden!
}
```

### 2. Store Dependencies in router.locals

```javascript
// ✅ Good - Available to all route handlers
export default function myModule({ Router, models, jwtConfig }) {
  const router = Router();
  router.locals = { models, jwtConfig };
  return router;
}
```

### 3. Keep Modules Isolated

```javascript
// ✅ Good - Use engines and injected dependencies
import { hashPassword } from '../../engines/security';

export default function myModule({ models }) {
  // Use dependencies
}

// ❌ Bad - Depend on other modules
import { auth } from '../auth';
```

### 4. Export for Testing

```javascript
// ✅ Good - Export service and controller
export default function myModule({ Router, models }) {
  // ... module setup
}

export { service, controller };
```

### 5. Pass Dependencies to Services

```javascript
// ✅ Good - Services receive dependencies
export async function getUser(models, id) {
  const { User } = models;
  return await User.findByPk(id);
}

// ❌ Bad - Services import models directly
import { User } from '../../engines/database/models';
export async function getUser(id) {
  return await User.findByPk(id);
}
```

## 🎯 Benefits

### Dependency Injection

- ✅ **Explicit dependencies** - Clear what each module needs
- ✅ **No global state** - No hidden dependencies on Express app
- ✅ **Easy to test** - Just pass mock dependencies
- ✅ **Flexible** - Modules work in any context
- ✅ **Type-safe** - TypeScript can infer types
- ✅ **Loose coupling** - Modules don't depend on framework

### Module Isolation

- ✅ **Self-contained** - All code in one place
- ✅ **Independent** - Minimal dependencies
- ✅ **Easy to add/remove** - Just add/remove directory
- ✅ **Auto-discovered** - No manual registration
- ✅ **Parallel development** - Multiple developers work independently

### Overall

- ✅ **Dependency injection** - No global state, explicit dependencies
- ✅ **True modular design** - Engines + isolated modules
- ✅ **Easy to scale** - Add new modules/engines
- ✅ **Easy to test** - Each part testable independently
- ✅ **Easy to understand** - Logical structure
- ✅ **Production ready** - Security best practices
- ✅ **Team-friendly** - Parallel development
- ✅ **Framework agnostic** - Modules work outside Express

## 🔮 Adding New Dependencies

To add a new dependency (e.g., cache service):

### 1. Create the Service

```javascript
// engines/cache/index.js
export const cache = createCacheService();
```

### 2. Add to API Bootstrap

```javascript
// api/index.js
import { cache } from './engines/cache';

moduleFactory({
  Router,
  sequelize,
  models: sequelize.models,
  jwtConfig,
  cache, // ← New dependency
});
```

### 3. Use in Modules

```javascript
export default function myModule({ Router, models, cache }) {
  router.locals = { models, cache };
  // Now available in routes via req.router.locals.cache
}
```

## 📖 Further Reading

- [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection)
- [Inversion of Control](https://en.wikipedia.org/wiki/Inversion_of_control)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
