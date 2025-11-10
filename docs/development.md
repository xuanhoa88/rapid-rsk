# Development Workflow

This guide covers the day-to-day development workflow for React Starter Kit.

## 📦 Technology Stack

### Core Dependencies

- **React**: 18.3.1 (supports React 16+)
- **Redux**: 4.2.1 with React-Redux 7.2.9
- **Express**: 4.21.1 (Node.js 16+ compatible)
- **i18next**: 23.15.2 with react-i18next 14.1.3

### Build Tools

- **Webpack**: 5.96.0
- **Babel**: 7.28.x
- **PostCSS**: 6.0.20 with Autoprefixer 10.4.20
- **Jest**: 24.9.0
- **ESLint**: 8.57.0

### Node.js Requirements

- **Node.js**: >= 16.0.0
- **npm**: >= 7.0.0

## 🚀 Starting Development

### First Time Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm start
```

The development server will:

- Start on `http://localhost:3000`
- Enable Hot Module Replacement (HMR)
- Watch for file changes
- Auto-reload on changes

### Daily Workflow

```bash
# Start development server
npm start

# In another terminal, run tests in watch mode
npm run test:watch

# Run linting (JavaScript + CSS)
npm run lint

# Auto-fix linting issues (JavaScript + CSS)
npm run fix
```

## 🔥 Hot Module Replacement (HMR)

### What is HMR?

HMR updates modules in the browser without a full page reload, preserving application state.

### What Gets Updated?

- ✅ **React Components** - Instant updates with React Refresh
- ✅ **CSS Modules** - Styles update without reload
- ✅ **Routes** - Route changes trigger re-render
- ❌ **Server Code** - Requires server restart
- ❌ **Webpack Config** - Requires rebuild

### HMR in Action

1. Edit a React component
2. Save the file
3. Browser updates instantly
4. Application state preserved

### Troubleshooting HMR

**HMR not working?**

```bash
# Check browser console for errors
# Restart development server
npm start
```

**State not preserved?**

- Some changes require full reload (adding hooks, changing exports)
- Use React DevTools to inspect state

## 📁 Creating New Features

### Adding a New Page

1. **Create route directory:**

```bash
mkdir src/routes/my-page
```

2. **Create route files:**

```javascript
// src/routes/my-page/index.js
export default {
  path: '/my-page',

  async action({ fetch }) {
    const data = await fetch('/api/my-data');

    return {
      title: 'My Page',
      description: 'My page description',
      component: <MyPage data={data} />,
    };
  },
};
```

```javascript
// src/routes/my-page/MyPage.js
import { useTranslation } from 'react-i18next';
import useStyles from 'isomorphic-style-loader/useStyles';
import s from './MyPage.css';

function MyPage({ data }) {
  useStyles(s);
  const { t } = useTranslation();

  return (
    <div className={s.root}>
      <h1>{t('myPage.title')}</h1>
      <p>{data.content}</p>
    </div>
  );
}

export default MyPage;
```

```css
/* src/routes/my-page/MyPage.css */
.root {
  padding: 20px;
}
```

3. **Register route:**

```javascript
// src/routes/index.js
import myPage from './my-page';

export default {
  path: '',
  children: [
    home,
    about,
    myPage, // Add your route
    // ...
  ],
};
```

### Adding a New Component

1. **Create component directory:**

```bash
mkdir src/components/MyComponent
```

2. **Create component files:**

```javascript
// src/components/MyComponent/index.js
import PropTypes from 'prop-types';
import useStyles from 'isomorphic-style-loader/useStyles';
import s from './MyComponent.css';

function MyComponent({ title, children }) {
  useStyles(s);

  return (
    <div className={s.root}>
      <h2 className={s.title}>{title}</h2>
      <div className={s.content}>{children}</div>
    </div>
  );
}

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default MyComponent;
```

```css
/* src/components/MyComponent/MyComponent.css */
.root {
  border: 1px solid #ddd;
  padding: 16px;
}

.title {
  margin: 0 0 12px;
  font-size: 18px;
}

.content {
  color: #666;
}
```

3. **Add tests:**

```javascript
// src/components/MyComponent/MyComponent.test.js
import { render, screen } from '@testing-library/react';
import MyComponent from './index';

describe('MyComponent', () => {
  it('renders title', () => {
    render(<MyComponent title='Test Title' />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});
```

### Adding an API Endpoint

1. **Create API route:**

```javascript
// src/api/routes/myEndpoint.js
import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const data = await fetchData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

2. **Register route:**

```javascript
// src/api/routes/index.js
import myEndpoint from './myEndpoint';

router.use('/my-endpoint', myEndpoint);
```

3. **Use in component:**

```javascript
async action({ fetch }) {
  const data = await fetch('/api/my-endpoint');
  return { component: <MyPage data={data} /> };
}
```

## 🎨 Styling

### CSS Modules

All CSS files are automatically scoped:

```css
/* MyComponent.css */
.button {
  background: blue;
  color: white;
}
```

```javascript
import s from './MyComponent.css';

