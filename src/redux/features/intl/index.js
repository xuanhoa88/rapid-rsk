/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

// Public API - Actions
export { setLocale } from './actions';

// Public API - Constants (for external use if needed)
export {
  SET_LOCALE_START,
  SET_LOCALE_SUCCESS,
  SET_LOCALE_ERROR,
  SET_LOCALE_FALLBACK,
} from './constants';

// Public API - Reducer
export { default } from './reducer'; // Default export for rootReducer

// Public API - Selectors
export {
  getLocale,
  getLocaleLoading,
  isLocaleLoading,
  getLocaleMessages,
  getLocaleFallback,
} from './reducer';
