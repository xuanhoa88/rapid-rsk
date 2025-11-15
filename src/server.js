/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import expressProxy from 'express-http-proxy';
import requestLanguage from 'express-request-language';
import { ChunkExtractor } from '@loadable/server';
import Youch from 'youch';
import nodeFetch from 'node-fetch';
import path from 'path';
import ReactDOM from 'react-dom/server';
import {
  configureStore,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  setLocale,
  setRuntimeVariable,
} from './redux';
import App from './components/App';
import Html from './components/Html';
import { createFetch } from './createFetch';
import { AVAILABLE_LOCALES, DEFAULT_LOCALE, getI18nInstance } from './i18n';
import * as navigator from './navigator';
import { router } from './pages';
// import { createWebSocketServer } from './websocket';

// =============================================================================
// GLOBAL ERROR HANDLERS
// =============================================================================

process.on('unhandledRejection', reason => {
  console.error('❌ Unhandled Rejection:', reason);
  if (reason instanceof Error) console.error(reason.stack);
  process.exit(1);
});

process.on('uncaughtException', err => {
  console.error('❌ Uncaught Exception:', err);
  console.error(err.stack);
  process.exit(1);
});

// Configure global navigator for CSS tooling (required by some CSS-in-JS libraries)
if (!global.navigator) {
  global.navigator = { userAgent: 'all' };
}

// Environment variable defaults
const config = Object.freeze({
  // Server configuration
  port: parseInt(process.env.RSK_PORT, 10) || 3000,
  host: process.env.RSK_HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  trustProxy: process.env.RSK_TRUST_PROXY === 'true' || 'loopback',

  // Application metadata
  appName: process.env.RSK_APP_NAME || 'React Starter Kit',
  appDescription:
    process.env.RSK_APP_DESCRIPTION ||
    'Boilerplate for React.js web applications',

  // Base path for API routes
  apiPrefix: process.env.RSK_API_PREFIX || '/api',

  // JWT settings
  jwtSecret: process.env.RSK_JWT_SECRET,
  jwtExpiresIn: process.env.RSK_JWT_EXPIRES_IN || '7d',
});

// i18n instance
const i18n = getI18nInstance();

/**
 * Setup API proxy if configured
 *
 * This function configures an HTTP proxy to forward API requests to a different server.
 * It's particularly useful in development when the frontend and backend are served from different origins
 * to avoid CORS issues, or in production when you want to route API requests through your Node.js server.
 *
 * The proxy is only enabled if the RSK_API_PROXY_URL environment variable is set.
 * When enabled, all requests to /api/* will be forwarded to the specified URL.
 *
 * @param {Object} app - Express application instance
 */
function setupApiProxy(app) {
  // Get the API proxy URL from environment variables
  const apiProxyUrl = process.env.RSK_API_PROXY_URL;

  // Exit early if no proxy URL is configured
  if (!apiProxyUrl) {
    console.info('ℹ️  API Proxy is not configured (RSK_API_PROXY_URL not set)');
    return;
  }

  // Log proxy activation
  console.info(
    `🔀 API Proxy enabled: Forwarding ${config.apiPrefix}/* to ${apiProxyUrl}`,
  );

  // Setup the proxy middleware
  app.use(
    config.apiPrefix, // Base path to proxy (e.g., /api)
    expressProxy(apiProxyUrl, {
      // Transform the request path before proxying
      // Removes the API prefix from the URL path
      proxyReqPathResolver: req => {
        const newPath = req.url.replace(new RegExp(`^${config.apiPrefix}`), '');
        console.debug(
          `Proxying: ${req.method} ${req.url} -> ${apiProxyUrl}${newPath}`,
        );
        return newPath;
      },
      // Handle proxy errors
      proxyErrorHandler: (err, res, next) => {
        console.error('Proxy Error:', err);
        next(err);
      },
      // Intercept and modify response headers if needed
      // eslint-disable-next-line no-unused-vars
      userResHeaderInterceptor: (proxyRes, proxyResData, userReq, userRes) => {
        // You can modify response headers here if needed
        // For example, to handle CORS headers
        // userRes.setHeader('Access-Control-Allow-Origin', '*');
        return proxyResData;
      },
    }),
  );

  // Log proxy configuration when server starts
  app.on('listening', () => {
    console.info(
      `🔀 API Proxy active: ${config.apiPrefix}/* -> ${apiProxyUrl}`,
    );
  });
}

