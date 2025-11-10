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
import expressJwt, { UnauthorizedError as Jwt401Error } from 'express-jwt';
import requestLanguage from 'express-request-language';
import { ChunkExtractor } from '@loadable/server';
import nodeFetch from 'node-fetch';
import path from 'path';
import PrettyError from 'pretty-error';
import ReactDOM from 'react-dom/server';
import { configureStore, setLocale, setRuntimeVariable } from './redux';
import { apiModels, apiRoutes } from './api';
import App from './components/App';
import Html from './components/Html';
import { createFetch } from './createFetch';
import { AVAILABLE_LOCALES, getI18nInstance } from './i18n';
import * as navigator from './navigator';
import router from './routes';
import ErrorPage from './routes/error/ErrorPage';

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

// Configure global navigator for CSS tooling
global.navigator = global.navigator || {};
global.navigator.userAgent = global.navigator.userAgent || 'all';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get i18n instance for error page rendering
 */
const i18n = getI18nInstance();

/**
 * Create fetch client for SSR with localhost base URL
 * @param {Object} req - Express request
 * @returns {Function} Fetch client
 */
function createFetchClient(req) {
  return createFetch(nodeFetch, {
    baseUrl: `http://localhost:${process.env.RSK_PORT || 3000}`,
    cookie: req.headers.cookie,
  });
}

/**
 * Create enhanced error with request context and original stack
 * @param {string} message - Error message
 * @param {Error} originalError - Original error
 * @param {Object} context - Context (req, route, data)
 * @returns {Error} Enhanced error
 */
function createEnhancedError(message, originalError, context = {}) {
  const error = new Error(message);
  error.originalError = originalError;
  error.stack = originalError.stack;

  if (context.req) {
    error.path = context.req.path;
    error.method = context.req.method;
  }
  if (context.route) {
    error.route = context.route;
  }
  if (context.data) {
    error.data = {
      ...context.data,
      children: '[REDACTED]',
      appState: '[REDACTED]',
    };
  }

  return error;
}

/**
 * Create Redux store for SSR with user, runtime vars, and locale
 * @param {Object} req - Express request
 * @param {Object} fetch - Fetch client
 * @param {Object} i18n - i18next instance
 * @param {Object} availableLocales - Available locales (from AVAILABLE_LOCALES)
 * @returns {Promise<Object>} Configured store
 */
async function createReduxStore(req, fetch, i18n, availableLocales) {
  // Create store with initial user state
  const store = configureStore(
    { user: req.user || null },
    { fetch, navigator, i18n },
  );

  // Define all runtime variables
  // These are dispatched to Redux store and available at state.runtime.*
  const runtimeVariables = {
    initialNow: Date.now(), // Timestamp for SSR consistency
    availableLocales, // Available locales for language switcher (from i18n/AVAILABLE_LOCALES)
    appName: process.env.RSK_APP_NAME || 'React Starter Kit',
    appDescription:
      process.env.RSK_APP_DESCRIPTION ||
      'Boilerplate for React.js web applications',
  };

  // Dispatch all runtime variables at once
  store.dispatch(setRuntimeVariable(runtimeVariables));

  // Set locale from request
  const locale = req.language || 'en-US';
  await store.dispatch(setLocale(locale));

  return store;
}

/**
 * Extract HTML from React element's dangerouslySetInnerHTML
 * @param {Object} element - React element
 * @returns {string|null} HTML content or null
 */
function getInnerHTML(element) {
  // eslint-disable-next-line no-underscore-dangle
  return element?.props?.dangerouslySetInnerHTML?.__html || null;
}

/**
 * Render complete HTML page from React component
 * Handles React rendering, chunk extraction, and HTML template generation
 * Supports React 16+ and React 18+
 *
 * @param {Object} params - Rendering parameters
 * @param {Object} params.req - Express request
 * @param {Object} params.store - Redux store
 * @param {Object} params.fetch - Fetch client
 * @param {Object} params.i18n - i18next instance
 * @param {Object} params.component - React component to render
 * @param {Object} params.metadata - Page metadata (title, description, image, url, type)
 * @param {Object} params.errorContext - Optional error context for debugging
 * @returns {Promise<string>} Complete HTML document string
 * @throws {Error} Enhanced error if rendering fails
 */
