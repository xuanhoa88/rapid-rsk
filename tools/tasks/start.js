#!/usr/bin/env node

/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import browserSync from 'browser-sync';
import express from 'express';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import config from '../config';
import { BuildError, setupGracefulShutdown } from '../lib/errorHandler';
import { isSilent, isVerbose, logError, logInfo } from '../lib/logger';
import { clientConfig, SERVER_BUNDLE_PATH, serverConfig } from '../webpack';
import clean from './clean';

const silent = isSilent(); // Cache silent check

// Uses environment variables loaded by dotenv above
const DEV_CONFIG = {
  port: parseInt(process.env.RSK_PORT, 10) || 3000,
  host: process.env.RSK_HOST || 'localhost',
  https: process.env.RSK_HTTPS === 'true',
  open: !silent && !process.env.CI,
};

let server;
let browserSyncInstance;
let app;

/**
 * Create compilation promise for webpack compiler
 */
function createCompilationPromise(name, compiler) {
  return new Promise((resolve, reject) => {
    compiler.hooks.compile.tap(name, () => {
      if (!silent) {
        logInfo(`🔄 Compiling '${name}'...`);
      }
    });

    compiler.hooks.done.tap(name, stats => {
      if (stats.hasErrors()) {
        const errors = stats.compilation.errors || [];
        const errorMsg =
          errors.length > 0 && errors[0].message
            ? errors[0].message
            : 'Unknown compilation error';
        reject(
          new BuildError(`${name} compilation failed: ${errorMsg}`, {
            compiler: name,
            errorCount: errors.length,
          }),
        );
        return;
      }

      if (!silent) {
        logInfo(`✅ ${name} compiled`);
      }

      resolve(stats);
    });
  });
}

/**
 * Configure webpack config for development with HMR
 *
 * @param {Object} config - Webpack configuration object
 * @param {boolean} isClient - True for client bundle, false for server bundle
 * @returns {Object} Modified webpack config
 */
function configureWebpackForDev(config, isClient = true) {
  // 1. Replace chunkhash with hash for HMR compatibility
  // HMR requires deterministic hashes, chunkhash changes on every build
  if (config.output.filename) {
    config.output.filename = config.output.filename.replace(
      'chunkhash',
      'hash',
    );
  }
  if (config.output.chunkFilename) {
    config.output.chunkFilename = config.output.chunkFilename.replace(
      'chunkhash',
      'hash',
    );
  }

  // 2. Add HotModuleReplacementPlugin (required for both client and server)
  config.plugins.push(new webpack.HotModuleReplacementPlugin());

  // 3. Client-specific HMR configuration
  if (isClient) {
    // Add webpack-hot-middleware client to all entry points
    Object.keys(config.entry).forEach(name => {
      const entry = config.entry[name];
      // Ensure entry is an array
      config.entry[name] = Array.isArray(entry) ? entry : [entry];

      // Prepend HMR client (must be first to establish connection)
      config.entry[name] = [
        'webpack-hot-middleware/client?reload=true&overlay=true',
        ...config.entry[name],
      ];
    });

    // Add React Refresh plugin for Fast Refresh
    config.plugins.push(
      new ReactRefreshWebpackPlugin({
        overlay: { sockIntegration: 'whm' },
      }),
    );
  }
  // 4. Server-specific HMR configuration
  else {
    // Configure hot update file paths for server bundle
    config.output.hotUpdateMainFilename = 'updates/[hash].hot-update.json';
    config.output.hotUpdateChunkFilename = 'updates/[id].[hash].hot-update.js';
  }

  return config;
}

/**
 * Get server module from bundle
 * Clears require cache and loads fresh server bundle
 *
 * @returns {Object} Server module with initializeApp and startAppListening functions
 */
