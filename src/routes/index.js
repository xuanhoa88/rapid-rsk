/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/* eslint-disable global-require */

import IsomorphicRouter from '../router';

/**
 * Application routes configuration.
 * Routes are evaluated in order - more specific routes should come first.
 *
 * Note: Dynamic imports must be explicit for webpack to resolve them correctly.
 * Using a helper function with template literals doesn't work with webpack's
 * static analysis.
 */
const routes = {
  children: [
    // Public pages
    {
      action: () => import(/* webpackChunkName: 'home' */ './home'),
    },
    {
      path: '/contact',
      action: () => import(/* webpackChunkName: 'contact' */ './contact'),
    },
    {
      path: '/about',
      action: () => import(/* webpackChunkName: 'about' */ './about'),
    },
    {
      path: '/privacy',
      action: () => import(/* webpackChunkName: 'privacy' */ './privacy'),
    },

    // Authentication pages
    {
      path: '/login',
      action: () => import(/* webpackChunkName: 'login' */ './login'),
    },
    {
      path: '/register',
      action: () => import(/* webpackChunkName: 'register' */ './register'),
    },
    {
      path: '/reset-password',
      action: () =>
        import(/* webpackChunkName: 'reset-password' */ './reset-password'),
    },

    // Protected pages
    {
      path: '/admin',
      action: () => import(/* webpackChunkName: 'admin' */ './admin'),
    },

    // 404 - Must be last
    {
      path: '/*path',
      action: () => import(/* webpackChunkName: 'not-found' */ './not-found'),
    },
  ],

  /**
   * Root action - wraps all child routes.
   * Provides default metadata and executes child route actions.
   */
  async action({ next }) {
    const route = await next();

    // Apply default metadata
    return {
      ...route,
      title: route.title ? `${route.title} - RSK` : 'RSK',
      description: route.description || '',
    };
  },
};

/**
 * Development-only routes.
 * Add error page for testing error states.
 */
if (__DEV__) {
  routes.children.unshift({
    path: '/error',
    action: require('./error').default,
  });
}

/**
 * Create and export the router instance.
 * This instance is shared across the application for consistent routing.
 *
 * The router handles both server-side and client-side routing,
 * enabling seamless SSR and client-side navigation.
 */
const router = new IsomorphicRouter(routes);

export default router;