async function renderPageToHtml({
  req,
  store,
  fetch,
  i18n,
  component,
  metadata = {},
  errorContext = {},
}) {
  try {
    // Create context for App component
    const context = {
      fetch,
      store,
      i18n,
      locale: req.language || 'en-US',
      pathname: req.path,
      query: req.query,
    };

    // Create ChunkExtractor for this request
    const statsFile = path.resolve(__dirname, 'loadable-stats.json');
    const extractor = new ChunkExtractor({
      statsFile,
      entrypoints: ['client'],
    });

    // Render React app to string with @loadable chunk collection
    const jsx = extractor.collectChunks(
      <App context={context}>{component}</App>,
    );
    const children = ReactDOM.renderToString(jsx);

    // Extract CSS and JS chunks from ChunkExtractor
    const linkElements = extractor.getLinkElements();
    const styleElements = extractor.getStyleElements();
    const scriptElements = extractor.getScriptElements();

    // Separate external scripts from inline scripts
    const externalScripts = scriptElements.filter(element => element.props.src);
    const inlineScripts = scriptElements.filter(
      element => element.props.dangerouslySetInnerHTML,
    );

    // Extract loadable state from inline scripts
    const namedChunksScript = inlineScripts.find(element => {
      const content = getInnerHTML(element);
      return content && content.includes('namedChunks');
    });

    const requiredChunksScript = inlineScripts.find(
      element =>
        element !== namedChunksScript && element.props.dangerouslySetInnerHTML,
    );

    // Prepare HTML data object for Html component
    const htmlData = {
      ...metadata,
      // Styles (no ID to hide implementation details)
      styles: styleElements.map(element => ({
        cssText: getInnerHTML(element) || '',
      })),
      styleLinks: linkElements
        .map(element => element.props.href)
        .filter(Boolean),
      // Scripts
      scripts: externalScripts
        .map(element => element.props.src)
        .filter(Boolean),
      // Loadable state for client-side hydration
      loadableState: {
        requiredChunks: getInnerHTML(requiredChunksScript),
        namedChunks: getInnerHTML(namedChunksScript),
      },
      // Application state for Redux hydration
      appState: {
        apiUrl: process.env.RSK_API_BASE_URL || '',
        reduxState: store.getState(),
      },
      // Rendered React content
      children,
    };

    // Render final HTML document
    const html = ReactDOM.renderToStaticMarkup(<Html {...htmlData} />);
    return `<!doctype html>${html}`;
  } catch (error) {
    throw createEnhancedError(
      `Page render failed for ${req.path}: ${error.message}`,
      error,
      { req, ...errorContext },
    );
  }
}

/**
 * Log performance metrics in development
 */
const logPerformance = (req, renderTime, html) => {
  if (!__DEV__) return;

  const htmlSizeKB = (html.length / 1024).toFixed(2);
  const metrics = `${renderTime}ms, HTML: ${htmlSizeKB}KB`;

  if (renderTime > 1000) {
    console.warn(`🐌 Slow render: ${req.path} (${metrics})`);
  } else if (renderTime > 500) {
    // eslint-disable-next-line no-console
    console.log(`⏱️  Render: ${req.path} (${metrics})`);
  }

  // eslint-disable-next-line no-console
  console.log(`✅ SSR complete: ${req.method} ${req.path} (${renderTime}ms)`);
};

// =============================================================================
// EXPRESS APP SETUP
// =============================================================================

const app = express();
app.set('trust proxy', process.env.RSK_TRUST_PROXY || 'loopback');

// =============================================================================
// MIDDLEWARE
// =============================================================================