function getServerModule() {
  // Clear require cache to get fresh bundle
  delete require.cache[require.resolve(SERVER_BUNDLE_PATH)];

  // Load server bundle
  const serverBundle = require(SERVER_BUNDLE_PATH);

  // Return clean object with named exports
  return {
    initializeApp: serverBundle.default,
    startAppListening: serverBundle.startServer,
  };
}

/**
 * Get the hot module from require.cache
 * @returns {Object|null} Hot module or null if not available
 */
function getHotModule() {
  const serverModule = require.cache[require.resolve(SERVER_BUNDLE_PATH)];
  return serverModule && serverModule.hot ? serverModule.hot : null;
}

/**
 * Apply HMR updates or reload app on failure
 * Simple single-pass update check
 *
 * @param {Object} expressApp - Express app instance
 * @param {string} staticPath - Path to static files directory
 * @returns {Promise<void>}
 */
async function checkForUpdate(expressApp, staticPath) {
  const hot = getHotModule();

  // Skip if HMR not available or not ready
  if (!hot || hot.status() !== 'idle') {
    return;
  }

  try {
    // Apply HMR updates
    const updatedModules = await hot.check(true);

    // Log if updates were applied
    if (updatedModules && updatedModules.length > 0 && isVerbose()) {
      logInfo(`🔥 HMR: Updated ${updatedModules.length} module(s)`);
    }
  } catch (error) {
    // On HMR failure, reload entire app
    const currentHot = getHotModule();
    const status = currentHot && currentHot.status();

    if (status === 'abort' || status === 'fail') {
      logInfo('⚠️  HMR failed, reloading app...');
      try {
        const serverModule = getServerModule();
        app = await serverModule.initializeApp(expressApp, staticPath);
        logInfo('✅ App reloaded');
      } catch (reloadError) {
        logError(`App reload failed: ${reloadError.message}`);
      }
    } else if (isVerbose()) {
      logError(`HMR error: ${error.message}`);
    }
  }
}

/**
 * Setup webpack compilers and middleware
 */
function setupWebpackCompilers() {
  // Configure webpack for development with HMR
  configureWebpackForDev(clientConfig, true);
  configureWebpackForDev(serverConfig, false);

  // Create webpack compilers
  const multiCompiler = webpack([clientConfig, serverConfig]);
  const clientCompiler = multiCompiler.compilers.find(c => c.name === 'client');
  const serverCompiler = multiCompiler.compilers.find(c => c.name === 'server');

  if (!clientCompiler || !serverCompiler) {
    throw new BuildError('Failed to create webpack compilers');
  }

  return { clientCompiler, serverCompiler };
}

/**
 * Setup Express middleware for webpack
 */
function setupWebpackMiddleware(server, clientCompiler) {
  // Webpack dev middleware
  server.use(
    webpackDevMiddleware(clientCompiler, {
      publicPath: clientConfig.output.publicPath,
      stats: { colors: true, chunks: false, modules: false },
      serverSideRender: true,
    }),
  );

  // Webpack hot middleware
  server.use(
    webpackHotMiddleware(clientCompiler, {
      log: isVerbose() ? console.log : false, // eslint-disable-line no-console
      path: '/__webpack_hmr',
      heartbeat: 10 * 1000,
    }),
  );
}

/**
 * Setup SSR middleware compilation hooks
 * Note: In development, routes are set up directly by initializeApp()
 * No delegation middleware needed - server and app are the same Express instance
 */
function setupSSRMiddleware(server, serverCompiler, staticPath) {
  // Watch server compiler for changes and auto-reload app
  serverCompiler.watch(serverConfig.watchOptions, async (error, stats) => {
    if (error) {
      logError(`Server watch error: ${error.message}`);
      return;
    }

    if (stats && typeof stats.hasErrors === 'function' && stats.hasErrors()) {
      if (isVerbose()) {
        logError(
          `Server compilation errors: ${stats.compilation.errors.length}`,
        );
      }
      return;
    }

    // Compilation successful - apply HMR updates if app exists
    try {
      if (app) {
        // App exists - try HMR update
        await checkForUpdate(server, staticPath);
      }
    } catch (err) {
      logError(`HMR update failed: ${err.message}`);
    }
  });
}

