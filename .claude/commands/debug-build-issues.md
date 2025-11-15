Debug common build and runtime issues in the React Starter Kit:

## Build Issues

### 1. Webpack Build Fails

**Symptoms:**

```
ERROR in ./src/components/App.js
Module not found: Error: Can't resolve 'some-module'
```

**Solutions:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear webpack cache
rm -rf node_modules/.cache

# Clear build directory
npm run clean

# Rebuild
npm run build
```

### 2. Babel Transpilation Errors

**Symptoms:**

```
SyntaxError: Unexpected token
```

**Check:**

- `.babelrc.js` configuration is correct
- All required Babel plugins are installed
- Node.js version is >= 16.0.0

**Fix:**

```bash
# Reinstall Babel dependencies
npm install --save-dev @babel/core @babel/preset-env @babel/preset-react

# Check Babel config
cat .babelrc.js
```

### 3. CSS Module Import Errors

**Symptoms:**

```
Module parse failed: Unexpected token
You may need an appropriate loader
```

**Solution:**
Check `tools/webpack/client.js` has CSS loaders configured:

```javascript
{
  test: /\.css$/,
  use: [
    'isomorphic-style-loader',
    {
      loader: 'css-loader',
      options: {
        modules: {
          localIdentName: isDebug ? '[name]-[local]-[hash:base64:5]' : '[hash:base64:5]',
        },
      },
    },
    'postcss-loader',
  ],
}
```

### 4. Memory Issues During Build

**Symptoms:**

```
FATAL ERROR: Ineffective mark-compacts near heap limit
JavaScript heap out of memory
```

**Solution:**

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Or add to package.json scripts
"build": "NODE_OPTIONS='--max-old-space-size=4096' node tools/run build"
```

## Runtime Issues

### 1. Hot Module Replacement Not Working

**Check:**

1. Development server is running: `npm start`
2. Browser console shows HMR connection:
   ```
   [HMR] connected
   ```

**Debug:**

```bash
# Check if webpack-hot-middleware is loaded
# Look for this in browser console
[HMR] connected

# If not connected, check server logs
npm start
# Look for: "webpack-hot-middleware connected"
```

**Fix in `tools/tasks/start.js`:**

```javascript
// Ensure HMR client is added to entry points
if (isClient) {
  Object.keys(config.entry).forEach(name => {
    config.entry[name] = [
      'webpack-hot-middleware/client?reload=true&overlay=true',
      ...config.entry[name],
    ];
  });
}
```

### 2. Server-Side Rendering Errors

**Symptoms:**

```
Error: Minified React error #418
or
Error: Text content does not match server-rendered HTML
```

**Common Causes:**

1. Using browser-only APIs in SSR
2. Different data on server vs client
3. Non-deterministic rendering

**Fix:**

