/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import path from 'path';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import LoadablePlugin from '@loadable/webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { merge } from 'webpack-merge';
import config from '../config';
import baseConfig, {
  createCSSRule,
  isAnalyze,
  isDebug,
  isProfile,
  verboseConfig,
} from './baseConfig.webpack';

/**
 * Configuration for the client-side bundle (client.js)
 * Targets web browsers with optimizations for production
 */
export default merge(baseConfig, {
  name: 'client',
  target: 'web',

  entry: {
    client: [path.join(config.APP_DIR, 'client.js')],
  },

  module: {
    rules: [
      // CSS handling for client bundle (extracts CSS to separate files)
      createCSSRule({
        isClient: true,
        isDebug,
        extractLoader: MiniCssExtractPlugin.loader,
      }),
    ],
  },

  plugins: [
    // Define free variables
    // https://webpack.js.org/plugins/define-plugin/
    // NODE_ENV is baked into the bundle for React optimizations
    new webpack.DefinePlugin({
      __DEV__: isDebug,
    }),

    // Loadable Components Plugin - generates loadable-stats.json for SSR
    // https://loadable-components.com/docs/api-loadable-server/
    // Write to root of BUILD_DIR so server can find it
    new LoadablePlugin({
      filename: path.resolve(config.BUILD_DIR, 'loadable-stats.json'),
      writeToDisk: true, // Write to disk even in dev mode
    }),

    // Mini CSS Extract Plugin - extracts CSS into separate files
    // https://webpack.js.org/plugins/mini-css-extract-plugin/
    new MiniCssExtractPlugin({
      filename: isDebug ? '[name].css' : '[name].[contenthash:8].css',
      chunkFilename: isDebug ? '[id].css' : '[id].[contenthash:8].css',
      // Ignore order warnings in development (CSS Modules handle scoping)
      ignoreOrder: isDebug,
    }),

    // Webpack Bundle Analyzer (production only)
    // https://github.com/webpack-contrib/webpack-bundle-analyzer
    ...(isAnalyze && !isDebug
      ? [
          new BundleAnalyzerPlugin({
            // Mode: 'static' generates HTML report, 'json' for CI, 'server' for interactive
            analyzerMode: process.env.BUNDLE_ANALYZER_MODE || 'static',

            // Report output paths
            reportFilename: config.resolvePath(
              config.BUILD_DIR,
              'reports',
              'bundle-analyzer-report.html',
            ),
            statsFilename: config.resolvePath(
              config.BUILD_DIR,
              'reports',
              'bundle-analyzer-stats.json',
            ),

            // Don't open browser automatically (can override with env var)
            openAnalyzer: process.env.BUNDLE_ANALYZER_OPEN === 'true' || false,

            // Generate JSON stats file for CI/CD integration
            generateStatsFile: true,

            // Stats options for detailed analysis
            statsOptions: {
              source: false, // Exclude source code (reduces file size)
              reasons: verboseConfig.isVerbose, // Why modules are included
              chunks: true, // Chunk information
              chunkModules: true, // Modules in each chunk
              modules: true, // Module information
              assets: true, // Asset information
              children: false, // Child compilations (not needed)
              cached: false, // Cached modules (not needed)
              cachedAssets: false, // Cached assets (not needed)
              performance: true, // Performance hints
              timings: true, // Build timing information
            },

            // Logging
            logLevel: verboseConfig.isVerbose ? 'info' : 'warn',

            // Default sizes to show
            defaultSizes: 'gzip', // Show gzipped sizes by default

            // Exclude source maps from analysis
            excludeAssets: /\.map$/,
          }),
        ]
      : []),

    // Progress plugin for build feedback
    ...(config.bundleProgressReporting && verboseConfig.isVerbose
      ? [
          new webpack.ProgressPlugin({
            activeModules: true,
            entries: true,
            modules: true,
            modulesCount: 5000,
            profile: isProfile,
            dependencies: true,
            dependenciesCount: 10000,
            percentBy: 'entries',
          }),
        ]
      : []),
  ],

  // Client-specific optimization configuration
  // https://webpack.js.org/configuration/optimization/
  optimization: {
    // Override concatenateModules with env var support
    concatenateModules:
      process.env.WEBPACK_MODULE_CONCATENATION !== 'false' && !isDebug,

    // Override usedExports with config support
    usedExports: config.bundleTreeShaking,

    // Override sideEffects with env var support
    sideEffects: process.env.WEBPACK_SIDE_EFFECTS !== 'false',

    // Extend splitChunks with maxSize (client-specific)
    splitChunks: {
      maxSize: config.bundleMaxChunkSize,
    },

    // Minification (production only) - client-specific
    minimize: config.bundleMinification && !isDebug,

    // Runtime chunk - separate webpack runtime for better caching (production only)
    runtimeChunk: !isDebug ? 'single' : false,
  },

  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  // https://webpack.js.org/configuration/node/
  // Note: In webpack 5, node option is deprecated in favor of resolve.fallback
  // Node polyfills are configured in base.js via resolve.fallback
  // In webpack 5, node option only accepts: __dirname, __filename, global
  node: {
    __dirname: false,
    __filename: false,
    global: false,
  },
});
