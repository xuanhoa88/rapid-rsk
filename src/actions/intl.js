/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import {
  SET_LOCALE_ERROR,
  SET_LOCALE_START,
  SET_LOCALE_SUCCESS,
} from '../constants';
import { changeLanguage } from '../i18n';
import { navigateTo } from '../navigator';

// =============================================================================
// CONSTANTS
// =============================================================================

const LOCALE_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds
const LOCALE_COOKIE_NAME = 'lang';

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Check if running in browser environment
 * @returns {boolean}
 */
function isBrowser() {
  return typeof window !== 'undefined';
}

/**
 * Set locale cookie in browser
 * @param {string} locale - Locale code
 */
function setLocaleCookie(locale) {
  if (!isBrowser()) return;

  document.cookie = `${LOCALE_COOKIE_NAME}=${locale};path=/;max-age=${LOCALE_COOKIE_MAX_AGE}`;
}

/**
 * Update URL with locale parameter
 * @param {string} locale - Locale code
 */
function updateLocaleUrl(locale) {
  if (!isBrowser()) return;

  navigateTo(`?lang=${locale}`);
}

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Set application locale
 *
 * Changes the application language and persists the choice:
 * 1. Dispatches SET_LOCALE_START action
 * 2. Changes i18next language
 * 3. Dispatches SET_LOCALE_SUCCESS action
 * 4. Saves locale to cookie (browser only)
 * 5. Updates URL with locale parameter (browser only)
 *
 * @param {Object} options
 * @param {string} options.locale - Locale code (e.g., 'en-US', 'cs-CZ')
 * @returns {Function} Redux thunk action
 *
 * @example
 * dispatch(setLocale('en-US'));
 */
export function setLocale(locale) {
  return async dispatch => {
    // Validate locale parameter
    if (!locale || typeof locale !== 'string') {
      console.error('Invalid locale:', locale);
      return null;
    }

    // Start locale change
    dispatch({
      type: SET_LOCALE_START,
      payload: { locale },
    });

    try {
      // Change i18next language
      const newLanguage = await changeLanguage(locale);

      // Success - update Redux state
      dispatch({
        type: SET_LOCALE_SUCCESS,
        payload: { locale },
      });

      // Persist locale (browser only)
      setLocaleCookie(locale);
      updateLocaleUrl(locale);

      return newLanguage;
    } catch (error) {
      // Error - update Redux state
      console.error('Failed to change locale:', error);

      dispatch({
        type: SET_LOCALE_ERROR,
        payload: {
          locale,
          error: error.message || 'Unknown error',
        },
      });

      return null;
    }
  };
}
