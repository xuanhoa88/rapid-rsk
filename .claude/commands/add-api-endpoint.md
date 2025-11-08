Add a new API endpoint to the Express server following these steps:

## 1. Create API Route Handler

Add your endpoint in `src/server.js`:

```javascript
// GET endpoint
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST endpoint
app.post('/api/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.create({ name, email });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET with parameters
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT endpoint
app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await user.update(req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE endpoint
app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await user.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 2. Protected Endpoints (JWT Authentication)

Use the `jwt` middleware for protected routes:

```javascript
import jwt from 'express-jwt';

// JWT middleware configuration
const jwtMiddleware = jwt({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  algorithms: ['HS256'],
  credentialsRequired: true,
  getToken: (req) => {
    if (req.cookies && req.cookies.id_token) {
      return req.cookies.id_token;
    }
    return null;
  },
});

// Protected endpoint
app.get('/api/profile', jwtMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Optional authentication (doesn't fail if no token)
app.get('/api/posts', jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
  credentialsRequired: false,
  getToken: (req) => req.cookies?.id_token,
}), async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: req.user ? { userId: req.user.id } : {},
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 3. Use in React Components

### With useEffect Hook

```javascript
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';

function UserList() {
  const { fetch } = useAppContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await fetch('/api/users');
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadUsers();
  }, [fetch]);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### With Route Action

```javascript
// src/routes/users/index.js
export default {
  path: '/users',
  
  async action({ fetch }) {
    const users = await fetch('/api/users');
    
    return {
      title: 'Users',
      component: <UserList users={users} />,
    };
  },
};
```

### POST Request

```javascript
async function createUser(name, email) {
  const { fetch } = useAppContext();
  
  try {
    const user = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email }),
    });
    
    return user;
  } catch (error) {
    console.error('Failed to create user:', error);
    throw error;
  }
}
```

## 4. Error Handling Middleware

Add comprehensive error handling in `src/server.js`:

```javascript
// Error handling middleware (add at the end, before the catch-all route)
app.use((err, req, res, next) => {
  // JWT authentication errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Invalid or missing authentication token',
    });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors,
    });
  }
  
  // Database errors
  if (err.name === 'SequelizeError') {
    return res.status(500).json({
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
  
  // Generic error
  console.error('API Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});
```

## 5. Request Validation

Add validation middleware:

```javascript
function validateUser(req, res, next) {
  const { name, email } = req.body;
  
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  
  next();
}

app.post('/api/users', validateUser, async (req, res) => {
  // Handler code...
});
```

## 6. Rate Limiting (Optional)

Install and configure rate limiting:

```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Apply to all API routes
app.use('/api/', apiLimiter);
```

## 7. CORS Configuration (If Needed)

```javascript
import cors from 'cors';

app.use('/api', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
}));
```

## 8. Testing API Endpoints

### Manual Testing with curl

```bash
# GET request
curl http://localhost:3000/api/users

# POST request
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'

# With authentication
curl http://localhost:3000/api/profile \
  -H "Cookie: id_token=YOUR_JWT_TOKEN"
```

### Automated Testing with Jest

```javascript
// src/server.test.js
import request from 'supertest';
import app from './server';

describe('API Endpoints', () => {
  it('GET /api/users returns users list', async () => {
    const response = await request(app)
      .get('/api/users')
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
  });
  
  it('POST /api/users creates a new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'Test User', email: 'test@example.com' })
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test User');
  });
});
```

## Best Practices

1. **Always use try-catch** for async operations
2. **Return appropriate HTTP status codes** (200, 201, 400, 401, 404, 500)
3. **Validate input data** before processing
4. **Use JWT middleware** for protected routes
5. **Add error handling middleware** for consistent error responses
6. **Log errors** for debugging (use centralized logger)
7. **Rate limit** API endpoints to prevent abuse
8. **Document** your API endpoints
9. **Test** your endpoints thoroughly
10. **Use environment variables** for sensitive configuration