/**
 * Start BrowserSync proxy server
 */
function startBrowserSync() {
  return new Promise((resolve, reject) => {
    const bs = browserSync.create();

    bs.init(
      {
        proxy: `http://${DEV_CONFIG.host}:${DEV_CONFIG.port}`,
        // Let BrowserSync auto-assign port to avoid conflicts
        host: DEV_CONFIG.host,
        https: DEV_CONFIG.https,
        open: DEV_CONFIG.open,
        notify: false,
        ui: false,
        logLevel: silent ? 'silent' : 'info',
        logPrefix: 'BS',
        files: false,
        reloadDelay: 0,
        reloadDebounce: 0,
        ghostMode: false,
        codeSync: true,
        timestamps: false,
      },
      (error, bsInstance) => {
        if (error) {
          reject(
            new BuildError(`BrowserSync failed: ${error.message}`, {
              suggestion: 'Check if port is available',
            }),
          );
        } else {
          resolve(bsInstance);
        }
      },
    );
  });
}

/**
 * Main development server function
 * This is a long-running task that keeps the process alive
 */
export default async function main() {
  if (server) {
    logInfo('Development server already running');
    return server;
  }

  const startTime = Date.now();
  logInfo('🚀 Starting development server...');

  // Setup graceful shutdown handler
  setupGracefulShutdown(() => {
    logInfo('🛑 Development server shutting down...');

    // Cleanup BrowserSync
    if (browserSyncInstance) {
      try {
        browserSyncInstance.exit();
        logInfo('   ✅ BrowserSync closed');
      } catch {
        // Ignore errors during cleanup
      }
    }

    logInfo('👋 Goodbye!');
  });

  try {
    // Clean build directory
    await clean();

    // Setup webpack compilers
    const { clientCompiler, serverCompiler } = setupWebpackCompilers();

    // Create Express server instance
    // This will be passed to the SSR app for middleware setup
    server = express();

    // Setup webpack dev middleware (HMR, hot reload)
    setupWebpackMiddleware(server, clientCompiler);
    setupSSRMiddleware(server, serverCompiler, config.PUBLIC_DIR);

    // Wait for initial webpack compilation
    logInfo('⏳ Waiting for initial compilation...');
    await Promise.all([
      createCompilationPromise('client', clientCompiler),
      createCompilationPromise('server', serverCompiler),
    ]);
    logInfo('✅ Initial compilation completed');

    // Load and initialize SSR app (after compilation)
    const serverModule = getServerModule();
    app = await serverModule.initializeApp(server, config.PUBLIC_DIR);

    // Start server listening
    await serverModule.startAppListening(
      server,
      DEV_CONFIG.port,
      DEV_CONFIG.host,
    );

    // Start BrowserSync proxy
    browserSyncInstance = await startBrowserSync();

    // Success
    const duration = Date.now() - startTime;
    logInfo(`\n🎉 Development server ready in ${Math.round(duration / 1000)}s`);

    if (isVerbose()) {
      logInfo(`   🔥 HMR, Live Reload, Error Overlay enabled`);
    }

    return server;
  } catch (error) {
    // Cleanup on error
    if (browserSyncInstance) {
      try {
        browserSyncInstance.exit();
      } catch {
        // Ignore errors during cleanup
      }
    }

    const devError =
      error instanceof BuildError
        ? error
        : new BuildError(`Development server failed: ${error.message}`);

    const errorMessage = [
      `\n❌ ${devError.message}`,
      `\n💡 Troubleshooting:`,
      `   1. Check if port ${DEV_CONFIG.port} is available`,
      `   2. Run: npm install`,
      `   3. Run: npm run clean`,
    ].join('\n');

    logError(errorMessage);

    throw devError;
  }
}

// Execute if called directly (as child process)
if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
