/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import {
  SET_LOCALE_START,
  SET_LOCALE_SUCCESS,
  SET_LOCALE_ERROR,
  SET_LOCALE_FALLBACK,
} from './constants';

// Initial state for intl feature
const initialState = {
  locale: null,
  localeLoading: null, // Locale currently being loaded (null = no loading in progress)
  messages: {},
  localeFallback: null, // Fallback info when requested locale is not available
};

export default function intl(state = initialState, action) {
  switch (action.type) {
    case SET_LOCALE_START: {
      // If messages already loaded, switch locale immediately
      // Otherwise, keep current locale and show loading state
      const locale = state.messages[action.payload.locale]
        ? action.payload.locale
        : state.locale;
      return {
        ...state,
        locale,
        localeLoading: action.payload.locale,
      };
    }

    case SET_LOCALE_SUCCESS: {
      return {
        ...state,
        locale: action.payload.locale,
        localeLoading: null,
        messages: {
          ...state.messages,
          [action.payload.locale]: action.payload.messages,
        },
      };
    }

    case SET_LOCALE_ERROR: {
      return {
        ...state,
        localeLoading: null,
      };
    }

    case SET_LOCALE_FALLBACK: {
      return {
        ...state,
        localeFallback: {
          requestedLocale: action.payload.requestedLocale,
          fallbackLocale: action.payload.fallbackLocale,
          availableLocaleCodes: action.payload.availableLocaleCodes,
          timestamp: Date.now(),
        },
      };
    }

    default: {
      return state;
    }
  }
}

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Get current locale
 * @param {Object} state - Redux state
 * @returns {string|null} Current locale code
 */
export const getLocale = state => (state.intl && state.intl.locale) || null;

/**
 * Get locale currently being loaded
 * @param {Object} state - Redux state
 * @returns {string|null} Locale being loaded, or null if no loading in progress
 */
export const getLocaleLoading = state =>
  (state.intl && state.intl.localeLoading) || null;

/**
 * Check if a locale is currently being loaded
 * @param {Object} state - Redux state
 * @returns {boolean} True if locale is loading
 */
export const isLocaleLoading = state => !!getLocaleLoading(state);

/**
 * Get loaded messages for a specific locale
 * @param {Object} state - Redux state
 * @param {string} locale - Locale code
 * @returns {Object|null} Messages object or null if not loaded
 */
export const getLocaleMessages = (state, locale) =>
  (state.intl && state.intl.messages && state.intl.messages[locale]) || null;

/**
 * Get locale fallback info if any
 * @param {Object} state - Redux state
 * @returns {Object|null} Fallback info object or null
 */
export const getLocaleFallback = state =>
  (state.intl && state.intl.localeFallback) || null;
