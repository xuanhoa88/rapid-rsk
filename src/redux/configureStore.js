/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { composeWithDevTools } from '@redux-devtools/extension';
import { applyMiddleware, createStore } from 'redux';
import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';
import rootReducer from './rootReducer';

/**
 * Create helpers object for Redux thunk actions
 *
 * These helpers are injected as the third argument to thunk actions:
 * function myAction() {
 *   return async (dispatch, getState, { fetch, navigator, i18n }) => {
 *     // Use helpers here
 *   };
 * }
 *
 * @param {Object} config - Helpers configuration
 * @param {Function} config.fetch - Configured fetch client
 * @param {Object} config.navigator - Navigation utilities
 * @param {Object} config.i18n - i18next instance for internationalization
 * @returns {Object} Helpers object
 */
function createHelpers(config = {}) {
  return {
    fetch: config.fetch,
    navigator: config.navigator,
    i18n: config.i18n,
  };
}

/**
 * Configure and create Redux store
 *
 * @param {Object} [initialState={}] - Initial Redux state
 * @param {Object} [helpersConfig={}] - Configuration for thunk helpers
 * @param {Function} [helpersConfig.fetch] - Fetch client for API calls
 * @param {Object} [helpersConfig.navigator] - Navigator for routing
 * @param {Object} [helpersConfig.i18n] - i18next instance for internationalization
 * @returns {Object} Configured Redux store
 *
 * @example
 * // Server-side
 * const store = configureStore(
 *   { user: req.user },
 *   { fetch: createFetch(...), navigator, i18n }
 * );
 *
 * @example
 * // Client-side
 * const store = configureStore(
 *   window.__INITIAL_STATE__,
 *   { fetch: createFetch(...), navigator, i18n }
 * );
 */
export default function configureStore(initialState = {}, helpersConfig = {}) {
  // Create helpers for thunk actions
  const helpers = createHelpers(helpersConfig);

  // Setup middleware
  const middleware = [thunk.withExtraArgument(helpers)];

  // Add Redux Logger in development
  if (__DEV__) {
    middleware.push(
      createLogger({
        collapsed: true,
        duration: true,
        timestamp: false,
      }),
    );
  }

  // Create store enhancer
  const enhancer = __DEV__
    ? composeWithDevTools(applyMiddleware(...middleware))
    : applyMiddleware(...middleware);

  // Create store
  const store = createStore(rootReducer, initialState, enhancer);

  // Enable hot module replacement for reducers (development only)
  if (module.hot) {
    module.hot.accept('./rootReducer', () => {
      // eslint-disable-next-line global-require
      const nextRootReducer = require('./rootReducer').default;
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
}
