/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { loadableReady } from '@loadable/component';
import queryString from 'query-string';
import ReactDOM from 'react-dom';
import 'whatwg-fetch';
import App from './components/App';
import { createFetch } from './createFetch';
import { getI18nInstance } from './i18n';
import * as navigator from './navigator';
import router from './routes';
import { configureStore } from './redux';

/**
 * Get i18n instance
 * Will be initialized with correct locale after Redux store is created
 */
const i18n = getI18nInstance();

// React 18+ APIs (optional)
let createRoot;
let hydrateRoot;
try {
  const ReactDOMClient = require('react-dom/client');
  createRoot = ReactDOMClient.createRoot;
  hydrateRoot = ReactDOMClient.hydrateRoot;
} catch (e) {
  // React 16/17 fallback
  createRoot = null;
  hydrateRoot = null;
}

// -------------------------------------------------------------------------
// DOM Helper Functions
// -------------------------------------------------------------------------

/**
 * Update document title
 */
function updateTitle(title) {
  if (title) {
    document.title = title;
  }
}

/**
 * Update or create meta tag
 */
function updateMeta(name, content, isProperty = false) {
  const attribute = isProperty ? 'property' : 'name';
  let meta = document.querySelector(`meta[${attribute}="${name}"]`);

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    document.head.appendChild(meta);
  }

  meta.setAttribute('content', content);
}

/**
 * Update or create link tag
 */
function updateLink(rel, href, attributes = {}) {
  let link = document.querySelector(
    `link[rel="${rel}"]${href ? `[href="${href}"]` : ''}`,
  );

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }

  link.setAttribute('href', href);

  Object.keys(attributes).forEach(key => {
    link.setAttribute(key, attributes[key]);
  });
}

/**
 * Update page metadata after route changes
 * @param {Object} metadata - Page metadata (title, description, image, url, type)
 */
function updatePageMetadata({
  title,
  description,
  image,
  url,
  type = 'website',
}) {
  if (title) {
    updateTitle(title);
    updateMeta('og:title', title, true);
    updateMeta('twitter:title', title);
  }

  if (description) {
    updateMeta('description', description);
    updateMeta('og:description', description, true);
    updateMeta('twitter:description', description);
  }

  if (image) {
    updateMeta('og:image', image, true);
    updateMeta('twitter:image', image);
  }

  if (url) {
    updateMeta('og:url', url, true);
    updateLink('canonical', url);
  }

  if (type) {
    updateMeta('og:type', type, true);
  }
}

// -------------------------------------------------------------------------
// Application Initialization
// -------------------------------------------------------------------------

const fetch = createFetch(window.fetch, {
  // eslint-disable-next-line no-underscore-dangle
  baseUrl: window.__APP_STATE__.apiUrl,
});

// eslint-disable-next-line no-underscore-dangle
const store = configureStore(window.__APP_STATE__.reduxState, {
  fetch,
  navigator,
  i18n,
});

// Sync i18n locale with Redux state from server
// This prevents hydration mismatch between server and client
const serverLocale = store.getState().intl && store.getState().intl.locale;
if (serverLocale && i18n.language !== serverLocale) {
  i18n.changeLanguage(serverLocale);
}

const context = {
  store,
  fetch,
  i18n,
  get locale() {
    const { intl } = store.getState();
    return (intl && intl.locale) || 'en-US';
  },
};

// React 18+ root instance (cached for re-renders, null for React 16/17)
let root = null;

// DOM container for React app
const container = document.getElementById('app');

// Current location state
let currentLocation = navigator.getCurrentLocation();

// Navigation subscription cleanup function
let unsubscribeNavigation = null;

// Scroll position cache for back/forward navigation
const scrollPositionsHistory = {};

// Performance tracking (development only)
const performanceMetrics = __DEV__
  ? {
      navigationCount: 0,
      errors: [],
      lastNavigationTime: null,
    }
  : null;

/**
 * Save current scroll position for back/forward navigation
 */
function saveScrollPosition() {
  if (currentLocation && currentLocation.key) {
    scrollPositionsHistory[currentLocation.key] = {
      scrollX: window.pageXOffset,
      scrollY: window.pageYOffset,
    };
  }
}

/**
 * Restore scroll position or scroll to hash target
 */
function restoreScrollPosition(location) {
  let scrollX = 0;
  let scrollY = 0;

  const pos = scrollPositionsHistory[location.key];
  if (pos) {
    scrollX = pos.scrollX;
    scrollY = pos.scrollY;
  } else {
    const targetHash = location.hash.substr(1);
    if (targetHash) {
      const target = document.getElementById(targetHash);
      if (target) {
        scrollY = window.pageYOffset + target.getBoundingClientRect().top;
      }
    }
  }

  requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
}

