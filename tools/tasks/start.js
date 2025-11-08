#!/usr/bin/env node

/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * Copyright © 2014-present. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

// Load environment variables from .env file (development only)
require('dotenv').config();

import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import browserSync from 'browser-sync';
import express from 'express';
import errorOverlayMiddleware from 'react-dev-utils/errorOverlayMiddleware';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import config from '../config';
import { BuildError, setupGracefulShutdown } from '../lib/errorHandler';
import { isSilent, isVerbose, logError, logInfo } from '../lib/logger';
import run from '../run';
import { clientConfig, SERVER_BUNDLE_PATH, serverConfig } from '../webpack';
import clean from './clean';

// Development server configuration
// Uses environment variables loaded by dotenv above
const DEV_CONFIG = {
  port: parseInt(process.env.RSK_PORT, 10) || 3000,
  host: process.env.RSK_HOST || 'localhost',
  https: process.env.RSK_HTTPS === 'true',
  open: !isSilent() && !process.env.CI,
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
      if (!isSilent()) {
        logInfo(`🔄 Compiling '${name}'...`);
      }
    });

    compiler.hooks.done.tap(name, stats => {
      if (stats.hasErrors()) {
        const errors = stats.compilation.errors || [];
        const errorMsg = errors[0]?.message || 'Unknown compilation error';
        reject(
          new BuildError(`${name} compilation failed: ${errorMsg}`, {
            compiler: name,
            errorCount: errors.length,
          }),
        );
        return;
      }

      if (!isSilent()) {
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
 * HMR update check
 */
function checkForUpdate() {
  if (!app || !app.hot || app.hot.status() !== 'idle') {
    return Promise.resolve();
  }

  return app.hot
    .check(true)
    .then(updatedModules => {
      if (!updatedModules || updatedModules.length === 0) {
        return;
      }

      if (isVerbose()) {
        logInfo(`🔥 HMR: Updated ${updatedModules.length} module(s)`);
      }

      return checkForUpdate();
    })
    .catch(() => {
      if (app.hot && ['abort', 'fail'].includes(app.hot.status())) {
        // Reload the app
        try {
          delete require.cache[require.resolve(SERVER_BUNDLE_PATH)];
          app = require(SERVER_BUNDLE_PATH).default;
          if (isVerbose()) {
            logInfo('🔄 HMR: App reloaded');
          }
        } catch (reloadError) {
          logError(`HMR reload failed: ${reloadError.message}`);
        }
      }
    });
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
 * Setup SSR middleware that delegates to the inner app
 */
function setupSSRMiddleware(server, serverCompiler) {
  let appReady = false;

  // Mark app as not ready during compilation
  serverCompiler.hooks.compile.tap('server', () => {
    appReady = false;
  });

  // Delegate to the inner SSR app
  server.use((req, res, next) => {
    if (appReady && app && typeof app.handle === 'function') {
      app.handle(req, res, next);
    } else {
      res
        .status(503)
        .send(
          '<!DOCTYPE html>' +
            '<html><head><title>Loading...</title></head>' +
            '<body><h1>Server is compiling...</h1>' +
            '<p>Please wait a moment and refresh.</p></body></html>',
        );
    }
  });

  // Watch server compiler for changes
  serverCompiler.watch(serverConfig.watchOptions, (error, stats) => {
    if (error) {
      logError(`Server watch error: ${error.message}`);
      return;
    }

    if (stats?.hasErrors()) {
      if (isVerbose()) {
        logError(
          `Server compilation errors: ${stats.compilation.errors.length}`,
        );
      }
      return;
    }

    if (app) {
      delete require.cache[require.resolve(SERVER_BUNDLE_PATH)];
      checkForUpdate()
        .then(() => {
          appReady = true;
        })
        .catch(err => {
          logError(`HMR update failed: ${err.message}`);
          appReady = false;
        });
    }
  });

  return {
    setAppReady: () => {
      appReady = true;
    },
  };
}

/**
 * Start BrowserSync proxy server
 */
function startBrowserSync(server) {
  return new Promise((resolve, reject) => {
    const bs = browserSync.create();

    bs.init(
      {
        proxy: {
          target: `http://${DEV_CONFIG.host}:${DEV_CONFIG.port}`,
          middleware: [server],
        },
        port: DEV_CONFIG.port,
        host: DEV_CONFIG.host,
        https: DEV_CONFIG.https,
        open: DEV_CONFIG.open,
        notify: false,
        ui: false,
        logLevel: isSilent() ? 'silent' : 'info',
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
              port: DEV_CONFIG.port,
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
async function main() {
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
    await run(clean);

    // Setup Express server
    server = express();
    server.use(errorOverlayMiddleware());
    server.use(express.static(config.PUBLIC_DIR));

    // Setup webpack
    const { clientCompiler, serverCompiler } = setupWebpackCompilers();
    setupWebpackMiddleware(server, clientCompiler);
    const { setAppReady } = setupSSRMiddleware(server, serverCompiler);

    // Wait for initial compilation
    logInfo('⏳ Waiting for initial compilation...');
    await Promise.all([
      createCompilationPromise('client', clientCompiler),
      createCompilationPromise('server', serverCompiler),
    ]);
    logInfo('✅ Initial compilation completed');

    // Load SSR app
    app = require(SERVER_BUNDLE_PATH).default;
    setAppReady();

    // Start BrowserSync
    browserSyncInstance = await startBrowserSync(server);

    // Success
    const duration = Date.now() - startTime;
    logInfo(`\n🎉 Development server ready in ${Math.round(duration / 1000)}s`);
    logInfo(`   🌍 Local: http://${DEV_CONFIG.host}:${DEV_CONFIG.port}`);

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

    logError(`\n❌ ${devError.message}`);
    logError(`\n💡 Troubleshooting:`);
    logError(`   1. Check if port ${DEV_CONFIG.port} is available`);
    logError(`   2. Run: npm install`);
    logError(`   3. Run: npm run clean`);

    throw devError;
  }
}

// Mark this as a long-running task that should not auto-exit
main.keepAlive = true;

export default main;

// Execute if called directly (as child process)
if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
