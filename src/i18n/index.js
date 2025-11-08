/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import csCZ from './translations/cs-CZ.json';
import enUS from './translations/en-US.json';

// =============================================================================
// LOCALE CONFIGURATION
// =============================================================================

export const DEFAULT_LOCALE = 'en-US';

const locales = Object.freeze({
  'en-US': { name: 'English (US)', translation: enUS },
  'cs-CZ': { name: 'Čeština', translation: csCZ },
});

// =============================================================================
// LOCALE UTILITIES (Cached for Performance)
// =============================================================================

const cachedAvailableLocales = Object.freeze(
  Object.keys(locales).reduce((acc, key) => {
    acc[key] = Object.freeze({ name: locales[key].name });
    return acc;
  }, {}),
);

/**
 * Get available locales (without translations)
 * @returns {Object} Frozen object with locale metadata
 */
export function getAvailableLocales() {
  return cachedAvailableLocales;
}

/**
 * Check if locale is supported
 * @param {string} locale - Locale code
 * @returns {boolean}
 */
export function isLocaleSupported(locale) {
  return locale in locales;
}

// =============================================================================
// I18NEXT CONFIGURATION
// =============================================================================

const i18nConfig = {
  resources: Object.keys(locales).reduce((acc, key) => {
    acc[key] = { translation: locales[key].translation };
    return acc;
  }, {}),
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: 'translation',
  ns: ['translation'],
  interpolation: {
    escapeValue: false, // React already escapes
  },
  react: {
    useSuspense: false, // Required for SSR
  },
  debug:
    typeof process !== 'undefined' && process.env.RSK_I18N_DEBUG === 'true',
};

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Create and initialize i18n instance immediately
 * Synchronous initialization for simplicity
 */
const i18nInstance = i18n.createInstance();
i18nInstance.use(initReactI18next).init(i18nConfig);

/**
 * Get i18n instance
 * @returns {Object} Initialized i18n instance
 */
export function getI18nInstance() {
  return i18nInstance;
}

/**
 * Change language
 * @param {string} locale - Locale code (e.g., 'en-US', 'cs-CZ')
 * @returns {Promise<string>}
 */
export async function changeLanguage(locale) {
  return i18nInstance.changeLanguage(locale);
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default i18nInstance;
