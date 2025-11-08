## Data Fetching

At a bare minimum you may want to use [HTML5 Fetch API][fetch] as an HTTP client
utility for making Ajax requests. This API is supported natively in all major
browsers except for IE (note that Edge does support Fetch).

**React Starter Kit** is pre-configured with [`whatwg-fetch`][wfetch] polyfill
for the browser environment and [`node-fetch`][nfetch] module for the
server-side environment (see [`src/createFetch.js`](../src/createFetch.js)),
allowing you to use the `fetch(url, options)` method universally in both
client-side and server-side code.

## Features

The `createFetch` utility is a **simple, robust wrapper** with minimal configuration:

- ✅ **Auto-Detection**: Automatically detects absolute URLs vs relative paths
- ✅ **API Proxy Integration**: Works seamlessly with Express API proxy (`/api` routes)
- ✅ **Server/Client Compatibility**: Works on both Node.js and browser environments
- ✅ **Timeout Support**: Per-request timeout with AbortController (proper cancellation)
- ✅ **Interceptors**: Request, response, and error interceptors for extensibility
- ✅ **Enhanced Error Handling**: Rich error context with custom FetchError class
- ✅ **Minimal Configuration**: No baseUrl or apiPrefix needed
- ✅ **Simple & Robust**: ~180 lines, easy to understand and debug

## How It Works

### API Proxy Architecture

The server has an API proxy configured at `/api` that forwards requests to your backend:

```js
// In src/server.js
app.use('/api', expressProxy(config.api.serverUrl));
```

This means:
- **Client**: `/api/users` → proxied to backend API server
- **Server**: `/api/users` → proxied to backend API server
- **No baseUrl needed**: The proxy handles routing automatically

### Auto-Detection Logic

`createFetch` automatically detects the type of URL:

```js
// Relative paths (internal API) - applies defaults
await fetch('/api/users');           // → Uses defaults (same-origin, credentials)
await fetch('/api/posts/123');       // → Uses defaults

// Absolute URLs (external API) - no defaults
await fetch('https://external-api.com/data');  // → No defaults applied
await fetch('http://api.example.com/v1');      // → No defaults applied
```

### Environment Differences

The wrapper automatically handles environment-specific behavior:

**Browser:**
- Relative paths use `same-origin` mode and credentials
- Cookies handled automatically by the browser
- Uses `performance.now()` for timing

**Server:**
- Relative paths use `same-origin` mode
- Cookies explicitly passed via `Cookie` header
- Uses `process.hrtime()` for high-precision timing

**Timeout:**
- Uses `AbortController` for proper request cancellation
- If unavailable, timeout is skipped (no fake Promise.race fallback)

## Configuration

### Basic Setup

```js
import { createFetch } from './createFetch';

const fetch = createFetch(window.fetch, {
  cookie: 'session=abc123',  // Server-side only (optional)
  onRequest: (url, options) => {
    // Add auth token
    options.headers.Authorization = 'Bearer token';
    return options;
  },
  onResponse: (data, response) => {
    // Transform response
    return data;
  },
  onError: (error) => {
    // Handle errors globally
    console.error('API Error:', error);
    throw error;
  },
});
```

### Configuration Options

- **`cookie`** (string, optional): Cookie string for server-side requests
- **`onRequest`** (function, optional): Request interceptor
- **`onResponse`** (function, optional): Response interceptor  
- **`onError`** (function, optional): Error interceptor

### Per-Request Options

```js
// With timeout
await fetch('/api/users', { 
  timeout: 5000  // 5 second timeout
});

// With custom headers
await fetch('/api/posts', {
  method: 'POST',
  headers: { 'X-Custom': 'value' },
  body: JSON.stringify({ title: 'Hello' })
});
```

## Usage

Because of the subtle differences in how `fetch` works across environments,
it's passed as a `context` variable to your React application, making it
available at both the routing level and inside React components:

### Route Example

```js
{
  path: '/posts/:id',
  async action({ params, fetch }) {
    // Internal API - goes through /api proxy
    const data = await fetch(`/api/posts/${params.id}`, { 
      timeout: 5000 
    });
    return { 
      title: data.title, 
      component: <Post {...data} /> 
    };
  }
}
```

## Examples

### Internal API Requests

```js
// GET request
const users = await fetch('/api/users');

// POST request
const newPost = await fetch('/api/posts', {
  method: 'POST',
  body: JSON.stringify({ title: 'Hello', content: 'World' })
});

// DELETE request
await fetch(`/api/posts/${id}`, { method: 'DELETE' });

// With timeout
const data = await fetch('/api/slow-endpoint', { 
  timeout: 10000  // 10 seconds
});
```

### External API Requests

```js
// External API - no defaults applied
const data = await fetch('https://api.github.com/users/octocat');

// External API with custom options
const weather = await fetch('https://api.weather.com/forecast', {
  headers: { 'API-Key': 'your-key' }
});
```

## Error Handling

`createFetch` throws a custom `FetchError` with rich context:

```js
try {
  const data = await fetch('/api/users');
} catch (error) {
  console.error('Status:', error.status);      // HTTP status code
  console.error('Message:', error.message);    // Error message
  console.error('URL:', error.url);            // Request URL
  console.error('Data:', error.data);          // Response data (if any)
}
```

## Benefits

### Simplified Configuration
- ✅ Minimal configuration - just interceptors if needed

### Smart Behavior
- ✅ Automatically applies defaults to relative paths
- ✅ No defaults for absolute URLs (external APIs)
- ✅ Works seamlessly with Express API proxy

### Production Ready
- ✅ Proper timeout with AbortController
- ✅ Enhanced error handling
- ✅ Server/client compatibility
- ✅ Simple, maintainable code (~180 lines)

## Related Articles

* [That's so fetch!](https://jakearchibald.com/2015/thats-so-fetch/) by [Jake Archibald](https://twitter.com/jaffathecake)
* [Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) - MDN Web Docs
* [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) - MDN Web Docs

[fetch]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
[wfetch]: https://github.com/github/fetch
[nfetch]: https://github.com/bitinn/node-fetch
