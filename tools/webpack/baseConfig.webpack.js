/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * Copyright © 2014-present. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import config from '../config';
import { getVerboseConfig } from '../lib/logger';

/** Get file naming pattern based on environment */
const getFileNamePattern = (isDebug, hashType = 'hash') =>
  isDebug ? '[path][name].[ext]' : `[${hashType}:8].[ext]`;

// =============================================================================
// ENVIRONMENT & MODE CONFIGURATION
// =============================================================================

export const isDebug = process.env.NODE_ENV !== 'production';

// Get verbose configuration once and reuse throughout
export const verboseConfig = getVerboseConfig();

export const isAnalyze =
  process.argv.includes('--analyze') ||
  process.argv.includes('--analyse') ||
  config.bundleAnalyze;

export const isProfile =
  process.argv.includes('--profile') || config.bundleProfile;

// =============================================================================
// REGEX PATTERNS
// =============================================================================

export const reScript = /\.(js|jsx|mjs)$/i;
export const reStyle = /\.(css|less|styl|scss|sass|sss)$/i;
export const reImage = /\.(?:ico|gif|png|jpg|jpeg|webp)(\?v=\d+\.\d+\.\d+)?$/i;
export const reFont = /\.(woff|woff2|eot|ttf|otf)(\?v=\d+\.\d+\.\d+)?$/i;
export const reSvg = /\.svg$/i;
export const reHtml = /\.html$/i;
export const reMarkdown = /\.(md|markdown)$/i;
export const reText = /\.txt$/i;

// =============================================================================
// COMMON WEBPACK CONFIGURATION
// =============================================================================

/**
 * Common configuration chunk to be used for both
 * client-side (client.js) and server-side (server.js) bundles
 */