<button className={s.button}>Click</button>;
```

### Global Styles

For global styles, use `:global`:

```css
:global(.global-class) {
  font-family: Arial, sans-serif;
}
```

### PostCSS Features

```css
/* Nesting */
.root {
  color: black;

  & .nested {
    color: gray;
  }
}

/* Autoprefixer (automatic) */
.box {
  display: flex; /* Prefixes added automatically */
}

/* Custom properties */
:root {
  --primary-color: #007bff;
}

.button {
  background: var(--primary-color);
}
```

## 🌍 Internationalization

### Adding Translations

1. **Add to translation files:**

```json
// src/i18n/translations/en-US.json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my feature"
  }
}
```

2. **Use in components:**

```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('myFeature.title')}</h1>
      <p>{t('myFeature.description')}</p>
    </div>
  );
}
```

### Extracting Messages

```bash
# Extract and update i18n translation files
npm run i18n
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Open coverage report in browser
npm run coverage

# CI mode (for continuous integration)
npm run test:ci

# Run specific test file
npm test -- MyComponent.test.js
```

### Writing Tests

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './index';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title='Test' />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles click', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## 🔍 Debugging

### Browser DevTools

1. **React DevTools** - Inspect component tree and props
2. **Redux DevTools** - Inspect Redux state and actions
3. **Network Tab** - Monitor API requests
4. **Console** - View logs and errors

### VS Code Debugging

1. **Set breakpoints** in VS Code
2. **Press F5** to start debugging
3. **Use debug console** for evaluation

Configuration in `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/babel-node",
      "program": "${workspaceFolder}/tools/run.js",
      "args": ["start"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Build",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/babel-node",
      "program": "${workspaceFolder}/tools/run.js",
      "args": ["build"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

**Available Debug Configurations:**

- **Debug Server** - Debug the development server
- **Debug Build** - Debug the production build process
- **Debug Tests** - Debug Jest tests in VS Code

### Server-Side Debugging

```bash
# Start with Node inspector
babel-node --inspect tools/run start

# Open chrome://inspect in Chrome
# Click "inspect" on your Node process
```

## 📝 Code Quality

### Linting

```bash
# Lint JavaScript
npm run lint:js

# Lint CSS
npm run lint:css

# Lint everything (JavaScript + CSS)
npm run lint

# Auto-fix JavaScript issues
npm run fix:js

# Auto-fix CSS issues
npm run fix:css

# Auto-fix all issues (JavaScript + CSS)
npm run fix
```

### Formatting

```bash
# Format all files with Prettier
npm run format

# Check formatting without making changes
npm run format:check
```

### Pre-commit Hooks

Husky runs linting on staged files before commit:

```bash
# Configured via lint-staged
git add .
git commit -m "My changes"
# Linting runs automatically via precommit hook
```

## 🔄 Git Workflow

### Branch Strategy

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add my feature"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub
```

### Commit Messages

Follow conventional commits:

```bash
# Features
git commit -m "feat: add user profile page"

# Bug fixes
git commit -m "fix: resolve login redirect issue"

# Documentation
git commit -m "docs: update API documentation"

# Refactoring
git commit -m "refactor: simplify authentication logic"

# Tests
git commit -m "test: add tests for user service"
```

## 🚀 Building for Production

### Local Production Build

```bash
# Build for production
npm run build

# Test production build locally
node build/server.js
```

### Analyzing Bundle Size

```bash
# Build with bundle analyzer
WEBPACK_ANALYZE=true npm run build

# Opens bundle analyzer in browser
```

## 🔧 Common Tasks

### Adding a Dependency

```bash
# Production dependency
npm install package-name

# Development dependency
npm install --save-dev package-name
```

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update all dependencies
npm update

# Update specific package
npm update package-name
```

### Cleaning Build Artifacts

```bash
# Clean build directory
npm run clean

# Clean and rebuild
npm run clean && npm run build
```

## 💡 Tips & Tricks

### Fast Refresh

- Keep components small for faster refresh
- Avoid side effects in render
- Use hooks properly

### Performance

- Use React.memo for expensive components
- Implement code splitting with dynamic imports
- Optimize images and assets

### Productivity

- Use VS Code snippets for common patterns
- Install recommended extensions
- Use keyboard shortcuts

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
RSK_PORT=3001 npm start
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clean and rebuild
npm run clean
npm run build
```

## 📚 Next Steps

- **[Testing Guide](testing-your-application.md)** - Learn testing strategies
- **[Data Fetching](data-fetching.md)** - Learn data loading patterns
- **[Deployment](deployment.md)** - Deploy to production
- **[Recipes](recipes/)** - Common development patterns