```javascript
// Check if running in browser
if (typeof window !== 'undefined') {
  // Browser-only code
  window.addEventListener('scroll', handleScroll);
}

// Or use useEffect (only runs on client)
useEffect(() => {
  // Browser-only code
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

### 3. CSS Not Loading

**Symptoms:**

- Styles not applied
- `insertCss is not a function` error

**Check:**

1. CSS Module import is correct
2. `insertCss` is called in component

**Fix:**

```javascript
import React, { useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import s from './MyComponent.css';

function MyComponent() {
  const { insertCss } = useAppContext();

  useEffect(() => {
    const removeCss = insertCss(s);
    return () => removeCss();
  }, [insertCss]);

  return <div className={s.container}>Content</div>;
}
```

### 4. Redux State Not Updating

**Symptoms:**

- Component doesn't re-render on state change
- `useSelector` returns stale data

**Check:**

1. Redux Provider is wrapping app
2. Reducer is returning new state object
3. Action is dispatched correctly

**Debug:**

```javascript
// Add Redux DevTools
import { createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';

const store = createStore(rootReducer, initialState, composeWithDevTools());

// Check if action is dispatched
const dispatch = useDispatch();
console.log('Dispatching action:', action);
dispatch(action);

// Check if selector is correct
const data = useSelector(state => {
  console.log('Current state:', state);
  return state.data;
});
```

### 5. Authentication Issues

**Symptoms:**

- JWT token not persisted
- User logged out on refresh
- 401 Unauthorized errors

**Check:**

1. Cookie is set with correct options
2. JWT secret matches between sign and verify
3. Token is not expired

**Debug:**

```javascript
// Check cookie in browser
document.cookie;

// Check JWT payload
import jwt from 'jsonwebtoken';
const token = getCookie('id_token');
const decoded = jwt.decode(token);
console.log('Token payload:', decoded);
console.log('Token expires:', new Date(decoded.exp * 1000));

// Server-side debugging
app.use((req, res, next) => {
  console.log('Cookies:', req.cookies);
  console.log('JWT User:', req.user);
  next();
});
```

## Performance Issues

### 1. Slow Build Times

**Solutions:**

```bash
# Enable webpack caching
# In webpack config:
cache: {
  type: 'filesystem',
  cacheDirectory: path.resolve(__dirname, '../.webpack-cache'),
}

# Use parallel builds
npm install --save-dev thread-loader

# Reduce bundle size
npm run build -- --analyze
# Check bundle-analyzer output
```

### 2. Large Bundle Size

**Check bundle composition:**

```bash
# Build with analysis
BUILD_ANALYZE=true npm run build

# Open bundle analyzer
open build/bundle-stats.html
```

**Solutions:**

1. Enable code splitting
2. Use dynamic imports
3. Remove unused dependencies
4. Use production builds of libraries

### 3. Slow Page Loads

**Check:**

1. Enable gzip compression
2. Use code splitting
3. Optimize images
4. Enable caching headers

**Add compression middleware:**

```javascript
import compression from 'compression';

app.use(compression());
```

## Debugging Tools

### 1. Enable Verbose Logging

```bash
# Development
LOG_LEVEL=debug npm start

# Build
LOG_LEVEL=verbose npm run build
```

### 2. Check Build Statistics

```bash
# Generate build report
npm run build

# Check report
cat build/build-report.json | jq .

# Check statistics
cat build/build-stats.json | jq .
```

### 3. Profile Build Performance

```bash
# Enable profiling
BUILD_PROFILE=true npm run build

# Check webpack stats
cat build/webpack-stats.json | jq .
```

### 4. Debug Webpack Configuration

```javascript
// In tools/webpack/client.js or server.js
console.log('Webpack config:', JSON.stringify(config, null, 2));
```

### 5. Debug Server Issues

```bash
# Start with Node.js debugger
node --inspect tools/run start

# Open Chrome DevTools
# Navigate to: chrome://inspect
# Click "inspect" on your Node.js process
```

### 6. Check File System Operations

```bash
# Enable FS debugging
LOG_LEVEL=debug npm run build

# Check file operations
cat build/build-report.json | jq '.artifacts'
```

## Common Error Messages

### "Cannot find module"

```bash
# Solution: Install missing dependency
npm install missing-module

# Or reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Module build failed"

```bash
# Solution: Check loader configuration
# Ensure appropriate loaders are installed and configured
npm install --save-dev babel-loader css-loader style-loader
```

### "Port 3000 is already in use"

```bash
# Solution: Kill process using port
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start
```

### "ENOSPC: System limit for number of file watchers reached"

```bash
# Solution: Increase file watcher limit (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Getting Help

1. **Check logs:** Look for error messages in console and server logs
2. **Enable debug mode:** Set `LOG_LEVEL=debug` for detailed output
3. **Check documentation:** Review docs/ directory for guides
4. **Search issues:** Check GitHub issues for similar problems
5. **Clean build:** Try `npm run clean && npm install && npm run build`
6. **Check versions:** Ensure Node.js >= 16.0.0 and npm >= 7.0.0

## Useful Commands

```bash
# Full clean and rebuild
npm run clean && rm -rf node_modules package-lock.json && npm install && npm run build

# Check Node.js and npm versions
node --version
npm --version

# Check installed packages
npm list --depth=0

# Verify package integrity
npm audit

# Fix package vulnerabilities
npm audit fix

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```