export default {
  mode: isDebug ? 'development' : 'production',

  output: {
    path: config.resolvePath(config.BUILD_DIR, 'public', 'assets'),
    publicPath: process.env.WEBPACK_PUBLIC_PATH || '/assets/',
    filename: isDebug ? '[name].js' : '[name].[chunkhash:8].js',
    chunkFilename: isDebug
      ? '[name].chunk.js'
      : '[name].[chunkhash:8].chunk.js',
  },

  resolve: {
    // Allow absolute paths in imports, e.g. import Button from 'components/Button'
    // Keep in sync .eslintrc
    modules: [config.NODE_MODULES_DIR, config.APP_DIR],

    // Webpack 5 polyfills configuration
    // https://webpack.js.org/configuration/resolve/#resolvefallback
    fallback: {
      fs: false,
      net: false,
      tls: false,
    },

    extensions: ['.js', '.jsx', '.json'],
  },

  module: {
    // Make missing exports an error instead of warning
    strictExportPresence: true,

    rules: [
      // Rules for JS / JSX
      {
        test: reScript,
        include: [config.APP_DIR, config.resolvePath('tools')],
        use: [
          {
            loader: 'babel-loader',
            options: {
              // Disable caching to ensure fresh builds
              cacheDirectory: false,

              // Use .babelrc.js for all Babel configuration
              // This provides:
              // - Modern JavaScript features (optional chaining, nullish coalescing, etc.)
              // - Production optimizations (constant elements, inline elements, remove prop-types)
              // - Automatic polyfills via useBuiltIns: 'usage' with core-js 3
              // - React Fast Refresh in development
              // - All necessary plugins for modern React development
              babelrc: true,
              configFile: true,

              // Set BABEL_ENV to 'webpack' so .babelrc.js uses browser targets
              envName: 'webpack',
            },
          },
        ],
      },

      // Rules for Style Sheets
      {
        test: reStyle,
        rules: [
          // Convert CSS into JS module for SSR
          {
            issuer: { not: [reStyle] },
            use: 'isomorphic-style-loader',
          },

          // Process CSS with css-loader
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1, // Apply postcss-loader to @import statements
              sourceMap: config.bundleSourceMaps,
              esModule: false, // Required for isomorphic-style-loader compatibility
              modules: {
                // Enable CSS Modules only for files in src/ directory
                // Third-party styles (node_modules) remain global
                auto: resourcePath => resourcePath.includes(config.APP_DIR),
                localIdentName: isDebug
                  ? '[name]-[local]-[hash:base64:5]'
                  : '[hash:base64:5]',
              },
            },
          },

          // Apply PostCSS plugins (autoprefixer, etc.)
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: config.bundleSourceMaps,
              postcssOptions: {
                config: config.resolvePath('tools', 'postcss.config.js'),
              },
            },
          },
        ],
      },

      // Rules for images (using webpack 5 Asset Modules)
      {
        test: reImage,
        oneOf: [
          // Inline lightweight images into CSS
          {
            issuer: reStyle,
            type: 'asset',
            parser: {
              dataUrlCondition: {
                maxSize: 4096, // 4kb - inline if smaller
              },
            },
            generator: {
              filename: getFileNamePattern(isDebug),
            },
          },

          // Or return public URL to image resource
          {
            type: 'asset/resource',
            generator: {
              filename: getFileNamePattern(isDebug),
            },
          },
        ],
      },

      // Rules for fonts (using webpack 5 Asset Modules)
      {
        test: reFont,
        type: 'asset/resource',
        generator: {
          filename: getFileNamePattern(isDebug),
        },
      },

      // Rules for SVG files - import as React components or URLs
      {
        test: reSvg,
        oneOf: [
          // Import as React component: import { ReactComponent as Icon } from './icon.svg'
          // or default import: import Icon from './icon.svg'
          {
            issuer: /\.[jt]sx?$/i,
            resourceQuery: { not: [/url/i] }, // Exclude *.svg?url
            use: [
              {
                loader: '@svgr/webpack',
                options: {
                  svgo: true,
                  svgoConfig: {
                    plugins: [
                      {
                        name: 'preset-default',
                        params: {
                          overrides: {
                            removeViewBox: false,
                            cleanupIds: false,
                          },
                        },
                      },
                    ],
                  },
                  titleProp: true,
                  ref: true,
                },
              },
            ],
          },
          // Import as URL: import iconUrl from './icon.svg?url'
          // or from CSS files
          {
            type: 'asset',
            parser: {
              dataUrlCondition: {
                maxSize: 8192, // 8kb - inline if smaller
              },
            },
            generator: {
              filename: getFileNamePattern(isDebug),
            },
          },
        ],
      },

      // Rules for HTML files (emit as separate files)
      {
        test: reHtml,
        type: 'asset/resource',
        generator: {
          filename: getFileNamePattern(isDebug),
        },
      },

      // Rules for Markdown files (return source as string)
      {
        test: reMarkdown,
        type: 'asset/source',
      },

      // Rules for text files (return source as string)
      {
        test: reText,
        type: 'asset/source',
      },

      // Return public URL for all other assets
      {
        exclude: [
          reScript,
          reStyle,
          reImage,
          reFont,
          reSvg,
          reHtml,
          reMarkdown,
          reText,
          /\.json$/i,
        ],
        type: 'asset/resource',
        generator: {
          filename: getFileNamePattern(isDebug),
        },
      },
    ],
  },

  // Common optimization configuration
  // Specific configs (client/server) can override or extend these
  optimization: {
    // Scope hoisting - concatenate modules for smaller bundles (production only)
    concatenateModules: !isDebug,

    // Tree shaking - remove unused exports
    usedExports: true,
    sideEffects: true,

    // Code splitting - split vendors and common code into separate chunks
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendors: all node_modules
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 20,
          reuseExistingChunk: true,
        },
        // Common: shared code (used in 2+ places)
        common: {
          minChunks: 2,
          name: 'common',
          priority: 10,
          reuseExistingChunk: true,
        },
      },
    },

    // Stable module/chunk IDs for better caching
    moduleIds: isDebug ? 'named' : 'deterministic',
    chunkIds: isDebug ? 'named' : 'deterministic',
  },

  // Don't attempt to continue if there are any errors.
  bail: !isDebug,

  // Webpack 5 filesystem cache for faster rebuilds
  cache: false,

  // Stats output configuration
  stats: {
    preset: verboseConfig.isVerbose ? 'normal' : 'errors-warnings',
    colors: true,
    // Show timing information
    timings: true,
    // Show built modules
    modules: verboseConfig.isVerbose,
    // Show chunk information
    chunks: verboseConfig.isDebug,
    // Show asset information
    assets: verboseConfig.isVerbose,
    // Show reasons for including modules
    reasons: verboseConfig.isDebug,
    // Show performance hints
    performance: !isDebug,
  },

  // Webpack 5 infrastructure logging
  infrastructureLogging: {
    level: verboseConfig.isVerbose ? 'info' : 'warn',
  },

  // Watch mode configuration
  watchOptions: {
    ignored: ['**/node_modules', '**/.git'],
  },

  // Performance hints
  performance:
    config.bundlePerformanceHints && !isDebug
      ? {
          maxAssetSize: config.bundleMaxAssetSize,
          maxEntrypointSize: config.bundleMaxEntrypointSize,
          hints: 'warning',
          assetFilter: assetFilename => /\.(js|css)$/.test(assetFilename),
        }
      : false,

  // Choose a developer tool to enhance debugging
  // https://webpack.js.org/configuration/devtool/
  devtool: config.bundleSourceMaps
    ? process.env.WEBPACK_DEVTOOL ||
      (isDebug ? 'eval-cheap-module-source-map' : 'source-map')
    : false,
};
