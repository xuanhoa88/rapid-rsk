/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/**
 * Redux Features - Public API
 *
 * Centralized export point for all Redux features.
 * Each feature is self-contained with its own actions, constants, and reducer.
 *
 * Features follow the Redux Ducks pattern:
 * - features/featureName/index.js - Public API
 * - features/featureName/actions.js - Action creators (private)
 * - features/featureName/constants.js - Action types (private)
 * - features/featureName/reducer.js - State reducer (private)
 */

// =============================================================================
// FEATURE: INTL (Internationalization)
// =============================================================================

export {
  // Actions
  setLocale,
  // Constants
  SET_LOCALE_START,
  SET_LOCALE_SUCCESS,
  SET_LOCALE_ERROR,
  SET_LOCALE_FALLBACK,
  // Selectors
  getLocale,
  getLocaleLoading,
  isLocaleLoading,
  getLocaleMessages,
  getLocaleFallback,
  // Reducer (default export from feature)
  default as intlReducer,
} from './intl';

// =============================================================================
// FEATURE: RUNTIME (Runtime Variables)
// =============================================================================

export {
  // Actions
  setRuntimeVariable,
  // Constants
  SET_RUNTIME_VARIABLE,
  // Selectors
  getRuntimeVariable,
  // Reducer (default export from feature)
  default as runtimeReducer,
} from './runtime';

// =============================================================================
// FEATURE: USER (Authentication)
// =============================================================================

export {
  // Actions
  login,
  register,
  logout,
  getCurrentUser,
  resetPassword,
  updateUser,
  // Constants
  LOGIN_START,
  LOGIN_SUCCESS,
  LOGIN_ERROR,
  REGISTER_START,
  REGISTER_SUCCESS,
  REGISTER_ERROR,
  LOGOUT,
  FETCH_USER_START,
  FETCH_USER_SUCCESS,
  FETCH_USER_ERROR,
  RESET_PASSWORD_START,
  RESET_PASSWORD_SUCCESS,
  RESET_PASSWORD_ERROR,
  UPDATE_USER,
  // Selectors
  getUser,
  isAuthenticated,
  isAdmin,
  getUserId,
  getUserEmail,
  getUserDisplayName,
  // Reducer (default export from feature)
  default as userReducer,
} from './user';
