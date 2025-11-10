/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

// Public API - Actions
export { setRuntimeVariable } from './actions';

// Public API - Constants (for external use if needed)
export { SET_RUNTIME_VARIABLE } from './constants';

// Public API - Reducer
export { default } from './reducer'; // Default export for rootReducer

// Public API - Selectors
/**
 * Get a runtime variable by name
 *
 * @param {Object} state - Redux state
 * @param {string} name - Variable name
 * @param {*} defaultValue - Default value if variable doesn't exist
 * @returns {*} Variable value or defaultValue
 *
 * @example
 * const appName = getRuntimeVariable(state, 'appName', 'Default App');
 * const appLocales = getRuntimeVariable(state, 'appLocales', {});
 */
export const getRuntimeVariable = (state, name, defaultValue) => {
  const value = state.runtime && state.runtime[name];
  return value !== undefined ? value : defaultValue;
};
