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
import { I18nextProvider } from 'react-i18next';
import { setLocale } from './actions/intl';
import { setRuntimeVariable } from './actions/runtime';
import { apiModels } from './api';
import apiRoutes from './api/routes';
import App from './components/App';
import Html from './components/Html';
import { createFetch } from './createFetch';
import { getAvailableLocales, getI18nInstance } from './i18n';
import * as navigator from './navigator';
import router from './router';
import ErrorPage from './routes/error/ErrorPage';
import configureStore from './store/configureStore';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get i18n instance for error page rendering
 */
const i18n = getI18nInstance();

/**
 * Setup @loadable/component ChunkExtractor for CSS and JS extraction
 * Load once at startup, reuse for all requests (stats file is static after build)
 */
const statsFile = path.resolve(__dirname, 'loadable-stats.json');
const webExtractor = new ChunkExtractor({
  statsFile,
  entrypoints: ['client'],
});

/**
 * Extract CSS and JS chunks from webExtractor
 * Converts React elements to plain objects for Html component
 * @returns {Object} Object with styles, styleLinks, and scripts arrays
 */
function extractChunks() {
  const linkTags = webExtractor.getLinkElements(); // CSS <link> tags
  const styleTags = webExtractor.getStyleElements(); // Inline <style> tags
  const scriptTags = webExtractor.getScriptElements(); // JS <script> tags

  return {
    styles: styleTags.map((tag, index) => ({
      id: `loadable-style-${index}`,
      // eslint-disable-next-line no-underscore-dangle
      cssText: tag.props.dangerouslySetInnerHTML?.__html || '',
    })),
    styleLinks: linkTags.map(tag => tag.props.href),
    scripts: scriptTags.map(tag => tag.props.src).filter(Boolean),
  };
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
// EXPRESS APP SETUP
// =============================================================================

const app = express();
app.set('trust proxy', process.env.RSK_TRUST_PROXY || 'loopback');

const locales = getAvailableLocales();

// =============================================================================
// MIDDLEWARE
// =============================================================================

app.use(express.static(path.resolve(__dirname, 'public')));
app.use(cookieParser());
app.use(
  requestLanguage({
    languages: Object.keys(locales),
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

// 2. External API proxy (checked SECOND, only if RSK_API_SERVER_URL is set)
if (process.env.RSK_API_SERVER_URL) {
  app.use(
    '/api',
    expressProxy(process.env.RSK_API_SERVER_URL, {
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
    // Create fetch client
    const fetch = createFetch(nodeFetch, {
      baseUrl:
        process.env.RSK_API_SERVER_URL ||
        `http://localhost:${process.env.RSK_PORT || 3000}`,
      cookie: req.headers.cookie,
    });

    // Initialize Redux store
    const store = configureStore(
      { user: req.user || null },
      { fetch, navigator },
    );

    // Dispatch runtime variables
    store.dispatch(
      setRuntimeVariable({ name: 'initialNow', value: Date.now() }),
    );
    store.dispatch(
      setRuntimeVariable({ name: 'availableLocales', value: locales }),
    );

    const locale = req.language;
    await store.dispatch(setLocale(locale));

    // Resolve route
    const context = {
      fetch,
      store,
      i18n,
      pathname: req.path,
      query: req.query,
    };

    const route = await router.resolve(context);

    // Handle redirects
    if (route.redirect) {
      res.redirect(route.status || 302, route.redirect);
      return;
    }

    // Validate route before rendering
    if (!route.component) {
      throw new Error(
        `Route ${req.path} has no component. Check your route configuration.`,
      );
    }

    // Prepare data for HTML rendering
    const data = {
      title: route.title || 'React Starter Kit',
      description:
        route.description || 'Boilerplate for React.js web applications',
      image: route.image || null,
      url: `${req.protocol}://${req.get('host')}${req.path}`,
      type: route.type || 'website',
    };

    // Render React app to string with @loadable chunk collection
    const reactRenderStart = performance.now();
    try {
      const jsx = webExtractor.collectChunks(
        <App context={context}>{route.component}</App>,
      );
      data.children = ReactDOM.renderToString(jsx);
    } catch (renderError) {
      // Preserve original error stack and add context
      const error = new Error(
        `React render failed for ${req.path}: ${renderError.message}`,
      );
      error.originalError = renderError;
      error.stack = renderError.stack;
      error.path = req.path;
      error.route = route;
      throw error;
    }
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

    // Extract CSS and JS chunks using @loadable/server
    const chunks = extractChunks();
    data.styles = chunks.styles;
    data.styleLinks = chunks.styleLinks;
    data.scripts = chunks.scripts;

    // Serialize app state
    data.app = {
      apiUrl: process.env.RSK_API_CLIENT_URL || '',
      state: store.getState(),
      lang: locale,
    };

    // Render HTML template
    let html;
    try {
      html = ReactDOM.renderToStaticMarkup(<Html {...data} />);
    } catch (htmlError) {
      // Preserve original error stack and add context
      const error = new Error(
        `HTML template render failed for ${req.path}: ${htmlError.message}`,
      );
      error.originalError = htmlError;
      error.stack = htmlError.stack;
      error.path = req.path;
      error.data = { ...data, app: '[REDACTED]' }; // Don't log full state
      throw error;
    }
    const renderTime = Date.now() - startTime;

    // Send response
    res.status(route.status || 200);
    res.send(`<!doctype html>${html}`);

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

app.use((err, req, res) => {
  console.error('❌ Server Error:', err.message);
  console.error('Status:', err.status || 500, 'Path:', req.path);

  if (__DEV__) {
    console.error(pe.render(err));
  } else {
    console.error(err.stack);
  }

  const locale = req.language || 'en-US';

  try {
    // Render error page with @loadable chunk collection
    const jsx = webExtractor.collectChunks(
      <I18nextProvider i18n={i18n}>
        <ErrorPage error={err} />
      </I18nextProvider>,
    );
    const errorContent = ReactDOM.renderToString(jsx);

    // Extract CSS and JS chunks
    const chunks = extractChunks();

    // Prepare data for Html component
    const data = {
      title: 'Internal Server Error',
      description: err.message,
      ...chunks,
      app: {
        apiUrl: process.env.RSK_API_CLIENT_URL || '',
      },
      children: errorContent,
      lang: locale,
    };

    const html = ReactDOM.renderToStaticMarkup(<Html {...data} />);

    res.status(err.status || 500);
    res.send(`<!doctype html>${html}`);
  } catch (renderError) {
    console.error('❌ Error page rendering failed:', renderError.message);
    res
      .status(500)
      .send(
        '<!doctype html><html><head><title>Error</title></head>' +
          '<body><h1>Internal Server Error</h1>' +
          '<p>An error occurred while processing your request.</p></body></html>',
      );
  }
});

// =============================================================================
// SERVER LAUNCH
// =============================================================================

// Development: Enable HMR and export app for dev server
if (__DEV__ && module.hot) {
  app.hot = module.hot;
  module.hot.accept('./router');
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
      const apiUrl =
        process.env.RSK_API_SERVER_URL || `http://localhost:${port}`;

      app.listen(port, () => {
        console.info('🚀 Server started!');
        console.info(`📡 http://localhost:${port}/`);
        console.info(
          `🌍 Environment: ${process.env.NODE_ENV || 'development'}`,
        );
        console.info(`🔧 API: ${apiUrl}`);
      });
    });
}

export default app;
