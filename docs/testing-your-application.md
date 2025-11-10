## Testing Your Application

### Testing Stack

React Starter Kit uses a modern testing stack for comprehensive test coverage:

* **[Jest](https://jestjs.io/)** (v24.9.0) - Delightful JavaScript testing framework
* **[React Test Renderer](https://reactjs.org/docs/test-renderer.html)** - React component testing
* **[babel-jest](https://jestjs.io/docs/getting-started#using-babel)** - Babel integration for Jest
* **[redux-mock-store](https://github.com/reduxjs/redux-mock-store)** - Mock Redux store for testing

### Key Features

✅ **Fast and Parallel** - Tests run in parallel for speed  
✅ **Snapshot Testing** - Capture component output and detect changes  
✅ **Code Coverage** - Built-in coverage reports  
✅ **Watch Mode** - Re-run tests on file changes  
✅ **Mocking** - Easy mocking of modules and functions  
✅ **React 16+ Compatible** - Full support for React 16, 17, and 18+  

### Test Commands

#### Run All Tests
```bash
npm test
```
Runs all test files matching `*.test.js` or `*.spec.js` patterns.

#### Watch Mode
```bash
npm run test:watch
```
Runs tests in watch mode - automatically re-runs tests when files change.

#### Coverage Report
```bash
npm run test:coverage
```
Generates a code coverage report in the `coverage/` directory.

#### CI Mode
```bash
npm run test:ci
```
Runs tests in CI mode with coverage and limited workers.

#### View Coverage Report
```bash
npm run coverage
```
Generates coverage report and opens it in your browser.

### Running Specific Tests

#### Run a Single Test File
```bash
npm test -- src/components/Layout/Layout.test.js
```

#### Run Tests Matching a Pattern
```bash
npm test -- --testNamePattern="Layout"
```

#### Update Snapshots
```bash
npm test -- -u
```

#### Clear Jest Cache
```bash
npm test -- --clearCache
```

### File Naming Conventions

* ✅ Test files MUST end with `.test.js` or `.spec.js`
* ✅ Test files SHOULD be named after the component they test
  - Example: `Login.test.js` for `Login.js` component
* ✅ Test files SHOULD be placed next to the component
  - Example: `src/components/Header/Header.test.js`
* ✅ Snapshots are stored in `__snapshots__/` directory
  - Example: `src/components/Header/__snapshots__/Header.test.js.snap`

### Writing Tests

#### Basic Component Test

Here's a basic example from the codebase:

```js
import React from 'react';
import renderer from 'react-test-renderer';
import { I18nextProvider } from 'react-i18next';
import configureStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
import i18n from 'src/i18n';
import App from '../App';
import Layout from './Layout';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

const initialState = {
  runtime: {
    // Runtime variables
    availableLocales: {
      'en-US': 'English (US)',
      'vi-VN': 'Tiếng Việt',
    },
  },
  intl: {
    locale: 'en-US',
  },
};

describe('Layout', () => {
  test('renders children correctly', () => {
    const store = mockStore(initialState);
    
    const wrapper = renderer
      .create(
        <App
          insertCss={() => {}}
          context={{
            fetch: () => {},
            pathname: '',
            store,
          }}
        >
          <Layout>
            <div className="child" />
          </Layout>
        </App>,
      )
      .toJSON();

    expect(wrapper).toMatchSnapshot();
  });
});
```

#### Testing with react-i18next

This project uses `react-i18next` for internationalization. When testing components that use translations:

**Option 1: Using I18nextProvider (Recommended)**

```js
import React from 'react';
import renderer from 'react-test-renderer';
import { I18nextProvider } from 'react-i18next';
import i18n from 'src/i18n';
import Header from './Header';

describe('Header', () => {
  test('renders correctly', () => {
    const wrapper = renderer
      .create(
        <I18nextProvider i18n={i18n}>
          <Header />
        </I18nextProvider>,
      )
      .toJSON();

    expect(wrapper).toMatchSnapshot();
  });
});
```

**Option 2: Mocking useTranslation Hook**

```js
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key, // Returns the key as translation
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en-US',
    },
  }),
  I18nextProvider: ({ children }) => children,
}));
```

**Option 3: Testing Translation Keys**

```js
import { useTranslation } from 'react-i18next';

test('uses correct translation keys', () => {
  const { t } = useTranslation();
  
  expect(t('header.brand')).toBe('Your Company Brand');
  expect(t('navigation.about')).toBe('About');
});
```

#### Testing Redux-Connected Components

```js
import configureStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

test('component with Redux', () => {
  const initialState = {
    runtime: { availableLocales: { 'en-US': 'English (US)', 'vi-VN': 'Tiếng Việt' } },
    intl: { locale: 'en-US' },
  };
  
  const store = mockStore(initialState);
  
  // Test your component with the mock store
});
```

#### Snapshot Testing

Snapshot tests capture the rendered output of a component:

```js
test('matches snapshot', () => {
  const tree = renderer.create(<MyComponent />).toJSON();
  expect(tree).toMatchSnapshot();
});
```

**Update snapshots when intentional changes are made:**
```bash
npm test -- -u
```

#### Testing Async Actions

```js
import { setLocale } from '../../actions/intl';

test('setLocale action', async () => {
  const dispatch = jest.fn();
  const locale = 'vi-VN';
  
  await setLocale(locale)(dispatch);
  
  expect(dispatch).toHaveBeenCalledWith({
    type: 'SET_LOCALE',
    payload: { locale },
  });
});
```

### Best Practices

#### 1. Keep Tests Simple and Focused
```js
// ✅ Good - Tests one thing
test('renders brand text', () => {
  const { getByText } = render(<Header />);
  expect(getByText('Your Company Brand')).toBeInTheDocument();
});

// ❌ Bad - Tests too many things
test('header works', () => {
  // Tests rendering, clicking, navigation, etc.
});
```

#### 2. Use Descriptive Test Names
```js
// ✅ Good
test('displays error message when login fails', () => {});

// ❌ Bad
test('test1', () => {});
```

#### 3. Arrange-Act-Assert Pattern
```js
test('increments counter', () => {
  // Arrange
  const { getByText } = render(<Counter />);
  
  // Act
  fireEvent.click(getByText('Increment'));
  
  // Assert
  expect(getByText('Count: 1')).toBeInTheDocument();
});
```

#### 4. Clean Up After Tests
```js
afterEach(() => {
  jest.clearAllMocks();
});
```

### Common Testing Patterns

#### Testing Hooks
```js
import { renderHook } from '@testing-library/react-hooks';
import { useTranslation } from 'react-i18next';

test('useTranslation hook', () => {
  const { result } = renderHook(() => useTranslation());
  
  expect(result.current.t('header.brand')).toBe('Your Company Brand');
});
```

#### Mocking Modules
```js
// Mock entire module
jest.mock('../../utils/api', () => ({
  fetchData: jest.fn(() => Promise.resolve({ data: 'test' })),
}));

// Mock specific function
const mockFetch = jest.fn();
global.fetch = mockFetch;
```

#### Testing Error Boundaries
```js
test('catches errors', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation();
  
  expect(() => {
    render(<ErrorBoundary><ThrowError /></ErrorBoundary>);
  }).not.toThrow();
  
  spy.mockRestore();
});
```

### Debugging Tests

#### View Rendered Output
```js
import { debug } from '@testing-library/react';

test('debug example', () => {
  const { debug } = render(<MyComponent />);
  debug(); // Prints the DOM tree
});
```

#### Run Tests in Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome.

#### Verbose Output
```bash
npm test -- --verbose
```

### Coverage Reports

Jest generates coverage reports showing:
- **Statements** - % of statements executed
- **Branches** - % of conditional branches tested
- **Functions** - % of functions called
- **Lines** - % of lines executed

**View coverage in terminal:**
```bash
npm run test:coverage
```

**View HTML coverage report:**
```bash
npm run coverage
```

Coverage reports are generated in `coverage/` directory.

### Related Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Test Renderer](https://reactjs.org/docs/test-renderer.html)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Linting

In order to check if your JavaScript and CSS code follows the suggested style
guidelines run:

```bash
npm run lint
```
