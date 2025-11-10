# Redux Module

This directory contains all Redux-related code for the React Starter Kit application.

## 📁 Structure (Feature-Based)

The Redux module uses a **feature-based structure** where each feature is self-contained with its own actions, constants, and reducer. This prevents cross-module dependencies and improves maintainability.

```
redux/
├── features/                   # Feature modules (self-contained)
│   ├── intl/                   # Internationalization feature
│   │   ├── index.js            # Public API
│   │   ├── actions.js          # Intl actions
│   │   ├── constants.js        # Intl action types
│   │   └── reducer.js          # Intl state reducer
│   ├── runtime/                # Runtime variables feature
│   │   ├── index.js            # Public API
│   │   ├── actions.js          # Runtime actions
│   │   ├── constants.js        # Runtime action types
│   │   └── reducer.js          # Runtime state reducer
│   └── user/                   # User authentication feature
│       ├── index.js            # Public API
│       └── reducer.js          # User state reducer
│── configureStore.js           # Redux store setup
├── rootReducer.js              # Combines all feature reducers
├── rootReducer.test.js         # Root reducer tests
├── index.js                    # Main export file (public API)
```

## 🏗️ Feature-Based Architecture

### Why Feature-Based?

The feature-based structure (also known as **Redux Ducks pattern**) provides:

1. **✅ Self-Contained Modules** - Each feature has everything it needs
2. **✅ No Cross-Dependencies** - Features don't import from each other
3. **✅ Easy to Scale** - Add new features without touching existing ones
4. **✅ Better Organization** - Related code stays together
5. **✅ Easier Testing** - Test features in isolation
6. **✅ Clear Boundaries** - Each feature has a clear public API

### Feature Structure

Each feature module follows this pattern:

```
features/myFeature/
├── index.js       # Public API (exports only what's needed)
├── actions.js     # Action creators (private)
├── constants.js   # Action types (private)
└── reducer.js     # State reducer (private)
```

**Key Principle:** Only `index.js` is imported by other parts of the app. Internal files (`actions.js`, `constants.js`, `reducer.js`) are never imported directly.

### Example: Intl Feature

```javascript
// features/intl/index.js (Public API)
export { setLocale } from './actions'; // Export action
export { SET_LOCALE_START } from './constants'; // Export constant (optional)
export { default } from './reducer'; // Export reducer

// Other files import from the feature, not internal files:
import { setLocale } from './redux/features/intl'; // ✅ Good
import { setLocale } from './redux/features/intl/actions'; // ❌ Bad
```

### Adding a New Feature

1. **Create feature directory:**

   ```bash
   mkdir src/redux/features/myFeature
   ```

2. **Create constants.js:**

   ```javascript
   export const MY_ACTION = 'myFeature/MY_ACTION';
   ```

3. **Create actions.js:**

   ```javascript
   import { MY_ACTION } from './constants';

   export function myAction(payload) {
     return { type: MY_ACTION, payload };
   }
   ```

4. **Create reducer.js:**

   ```javascript
   import { MY_ACTION } from './constants';

   export default function myFeature(state = {}, action) {
     switch (action.type) {
       case MY_ACTION:
         return { ...state, ...action.payload };
       default:
         return state;
     }
   }
   ```

5. **Create index.js (Public API):**

   ```javascript
   export { myAction } from './actions';
   export { MY_ACTION } from './constants';
   export { default } from './reducer';
   ```

6. **Add to rootReducer.js:**

   ```javascript
   import myFeature from './features/myFeature';

   export default combineReducers({
     intl,
     runtime,
     user,
     myFeature, // Add here
   });
   ```

7. **Export from main index.js:**
   ```javascript
   export { myAction, MY_ACTION } from './features/myFeature';
   ```

## 🎯 Usage

### Importing from Redux Module

**Recommended:** Import from the main redux module:

```javascript
// ✅ Good - Import from main module
import { configureStore, setLocale, setRuntimeVariable } from './redux';

// ❌ Avoid - Direct imports from subdirectories
import configureStore from './redux/configureStore';
import { setLocale } from './redux/actions/intl';
```

### Available Exports

- **Store:** `configureStore`
- **Actions:** `setLocale`, `setRuntimeVariable`
- **Constants:** All action types (e.g., `SET_LOCALE_START`)
- **Reducers:** `rootReducer` (for advanced use)