app.use(express.static(path.resolve(__dirname, 'public')));
app.use(cookieParser());
app.use(
  requestLanguage({
    languages: Object.keys(AVAILABLE_LOCALES),
    queryName: 'lang',
    cookie: {
      name: 'lang',
      options: { path: '/', maxAge: 3650 * 24 * 3600 * 1000 },
      url: '/lang/{language}',
    },
  }),
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// =============================================================================
// AUTHENTICATION
// =============================================================================

app.use(
  expressJwt({
    secret: process.env.RSK_JWT_SECRET,
    credentialsRequired: false,
    getToken: req => req.cookies.id_token,
  }),
);

app.use((err, req, res, next) => {
  if (err instanceof Jwt401Error) {
    console.error('🔒 JWT auth error:', req.path);
    res.clearCookie('id_token');
  }
  next(err);
});

app.set('jwtSecret', process.env.RSK_JWT_SECRET);
app.set('jwtExpiresIn', process.env.RSK_JWT_EXPIRES_IN || '7d');

// =============================================================================
// API MIDDLEWARE
// =============================================================================
// Request flow: Local API → External API → React SSR (catch-all)

// 1. Local API routes (checked FIRST)
app.use('/api', apiRoutes);

// 2. External API proxy (checked SECOND, only if RSK_API_PROXY_URL is set)
if (process.env.RSK_API_PROXY_URL) {
  app.use(
    '/api',
    expressProxy(process.env.RSK_API_PROXY_URL, {
      // Remove /api prefix before forwarding
      // Example: /api/products → /products
      proxyReqPathResolver: req => req.url.replace(/^\/api/, ''),
    }),
  );
}

// =============================================================================
// SERVER-SIDE RENDERING
// =============================================================================
// 3. React SSR catch-all (checked LAST for all non-API routes)

app.get('*', async (req, res, next) => {
  const startTime = Date.now();

  try {
    // Create fetch client and Redux store
    const fetch = createFetchClient(req);
    const store = await createReduxStore(req, fetch, i18n, AVAILABLE_LOCALES);
    const locale = req.language || 'en-US';

    // Resolve route using IsomorphicRouter
    // The router matches the pathname against route configuration,
    // executes route actions, and returns the matched route with component
    const context = {
      fetch,
      store,
      i18n,
      locale,
      pathname: req.path,
      query: req.query,
    };

    const route = await router.resolve(context);

    // Handle redirects (e.g., authentication redirects, canonical URLs)
    if (route.redirect) {
      res.redirect(route.status || 302, route.redirect);
      return;
    }

    // Validate route has a component to render
    // This should rarely happen as the router's errorHandler catches most issues
    if (!route.component) {
      const error = new Error(
        `Route ${req.path} has no component. Check your route configuration.`,
      );
      error.status = 500;
      throw error;
    }

    // Prepare metadata for HTML rendering
    const metadata = {
      title: route.title, // Already formatted by routes/index.js root action
      description: route.description, // Already has default from routes/index.js root action
      image: route.image || null,
      url: `${req.protocol}://${req.get('host')}${req.path}`,
      type: route.type || 'website',
    };

    // Render complete HTML page
    const reactRenderStart = performance.now();
    const html = await renderPageToHtml({
      req,
      store,
      fetch,
      i18n,
      component: route.component,
      metadata,
      errorContext: { route },
    });
    const reactRenderTime = performance.now() - reactRenderStart;

    // Log slow React renders in development
    if (__DEV__ && reactRenderTime > 500) {
      const emoji = reactRenderTime > 1000 ? '🐌' : '⚠️';
      console.warn(
        `${emoji} Slow React render: ${req.path} (${reactRenderTime.toFixed(
          0,
        )}ms)`,
      );
    }
    const renderTime = Date.now() - startTime;

    // Send response
    res.status(route.status || 200);
    res.send(html);

    // Log performance
    logPerformance(req, renderTime, html);
  } catch (err) {
    console.error('❌ SSR Error:', err.message, 'Path:', req.path);
    if (__DEV__) console.error(err.stack);
    next(err);
  }
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

const pe = new PrettyError();
pe.skipNodeFiles();
pe.skipPackage('express');

app.use(async (err, req, res) => {
  // Create fetch client and Redux store
  const fetch = createFetchClient(req);
  const store = await createReduxStore(req, fetch, i18n, AVAILABLE_LOCALES);

  console.error('❌ Server Error:', err.message);
  console.error('Status:', err.status || 500, 'Path:', req.path);

  if (__DEV__) {
    console.error(pe.render(err));
  } else {
    console.error(err.stack);
  }

  // Prepare metadata for error page
  const metadata = {
    title: 'Internal Server Error',
    description: err.message,
  };

  try {
    // Render complete error page HTML
    const html = await renderPageToHtml({
      req,
      store,
      fetch,
      i18n,
      component: <ErrorPage error={err} />,
      metadata,
      errorContext: { err },
    });

    res.status(err.status || 500);
    res.send(html);
  } catch (renderError) {
    // Create enhanced error for error page rendering failure
    const enhancedError = createEnhancedError(
      `Error page render failed for ${req.path}: ${renderError.message}`,
      renderError,
      { req },
    );

    console.error('❌ Error page rendering failed:', enhancedError.message);
    console.error('Original error:', err.message);
    console.error('Render error stack:', renderError.stack);

    // Send minimal fallback HTML when error page rendering fails
    // This is the last resort - a simple, static HTML page that cannot fail
    res
      .status(500)
      .send(
        '<!doctype html>' +
          '<html lang="en">' +
          '<head>' +
          '<meta charset="utf-8">' +
          '<meta name="viewport" content="width=device-width,initial-scale=1">' +
          `<title>${metadata.title}</title>` +
          '<style>' +
          'body{font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:80px auto;padding:0 20px;line-height:1.6;color:#333}' +
          'h1{color:#d32f2f;font-size:24px;margin-bottom:16px}' +
          'p{margin:12px 0}' +
          'code{background:#f5f5f5;padding:2px 6px;border-radius:3px;font-size:14px}' +
          'a{color:#1976d2;text-decoration:none}' +
          'a:hover{text-decoration:underline}' +
          '</style>' +
          '</head>' +
          '<body>' +
          '<h1>⚠️ Internal Server Error</h1>' +
          '<p>We encountered an error while trying to display the error page.</p>' +
          '<p><strong>What happened:</strong></p>' +
          '<ul>' +
          `<li>Original error: ${err.message}</li>` +
          `<li>Error page rendering also failed</li>` +
          '</ul>' +
          '<p><strong>What you can do:</strong></p>' +
          '<ul>' +
          '<li>Try refreshing the page</li>' +
          '<li>Go back to the <a href="/">home page</a></li>' +
          '<li>Contact support if the problem persists</li>' +
          '</ul>' +
          (__DEV__
            ? `<p><strong>Developer info:</strong></p><p><code>${renderError.message}</code></p>`
            : '') +
          '</body>' +
          '</html>',
      );
  }
});

// =============================================================================
// SERVER LAUNCH
// =============================================================================

// Development: Enable HMR and export app for dev server
if (__DEV__ && module.hot) {
  app.hot = module.hot;
  module.hot.accept('./routes');
}
// Production: Start server directly
else {
  apiModels
    .syncDatabase()
    .catch(err => {
      console.error('❌ Database sync failed:', err.message);
      console.error(err.stack);
      process.exit(1);
    })
    .then(() => {
      const port = parseInt(process.env.RSK_PORT, 10) || 3000;

      app.listen(port, () => {
        console.info('🚀 Server started!');
        console.info(`📡 Server: http://localhost:${port}/`);
        console.info(
          `🌍 Environment: ${process.env.NODE_ENV || 'development'}`,
        );

        // Show API configuration
        if (process.env.RSK_API_PROXY_URL) {
          console.info(`🔀 API Proxy: ${process.env.RSK_API_PROXY_URL}`);
        }
        if (process.env.RSK_API_BASE_URL) {
          console.info(`🌐 Client API: ${process.env.RSK_API_BASE_URL}`);
        }
      });
    });
}

export default app;