/**
 * Handle navigation errors and reload page if needed
 */
function handleNavigationError(error, isInitialRender, location) {
  if (__DEV__) {
    performanceMetrics?.errors.push({
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack,
      location: location.pathname,
      isInitialRender,
    });
    console.error('Navigation error:', error);
    throw error;
  }

  console.error('Navigation error:', error);

  if (!isInitialRender && currentLocation.key === location.key) {
    console.error('React Starter Kit will reload your page after error');
    window.location.reload();
  }
}

/**
 * Handle location changes and re-render app
 */
async function onLocationChange(location, action) {
  const navigationStartTime = performance.now();

  saveScrollPosition();

  if (action === 'PUSH') {
    delete scrollPositionsHistory[location.key];
  }

  currentLocation = location;

  const isInitialRender = !action;
  try {
    context.pathname = location.pathname;
    context.query = queryString.parse(location.search);

    const route = await router.resolve(context);

    if (currentLocation.key !== location.key) {
      return;
    }

    if (route.redirect) {
      navigator.replaceTo(route.redirect);
      return;
    }

    const appElement = <App context={context}>{route.component}</App>;

    if (isInitialRender) {
      if (typeof hydrateRoot === 'function') {
        // React 18+
        root = hydrateRoot(container, appElement, {
          onRecoverableError: error => {
            if (__DEV__) {
              console.error('Hydration error:', error);
              performanceMetrics?.errors.push({
                type: 'hydration',
                error,
                timestamp: Date.now(),
              });
            }
          },
        });
      } else {
        // React 16/17 fallback
        // eslint-disable-next-line react/no-deprecated
        ReactDOM.hydrate(appElement, container);
      }

      if (window.history && 'scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }

      // Remove server-side injected CSS from @loadable/component
      // These <style> tags are in the <head> and were used for SSR
      // Client-side CSS will be loaded via <link> tags instead
      const ssrStyles = document.head.querySelectorAll('style[data-ssr]');
      ssrStyles.forEach(style => style.parentNode.removeChild(style));
    } else {
      if (typeof createRoot === 'function') {
        // React 18+
        if (!root) {
          root = createRoot(container);
        }
        root.render(appElement);
      } else {
        // React 16/17 fallback
        // eslint-disable-next-line react/no-deprecated
        ReactDOM.render(appElement, container);
      }

      if (route.title || route.description) {
        updatePageMetadata({
          title: route.title,
          description: route.description,
          url: window.location.href,
        });
      }

      restoreScrollPosition(location);
    }

    if (__DEV__) {
      const navigationDuration = performance.now() - navigationStartTime;
      performanceMetrics.navigationCount += 1;
      performanceMetrics.lastNavigationTime = navigationDuration;

      if (navigationDuration > 1000) {
        console.warn(
          `Slow navigation detected: ${navigationDuration.toFixed(2)}ms`,
        );
      }
    }
  } catch (error) {
    handleNavigationError(error, isInitialRender, location);
  }
}

/**
 * Cleanup before page unload
 */
function cleanup() {
  saveScrollPosition();

  if (typeof unsubscribeNavigation === 'function') {
    unsubscribeNavigation();
    unsubscribeNavigation = null;
  }

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('Client cleanup completed');
  }
}

/**
 * Initialize app with navigation and event listeners
 */
let isHistoryObserved = false;
function initializeApp() {
  currentLocation = navigator.getCurrentLocation();

  if (!isHistoryObserved) {
    isHistoryObserved = true;
    unsubscribeNavigation = navigator.subscribeToNavigation(onLocationChange);

    window.addEventListener('beforeunload', cleanup);

    let scrollTimeout;
    window.addEventListener(
      'scroll',
      () => {
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(saveScrollPosition, 100);
      },
      { passive: true },
    );
  }

  onLocationChange(currentLocation);
}

// =============================================================================
// APPLICATION STARTUP
// =============================================================================

const READY_STATES = new Set(['interactive', 'complete']);
let isDOMReady = READY_STATES.has(document.readyState) && !!document.body;
let areChunksLoaded = false;

/**
 * Start app when both DOM and chunks are ready
 */
function attemptStartup() {
  if (isDOMReady && areChunksLoaded) {
    initializeApp();
  }
}

// Wait for code-split chunks to load
loadableReady(() => {
  areChunksLoaded = true;
  attemptStartup();
});

// Wait for DOM to be ready
if (isDOMReady) {
  attemptStartup();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    isDOMReady = true;
    attemptStartup();
  });
}

// Hot module replacement for route changes
if (__DEV__ && module.hot) {
  module.hot.accept('./routes', () => {
    onLocationChange(currentLocation);
  });
}
