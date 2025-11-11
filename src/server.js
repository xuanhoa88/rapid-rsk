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
import {
  expressjwt as expressJwt,
  UnauthorizedError as Jwt401Error,
} from 'express-jwt';
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
import { apiModels, apiRoutes } from './api';
import App from './components/App';
import Html from './components/Html';
import { createFetch } from './createFetch';
import { AVAILABLE_LOCALES, getI18nInstance } from './i18n';
import * as navigator from './navigator';
import router from './routes';

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
const config = {
  port: parseInt(process.env.RSK_PORT, 10) || 3000,
  jwtSecret: process.env.RSK_JWT_SECRET,
  jwtExpiresIn: process.env.RSK_JWT_EXPIRES_IN || '7d',
  trustProxy: process.env.RSK_TRUST_PROXY || 'loopback',
  apiProxyUrl: process.env.RSK_API_PROXY_URL,
  apiBaseUrl: process.env.RSK_API_BASE_URL || '',
  appName: process.env.RSK_APP_NAME || 'React Starter Kit',
  appDescription:
    process.env.RSK_APP_DESCRIPTION ||
    'Boilerplate for React.js web applications',
};

// i18n instance
const i18n = getI18nInstance();

/**
 * Create fetch client for SSR
 *
 * @param {Object} req - Express request object
 * @returns {Function} Configured fetch client
 */
function createFetchClient(req) {
  return createFetch(nodeFetch, {
    baseUrl: `http://localhost:${config.port}`,
    cookie: req.headers.cookie,
  });
}

/**
 * Create Redux store for SSR
 *
 * @param {Object} req - Express request object
 * @param {Function} fetch - Fetch client
 * @returns {Promise<Object>} Configured Redux store
 */
async function createReduxStore(req, fetch) {
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
  await store.dispatch(setLocale(req.language || 'en-US'));

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
        apiUrl: config.apiBaseUrl,
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
        console.info('🚀 Server started!');
        console.info(`📡 Server: http://${host}:${port}/`);
        console.info(
          `🌍 Environment: ${process.env.NODE_ENV || 'development'}`,
        );

        // Show API configuration
        if (config.apiProxyUrl) {
          console.info(`🔀 API Proxy: ${config.apiProxyUrl}`);
        }
        if (config.apiBaseUrl) {
          console.info(`🌐 Client API: ${config.apiBaseUrl}`);
        }

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
  // Validate required environment variables
  if (!config.jwtSecret) {
    throw new Error(
      'RSK_JWT_SECRET environment variable is required. Generate one with: openssl rand -base64 32',
    );
  }

  // Configure Express
  app.set('trust proxy', config.trustProxy);
  app.set('jwtSecret', config.jwtSecret);
  app.set('jwtExpiresIn', config.jwtExpiresIn);

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

  // JWT authentication
  app.use(
    expressJwt({
      secret: config.jwtSecret,
      algorithms: ['HS256'],
      credentialsRequired: false,
      getToken: req => req.cookies.id_token,
    }),
  );

  // API routes (local first, then proxy if configured)
  app.use('/api', apiRoutes);

  if (config.apiProxyUrl) {
    app.use(
      '/api',
      expressProxy(config.apiProxyUrl, {
        // Remove /api prefix before forwarding
        // Example: /api/products → /products
        proxyReqPathResolver: req => req.url.replace(/^\/api/, ''),
      }),
    );
  }

  // Server-side rendering (catch-all)
  app.get('*', async (req, res, next) => {
    try {
      // Initialize request context
      const fetch = createFetchClient(req);
      const store = await createReduxStore(req, fetch);

      // Create context object (used by routes and rendering)
      const context = {
        fetch,
        store,
        i18n,
        locale: req.language || 'en-US',
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

  // Error handling middleware
  app.use(async (err, req, res, next) => {
    // Skip if response already sent
    if (res.headersSent) {
      return next(err);
    }

    const status = err.status || 500;

    // Handle JWT authentication errors - clear cookie and set proper status
    if (err instanceof Jwt401Error) {
      res.clearCookie('id_token');
      err.status = 401;
    }

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

  // Sync database before accepting requests
  try {
    await apiModels.syncDatabase({}, !!__DEV__);
  } catch (err) {
    console.error('❌ Database sync failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }

  return app;
}

/**
 * Handle different execution modes:
 *
 * 1. Development Mode (with HMR):
 *    - module.hot is available (webpack HMR enabled)
 *    - Accept hot updates for the routes module
 *    - Server is started by `npm start`
 *    - This allows routes to be hot-reloaded without restarting the server
 *
 * 2. Production Mode (or standalone execution):
 *    - module.hot is undefined (no webpack HMR)
 *    - Initialize Express app and start server immediately
 *    - Used when running: node build/server.js
 *    - Creates a new Express instance and serves from 'public' directory
 */
if (module.hot) {
  // Development: Accept HMR updates for routes
  // When routes change, webpack will hot-reload them without restarting the server
  module.hot.accept('./routes');
} else {
  // Production: Initialize and start server immediately
  // This is the entry point when running the built server bundle
  main(express(), path.resolve('public')).then(app =>
    startServer(app, config.port),
  );
}

export default main;
