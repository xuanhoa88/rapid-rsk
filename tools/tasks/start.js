#!/usr/bin/env node

/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import WebSocket from 'ws';
import express from 'express';
import webpack from 'webpack';
import open from 'open';
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

let app, hmr;
let browserProcess = null;

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
        logInfo(`✅ '${name}' compiled`);
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
        'webpack-hot-middleware/client?path=/~/__webpack_hmr&&reload=true&overlay=true',
        ...config.entry[name],
      ];
    });
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
 * @returns {Object} Server module
 */
function getServerModule() {
  // Clear require cache to get fresh bundle
  delete require.cache[require.resolve(SERVER_BUNDLE_PATH)];

  // Load server bundle
  const serverBundle = require(SERVER_BUNDLE_PATH);

  // Get the hot module
  hmr = serverBundle.default.hot;

  // Return clean object with named exports
  return {
    initializeApp: serverBundle.default,
    startAppListening: serverBundle.startServer,
  };
}

/**
 * Apply HMR updates or reload app on failure
 * Simple single-pass update check
 *
 * @returns {Promise<void>}
 */
async function checkForUpdate() {
  try {
    // Skip if HMR not available or not ready
    if (!hmr || hmr.status() !== 'idle') {
      return;
    }

    // Apply HMR updates
    const updatedModules = await hmr.check(true);

    // Log if updates were applied
    if (updatedModules && updatedModules.length > 0 && isVerbose()) {
      logInfo(`🔥 HMR: Updated ${updatedModules.length} module(s)`);
    }

    console.log({ updatedModules });
  } catch (error) {
    // On HMR failure, log the error
    const status = hmr ? hmr.status() : 'no-hmr';
    logError(`HMR update failed (status: ${status}): ${error.message}`);

    // If the error is severe, consider a full reload
    if (status === 'abort' || status === 'fail') {
      logInfo(
        '⚠️  HMR in bad state, consider restarting the development server',
      );
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
function setupWebpackMiddleware(clientCompiler) {
  // Webpack dev middleware
  app.use(
    webpackDevMiddleware(clientCompiler, {
      publicPath: clientConfig.output.publicPath,
      stats: { colors: true, chunks: false, modules: false },
      serverSideRender: true,
    }),
  );

  // Webpack hot middleware
  app.use(
    webpackHotMiddleware(clientCompiler, {
      log: isVerbose() ? console.log : false, // eslint-disable-line no-console
      path: '/~/__webpack_hmr',
      heartbeat: 10 * 1000,
    }),
  );
}

/**
 * Setup SSR middleware compilation hooks
 */
function setupSSRMiddleware(serverCompiler) {
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

    // Compilation successful
    await checkForUpdate();
  });
}

/**
 * Open the default browser to the dev server URL.
 */
async function openBrowser() {
  try {
    const proc = await open(`http://${DEV_CONFIG.host}:${DEV_CONFIG.port}`);
    if (proc && typeof proc.kill === 'function') {
      browserProcess = proc;
      console.log('Opened browser (PID:', proc.pid, ')');
    } else {
      browserProcess = null;
      console.log('Opened browser (no process handle available)');
    }
  } catch (error) {
    throw new BuildError(`Failed to open browser: ${error.message}`, {
      suggestion: 'Check if your system can launch a browser from the CLI.',
    });
  }
}

/**
 * Close the browser process.
 */
function closeBrowser() {
  if (
    browserProcess &&
    typeof browserProcess.kill === 'function' &&
    !browserProcess.killed
  ) {
    try {
      browserProcess.kill('SIGTERM');
      console.log(
        'Closed browser (SIGTERM sent to PID:',
        browserProcess.pid,
        ')',
      );
    } catch (err) {
      console.warn('Failed to close browser process:', err.message);
    }
  } else {
    console.log('No browser process to close or process handle not available.');
  }
}

/**
 * Main development server function
 * This is a long-running task that keeps the process alive
 */
export default async function main() {
  if (app) {
    logInfo('Development server already running');
    return app;
  }

  const startTime = Date.now();
  logInfo('🚀 Starting development server...');

  // Heartbeat WebSocket for dev tab auto-close
  let heartbeatWSS = null;

  // Setup graceful shutdown handler
  setupGracefulShutdown(async () => {
    logInfo('🛑 Development server shutting down...');

    // Cleanup Browser
    closeBrowser();

    // Cleanup heartbeat WebSocket
    if (heartbeatWSS) {
      await new Promise(resolve => heartbeatWSS.close(resolve));
      logInfo('Heartbeat WebSocket closed.');
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
    app = express();

    app.use((req, res, next) => {
      // Override default res.send()
      const originalSend = res.send.bind(res);

      // UX improvement: Show overlay message on dev server disconnect instead of closing window
      res.send = html => {
        if (typeof html === 'string' && html.includes('</body>')) {
          const injected = html.replace(
            '</body>',
            `
<script>
(function () {
  try {
    var ws = new WebSocket("ws://${DEV_CONFIG.host}:${DEV_CONFIG.port}/~/__bs");
    ws.onclose = () => window.close();
    ws.onerror = () => window.close();
  } catch (e) {
    window.close();
  }
})();
</script>
      </body>`,
          );
          return originalSend(injected);
        }
        return originalSend(html);
      };

      next();
    });

    // Setup webpack dev middleware (HMR, hot reload)
    setupWebpackMiddleware(clientCompiler);
    setupSSRMiddleware(serverCompiler);

    // Wait for initial webpack compilation
    logInfo('⏳ Waiting for initial compilation...');
    await Promise.all([
      createCompilationPromise('client', clientCompiler),
      createCompilationPromise('server', serverCompiler),
    ]);
    logInfo('✅ Initial compilation completed');

    // Load and initialize SSR app (after compilation)
    const serverModule = getServerModule();
    await serverModule.initializeApp(app, config.PUBLIC_DIR);

    // Start server listening
    const server = await serverModule.startAppListening(
      app,
      DEV_CONFIG.port,
      DEV_CONFIG.host,
    );

    // Create WebSocket server for dev tab auto-close
    try {
      heartbeatWSS = new WebSocket.Server({ server, path: '/~/__bs' });
    } catch (wsErr) {
      throw new BuildError(
        `Failed to create Tab auto-close server: ${wsErr.message}`,
        {
          suggestion:
            'The WebSocket port might be in use. Try a different port or close the conflicting process.',
        },
      );
    }

    // Handle WebSocket server runtime errors
    heartbeatWSS.on('error', err => {
      throw new BuildError(`Tab auto-close server error: ${err.message}`, {
        suggestion: 'Check for network issues or port conflicts.',
      });
    });

    // Open browser for dev server
    await openBrowser();

    // Success
    const duration = Date.now() - startTime;
    logInfo(`\n🎉 Development server ready in ${Math.round(duration / 1000)}s`);

    if (isVerbose()) {
      logInfo(`   🔥 HMR, Live Reload, Error Overlay enabled`);
    }

    return app;
  } catch (error) {
    // Cleanup on error
    closeBrowser();

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