/**
 * Create Redux store for SSR
 *
 * @param {Object} req - Express request object
 * @param {Function} fetch - Fetch client
 * @returns {Promise<Object>} Configured Redux store
 */
async function createReduxStore(req, fetch, locale) {
  // Initialize store with user from JWT
  const store = configureStore(
    { user: req.user || null },
    { fetch, navigator, i18n },
  );

  // Set runtime variables
  store.dispatch(
    setRuntimeVariable({
      initialNow: Date.now(),
      availableLocales: AVAILABLE_LOCALES,
      appName: config.appName,
      appDescription: config.appDescription,
    }),
  );

  // Set locale from request
  await store.dispatch(setLocale(locale));

  return store;
}

/**
 * Extract HTML from dangerouslySetInnerHTML
 *
 * @param {Object} element - React element
 * @returns {string|null} HTML string or null
 */
function getInnerHTML(element) {
  if (!element || !element.props || !element.props.dangerouslySetInnerHTML) {
    return null;
  }
  // eslint-disable-next-line no-underscore-dangle
  return element.props.dangerouslySetInnerHTML.__html || null;
}

/**
 * Render React component to HTML
 *
 * @param {Object} params - Render parameters
 * @param {Object} params.context - App context (fetch, store, i18n, locale, pathname, query)
 * @param {Object} params.component - React component to render
 * @param {Object} params.metadata - Page metadata (title, description, etc.)
 * @returns {Promise<string>} Complete HTML document
 */
async function renderPageToHtml({ context, component, metadata = {} }) {
  try {
    // Create ChunkExtractor for code splitting
    const extractor = new ChunkExtractor({
      statsFile: path.resolve(__dirname, 'loadable-stats.json'),
      entrypoints: ['client'],
    });

    // Render React app with chunk collection
    const jsx = extractor.collectChunks(
      <App context={context}>{component}</App>,
    );
    const children = ReactDOM.renderToString(jsx);

    // Extract CSS and JS chunks from ChunkExtractor
    const linkElements = extractor.getLinkElements();
    const styleElements = extractor.getStyleElements();
    const scriptElements = extractor.getScriptElements();

    // Extract loadable state from inline scripts
    const inlineScripts = scriptElements.filter(
      element => element.props.dangerouslySetInnerHTML,
    );
    const namedChunksScript = inlineScripts.find(element =>
      getInnerHTML(element).includes('namedChunks'),
    );
    const requiredChunksScript = inlineScripts.find(
      element => element !== namedChunksScript,
    );

    // Prepare HTML data object for Html component
    const htmlData = {
      ...metadata,
      // Styles
      styles: styleElements.map(element => ({
        cssText: getInnerHTML(element) || '',
      })),
      styleLinks: linkElements
        .map(element => element.props.href)
        .filter(Boolean),
      // Scripts
      scripts: scriptElements
        .filter(element => element.props.src)
        .map(element => element.props.src),
      // Loadable state for client-side hydration
      loadableState: {
        requiredChunks: getInnerHTML(requiredChunksScript),
        namedChunks: getInnerHTML(namedChunksScript),
      },
      // Application state for Redux hydration
      appState: {
        reduxState: context.store.getState(),
      },
      // Rendered React content
      children,
    };

    // Render final HTML document
    const html = ReactDOM.renderToStaticMarkup(<Html {...htmlData} />);
    return `<!doctype html>${html}`;
  } catch (error) {
    // Re-throw with context
    error.path = context.pathname;
    error.message = `Page render failed: ${error.message}`;
    throw error;
  }
}

/**
 * Create page metadata object
 *
 * @param {Object} route - Route object
 * @param {Object} req - Express request object
 * @returns {Object} Page metadata
 */
function createPageMetadata(route, req) {
  return {
    title: route.title,
    description: route.description,
    image: route.image || null,
    url: `${req.protocol}://${req.get('host')}${req.path}`,
    type: route.type || 'website',
  };
}

/**
 * Start Express server listening on specified port
 *
 * @param {Object} app - Express app instance
 * @param {number} [port] - Port to listen on
 * @param {string} [host] - Host to bind to
 * @returns {Promise<Object>} HTTP server instance
 */
