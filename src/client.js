/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { loadableReady } from '@loadable/component';
import queryString from 'query-string';
import { createRoot, hydrateRoot } from 'react-dom/client';
import 'whatwg-fetch';
import App from './components/App';
import { createFetch } from './createFetch';
import i18n from './i18n';
import * as navigator from './navigator';
import router from './routes';
import configureStore from './store/configureStore';

// -------------------------------------------------------------------------
// DOM Helper Functions for managing document head elements
// -------------------------------------------------------------------------

/**
 * Update the document title
 */
function updateTitle(title) {
  if (title) {
    document.title = title;
  }
}

/**
 * Update or create a meta tag
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
 * Update or create a link tag
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

  // Set additional attributes
  Object.keys(attributes).forEach(key => {
    link.setAttribute(key, attributes[key]);
  });
}

/**
 * Update page metadata (title, description, and Open Graph tags)
 * Call this function after route changes to update meta tags
 *
 * @param {Object} metadata - Metadata object
 * @param {string} metadata.title - Page title
 * @param {string} metadata.description - Page description
 * @param {string} metadata.image - Open Graph image URL
 * @param {string} metadata.url - Canonical URL
 * @param {string} metadata.type - Open Graph type (default: 'website')
 *
 * @example
 * updatePageMetadata({
 *   title: 'My Page - Site Name',
 *   description: 'Page description',
 *   image: 'https://example.com/image.jpg',
 *   url: 'https://example.com/page',
 * });
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

// Universal HTTP client
const fetch = createFetch(window.fetch, {
  // eslint-disable-next-line no-underscore-dangle
  baseUrl: window.__APP_STATE__.apiUrl,
});

// Initialize a new Redux store
// http://redux.js.org/docs/basics/UsageWithReact.html
// eslint-disable-next-line no-underscore-dangle
const store = configureStore(window.__APP_STATE__.state, {
  fetch,
  navigator,
});

// Global (context) variables that can be easily accessed from any React component
// https://facebook.github.io/react/docs/context.html
const context = {
  store,
  fetch,
  i18n,
};

const container = document.getElementById('app');
let currentLocation = navigator.getCurrentLocation();
let unsubscribeNavigation = null;

// React 18 root instance (cached for re-renders)
let root = null;

const scrollPositionsHistory = {};

// Performance monitoring
const performanceMetrics = {
  navigationCount: 0,
  errors: [],
  lastNavigationTime: null,
};

/**
 * Save current scroll position
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
 * Restore scroll position for a location
 * @param {Object} location - History location object
 */
function restoreScrollPosition(location) {
  let scrollX = 0;
  let scrollY = 0;

  const pos = scrollPositionsHistory[location.key];
  if (pos) {
    scrollX = pos.scrollX;
    scrollY = pos.scrollY;
  } else {
    // Handle hash navigation
    const targetHash = location.hash.substr(1);
    if (targetHash) {
      const target = document.getElementById(targetHash);
      if (target) {
        scrollY = window.pageYOffset + target.getBoundingClientRect().top;
      }
    }
  }

  // Use requestAnimationFrame for smoother scrolling
  requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
}

/**
 * Handle navigation errors
 * @param {Error} error - Error object
 * @param {boolean} isInitialRender - Whether this is the initial render
 * @param {Object} location - Current location
 */
function handleNavigationError(error, isInitialRender, location) {
  // Track error
  performanceMetrics.errors.push({
    timestamp: Date.now(),
    error: error.message,
    stack: error.stack,
    location: location.pathname,
    isInitialRender,
  });

  if (__DEV__) {
    console.error('Navigation error:', error);
    throw error;
  }

  console.error('Navigation error:', error);

  // Do a full page reload if error occurs during client-side navigation
  if (!isInitialRender && currentLocation.key === location.key) {
    console.error('RSK will reload your page after error');
    window.location.reload();
  }
}

/**
 * Re-render the app when window.location changes
 * @param {Object} location - History location object
 * @param {string} action - Navigation action (PUSH, REPLACE, POP)
 */
