# Route Layout Standards

This document defines the consistent patterns and standards for all route files in the application.

## Standard Route Structure

All route files should follow this consistent structure:

```javascript
/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Layout from '../../components/Layout';
import ComponentName from './ComponentName';

/**
 * [Route Name] route
 * [Optional: Additional description]
 */
async function action(context) {
  const title = '[Page Title]';

  return {
    chunks: ['chunk-name'],
    title,
    component: (
      <Layout>
        <ComponentName title={title} />
      </Layout>
    ),
  };
}

export default action;
```

## Required Elements

### 1. **File Header Comment**
Every route file must include the standard license header:
```javascript
/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */
```

### 2. **JSDoc Comment**
Every action function must have a JSDoc comment describing the route:
```javascript
/**
 * [Route Name] route
 * [Optional: Additional description or special notes]
 */
```

### 3. **Layout Wrapper**
All routes must wrap their component in the `<Layout>` component:
```javascript
component: (
  <Layout>
    <ComponentName />
  </Layout>
)
```

**Exception:** None. Even error pages should use the Layout wrapper for consistency.

### 4. **Return Object Properties**
The return object must include these properties in this order:

```javascript
return {
  chunks: ['chunk-name'],  // Array of chunk names for code splitting
  title,                   // Page title for <title> tag
  component: (             // React component to render
    <Layout>
      <ComponentName />
    </Layout>
  ),
  status,                  // Optional: HTTP status code (e.g., 404, 403)
  redirect,                // Optional: Redirect path
};
```

**Important:** Use `chunks` (array), not `chunk` (string).

## Route Patterns

### Basic Route (No Data Fetching)
```javascript
/**
 * Contact route
 */
function action() {
  const title = 'Contact Us';

  return {
    chunks: ['contact'],
    title,
    component: (
      <Layout>
        <Contact title={title} />
      </Layout>
    ),
  };
}
```

### Route with Data Fetching
```javascript
/**
 * Home route
 */
async function action({ fetch }) {
  const title = 'Home';

  // Fetch news data from API
  const data = await fetch('/api/news');

  return {
    chunks: ['home'],
    title,
    component: (
      <Layout>
        <Home data={{ loading: false, ...data }} />
      </Layout>
    ),
  };
}
```

### Route with Authentication Check
```javascript
/**
 * Login route
 * Redirects authenticated users to home page
 */
function action(context) {
  const title = 'Log In';

  // Get state from Redux store
  const state = context.store.getState();

  // Redirect authenticated users to home
  if (isAuthenticated(state)) {
    return { redirect: '/' };
  }

  return {
    chunks: ['login'],
    title,
    component: (
      <Layout>
        <Login title={title} />
      </Layout>
    ),
  };
}
```

### Route with Authorization Check
```javascript
/**
 * Admin dashboard route
 * Requires authentication and admin role
 */
async function action(context) {
  const title = 'Admin Dashboard';

  // Get state from Redux store
  const state = context.store.getState();

  // Check if user is authenticated
  if (!isAuthenticated(state)) {
    return { redirect: '/login' };
  }

  // Check if user has admin role
  if (!isAdmin(state)) {
    return { redirect: '/', status: 403 };
  }

  return {
    chunks: ['admin'],
    title,
    component: (
      <Layout>
        <Admin title={title} />
      </Layout>
    ),
  };
}
```

### Route with Locale Support
```javascript
/**
 * About route
 * Supports locale-specific content
 */
async function action({ locale }) {
  let data;

  // Load locale-specific markdown file
  switch (locale) {
    case 'vi-VN':
      try {
        data = await import('./about.vi-VN.md');
      } catch (e) {
        data = await import('./about.md');
      }
      break;
    default:
      data = await import('./about.md');
      break;
  }

  return {
    chunks: ['about'],
    title: data.attributes.title,
    component: (
      <Layout>
        <Page title={data.attributes.title} html={data.html} />
      </Layout>
    ),
  };
}
```

### Error Routes (404, 403, etc.)
```javascript
/**
 * Not Found route (404)
 */
function action() {
  const title = 'Page Not Found';

  return {
    chunks: ['not-found'],
    title,
    component: (
      <Layout>
        <NotFound title={title} />
      </Layout>
    ),
    status: 404,
  };
}
```

## Best Practices

### 1. **Function Type**
- Use `async function` only when you need to await something
- Use regular `function` for synchronous routes

### 2. **Context Destructuring**
Only destructure the properties you actually use:
```javascript
// Good - only destructure what you need
async function action({ fetch }) { ... }
async function action({ locale }) { ... }
function action(context) { ... }  // When you need multiple properties

// Bad - destructuring unused properties
async function action({ fetch, store, i18n }) { ... }  // If you only use fetch
```

### 3. **Title Declaration**
Always declare the title as a const at the beginning of the function:
```javascript
// Good
function action() {
  const title = 'Page Title';
  return { title, ... };
}

// Bad
function action() {
  return { title: 'Page Title', ... };
}
```

### 4. **Comments**
Add inline comments for complex logic:
```javascript
// Good
// Fetch news data from API
const data = await fetch('/api/news');

// Check if user is authenticated
if (!isAuthenticated(state)) {
  return { redirect: '/login' };
}
```

### 5. **Chunk Names**
Use kebab-case for chunk names that match the route path:
- `/login` → `chunks: ['login']`
- `/reset-password` → `chunks: ['reset-password']`
- `/not-found` → `chunks: ['not-found']`

## Current Routes Compliance

All routes now follow these standards:

- ✅ `/` (home) - Basic route with data fetching
- ✅ `/about` - Route with locale support
- ✅ `/contact` - Basic route
- ✅ `/privacy` - Route with markdown content
- ✅ `/login` - Route with authentication check
- ✅ `/register` - Route with authentication check
- ✅ `/reset-password` - Route with authentication check
- ✅ `/admin` - Route with authorization check
- ✅ `/error` - Error demo route
- ✅ `/not-found` - 404 error route

## Migration Checklist

When creating a new route, ensure:

- [ ] File header comment is present
- [ ] JSDoc comment describes the route
- [ ] Layout wrapper is used
- [ ] Return object has `chunks` (array), not `chunk` (string)
- [ ] Return object has `title` property
- [ ] Title is declared as a const
- [ ] Function is `async` only if needed
- [ ] Context parameters are properly destructured
- [ ] Authentication/authorization checks are in place (if needed)
- [ ] Inline comments explain complex logic
- [ ] Chunk name matches route path (kebab-case)

## Layout Component

The `<Layout>` component provides the standard page structure:

```jsx
<div>
  <Header />
  {children}
  <Feedback />
  <Footer />
</div>
```

All page content should be wrapped in this component to ensure:
- Consistent header/footer across all pages
- Proper feedback mechanism
- Unified styling and structure
- Better maintainability

## Exception Handling

If a route needs to deviate from these standards, document the reason in:
1. A JSDoc comment in the route file
2. This standards document (add to "Exceptions" section below)

### Exceptions

Currently, there are no exceptions to these standards. All routes follow the consistent pattern.