export function startServer(app, port = config.port, host = 'localhost') {
  return new Promise((resolve, reject) => {
    const httpServer = app.listen(port, host, error => {
      if (error) {
        reject(error);
      } else {
        console.info(`🚀 Server started at: http://${host}:${port}/`);
        console.info(
          `🌍 Environment: ${process.env.NODE_ENV || 'development'}`,
        );

        // --- Start WebSocket server ---
        // createWebSocketServer(
        //   {
        //     host,
        //     port,
        //     enableAuth: true,
        //     jwtSecret: process.env.RSK_JWT_SECRET,
        //     enableLogging: true,
        //   },
        //   httpServer,
        // );
        // console.info('🟢 WebSocket server attached to HTTP server');

        resolve(httpServer);
      }
    });
  });
}

/**
 * Initialize Express app with middleware and routes
 *
 * @param {Object} app - Express app instance
 * @param {string} staticPath - Path to static files directory
 * @returns {Promise<Object>} Configured Express app
 */
async function main(app, staticPath) {
  // Configure Express
  app.set('trust proxy', config.trustProxy);

  // Static files
  app.use(express.static(staticPath));

  // Request parsing
  app.use(cookieParser());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // Locale detection
  app.use(
    requestLanguage({
      languages: Object.keys(AVAILABLE_LOCALES),
      queryName: LOCALE_COOKIE_NAME,
      cookie: {
        name: LOCALE_COOKIE_NAME,
        options: { path: '/', maxAge: LOCALE_COOKIE_MAX_AGE * 1000 },
        url: `/${LOCALE_COOKIE_NAME}/{language}`,
      },
    }),
  );

  // API mounts itself at /api, syncs database, and sets up all middleware
  // Database sync behavior is controlled by NODE_ENV
  await require('./api').default(app, i18n);

  // This will forward all requests to /api/* to the specified backend server
  // Useful for development with separate API servers or production API routing
  setupApiProxy(app);

  // Server-side rendering (catch-all)
  app.get('*', async (req, res, next) => {
    try {
      // Create fetch client for SSR
      const fetch = createFetch(nodeFetch, {
        baseUrl: `http://localhost:${config.port}`,
        headers: { Cookie: req.headers.cookie },
      });

      // Retrieve default locale code
      const locale = req.language || DEFAULT_LOCALE;

      // Create redux store client for SSR
      const store = await createReduxStore(req, fetch, locale);

      // Create context object (used by routes and rendering)
      const context = {
        fetch,
        store,
        i18n,
        locale,
        pathname: req.path,
        query: req.query,
      };

      // Resolve route
      const route = await router.resolve(context);

      // Handle redirects
      if (route.redirect) {
        res.redirect(route.status || 302, route.redirect);
        return;
      }

      // Validate route component
      if (!route.component) {
        const error = new Error(
          `Route ${req.path} has no component. Check your route configuration.`,
        );
        error.status = 500;
        throw error;
      }

      // Render HTML
      const html = await renderPageToHtml({
        context,
        component: route.component,
        metadata: createPageMetadata(route, req),
      });

      // Send response
      res.status(route.status || 200).send(html);
    } catch (err) {
      console.error('❌ SSR Error:', err.message, 'Path:', req.path);
      if (__DEV__) console.error(err.stack);
      next(err);
    }
  });

  // Error handling middleware for non-API requests
  app.use(async (err, req, res, next) => {
    // Skip if response already sent
    if (res.headersSent) {
      return next(err);
    }

    // Get status from error or default to 500
    const status = err.status || 500;

    // Use Youch for error page rendering
    // In production, sanitize request to avoid exposing sensitive info
    const sanitizedReq = __DEV__
      ? req
      : {
          method: req.method,
          url: req.url,
          httpVersion: req.httpVersion,
          headers: {
            'content-type': req.headers['content-type'] || 'text/html',
            accept: req.headers.accept || '*/*',
          },
          connection: 'keep-alive',
          cookies: {},
        };

    const youch = new Youch(err, sanitizedReq);
    const html = await youch.toHTML();
    res.status(status).send(html);
  });

  return app;
}

if (module.hot) {
  // Development: Accept HMR updates for API
  module.hot.accept('./api');
  main.hot = module.hot;
} else {
  // Production: Initialize and start server immediately
  // This is the entry point when running the built server bundle
  main(express(), path.resolve('public')).then(app => startServer(app));
}

export default main;