async function onLocationChange(location, action) {
  const navigationStartTime = performance.now();

  // Save scroll position before navigation
  saveScrollPosition();

  // Delete stored scroll position for next page if action is PUSH
  if (action === 'PUSH') {
    delete scrollPositionsHistory[location.key];
  }

  currentLocation = location;

  const isInitialRender = !action;
  try {
    context.pathname = location.pathname;
    context.query = queryString.parse(location.search);

    // Traverses the list of routes in the order they are defined until
    // it finds the first route that matches provided URL path string
    // and whose action method returns anything other than `undefined`.
    const route = await router.resolve(context);

    // Prevent multiple page renders during the routing process
    if (currentLocation.key !== location.key) {
      return;
    }

    if (route.redirect) {
      navigator.replaceTo(route.redirect);
      return;
    }

    // Create app element
    const appElement = <App context={context}>{route.component}</App>;

    // React 18: Use hydrateRoot for initial render, createRoot for subsequent renders
    if (isInitialRender) {
      // Hydrate on initial render (SSR)
      root = hydrateRoot(container, appElement, {
        onRecoverableError: error => {
          if (__DEV__) {
            console.error('Hydration error:', error);
          }
          performanceMetrics.errors.push({
            type: 'hydration',
            error,
            timestamp: Date.now(),
          });
        },
      });

      // Switch off the native scroll restoration behavior and handle it manually
      // https://developers.google.com/web/updates/2015/09/history-api-scroll-restoration
      if (window.history && 'scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }

      // Remove SSR CSS
      const elem = document.getElementById('css');
      if (elem) elem.parentNode.removeChild(elem);
    } else {
      // Create root on first client-side navigation (if not hydrated)
      if (!root) {
        root = createRoot(container);
      }

      // Re-render on navigation
      root.render(appElement);

      // Update page metadata if provided in route
      if (route.title || route.description) {
        updatePageMetadata({
          title: route.title,
          description: route.description,
          url: window.location.href,
        });
      }

      // Restore scroll position
      restoreScrollPosition(location);
    }

    // Track performance
    const navigationDuration = performance.now() - navigationStartTime;
    performanceMetrics.navigationCount += 1;
    performanceMetrics.lastNavigationTime = navigationDuration;

    if (__DEV__ && navigationDuration > 1000) {
      console.warn(
        `Slow navigation detected: ${navigationDuration.toFixed(2)}ms`,
      );
    }
  } catch (error) {
    handleNavigationError(error, isInitialRender, location);
  }
}

/**
 * Cleanup function to unsubscribe from navigation and save state
 */
function cleanup() {
  // Save current scroll position
  saveScrollPosition();

  // Unsubscribe from navigation
  if (typeof unsubscribeNavigation === 'function') {
    unsubscribeNavigation();
    unsubscribeNavigation = null;
  }

  // App cleanup complete

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('Client cleanup completed');
  }
}

/**
 * Initialize the client-side application
 * Sets up navigation, event listeners, and triggers initial render
 */
let isHistoryObserved = false;
function initializeApp() {
  // Handle client-side navigation by using HTML5 History API
  // For more information visit https://github.com/mjackson/history#readme
  currentLocation = navigator.getCurrentLocation();

  if (!isHistoryObserved) {
    isHistoryObserved = true;
    unsubscribeNavigation = navigator.subscribeToNavigation(onLocationChange);

    // Setup cleanup on page unload
    window.addEventListener('beforeunload', cleanup);

    // Save scroll position on scroll (debounced)
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

// Application startup requires both conditions to be met:
// 1. DOM is ready (document parsed, container element exists)
// 2. Code-split chunks are loaded (@loadable/component)
const READY_STATES = new Set(['interactive', 'complete']);
let isDOMReady = READY_STATES.has(document.readyState) && !!document.body;
let areChunksLoaded = false;

/**
 * Attempt to start the application if both conditions are met
 * Only proceeds when both DOM and chunks are ready
 */
function attemptStartup() {
  if (isDOMReady && areChunksLoaded) {
    initializeApp();
  }
}

// Wait for @loadable chunks to be loaded
loadableReady(() => {
  areChunksLoaded = true;
  attemptStartup();
});

// Wait for DOM to be ready
if (isDOMReady) {
  // DOM already ready, check if chunks are loaded
  attemptStartup();
} else {
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', () => {
    isDOMReady = true;
    attemptStartup();
  });
}

// Hot Module Replacement (HMR) for router changes
// React Refresh handles component updates automatically
if (__DEV__ && module.hot) {
  module.hot.accept('./routes', () => {
    // Re-render current route when router configuration changes
    onLocationChange(currentLocation);
  });
}
