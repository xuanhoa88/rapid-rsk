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
  newLocale: null,
  messages: {},
  fallbackWarning: null,
};

export default function intl(state = initialState, action) {
  switch (action.type) {
    case SET_LOCALE_START: {
      const locale = state[action.payload.locale]
        ? action.payload.locale
        : state.locale;
      return {
        ...state,
        locale,
        newLocale: action.payload.locale,
      };
    }

    case SET_LOCALE_SUCCESS: {
      return {
        ...state,
        locale: action.payload.locale,
        newLocale: null,
        messages: {
          ...state.messages,
          [action.payload.locale]: action.payload.messages,
        },
      };
    }

    case SET_LOCALE_ERROR: {
      return {
        ...state,
        newLocale: null,
      };
    }

    case SET_LOCALE_FALLBACK: {
      return {
        ...state,
        fallbackWarning: {
          requestedLocale: action.payload.requestedLocale,
          fallbackLocale: action.payload.fallbackLocale,
          appLocaleCodes: action.payload.appLocaleCodes,
          timestamp: Date.now(),
        },
      };
    }

    default: {
      return state;
    }
  }
}
