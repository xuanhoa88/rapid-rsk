/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

// Babel configuration
// https://babeljs.io/docs/usage/api/
// https://babeljs.io/docs/config-files#apicache

module.exports = api => {
  // Cache based on NODE_ENV for better performance
  api.cache.using(() => process.env.NODE_ENV);

  // Environment detection
  const isProduction = api.env('production');
  const isDevelopment = api.env('development');
  const isTest = api.env('test');

  // Detect if we're in a webpack/browser build context
  // webpack-loader sets caller.name to 'babel-loader'
  const isWebpack = api.caller(caller => caller && caller.name === 'babel-loader');

  return {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: isWebpack
          ? {
              browsers: ['last 2 versions', 'safari >= 7'],
            }
          : {
              node: 'current',
            },
        modules: isWebpack ? false : 'commonjs',
        useBuiltIns: isWebpack ? 'usage' : false,
        corejs: isWebpack ? 3 : false,
      },
    ],
    '@babel/preset-flow',
    [
      '@babel/preset-react',
      {
        development: isDevelopment || isTest,
        runtime: 'automatic',
      },
    ],
  ],

  plugins: [
    // React Fast Refresh (development only, and only for webpack/browser builds)
    ...(isDevelopment && isWebpack ? ['react-refresh/babel'] : []),

    // Loadable Components (for code splitting with SSR)
    '@loadable/babel-plugin',

    // Class properties (for React class components and modern JS)
    ['@babel/plugin-transform-class-properties', { loose: true }],

    // Dynamic imports (for code splitting) - syntax only for Node.js
    ...(isWebpack ? [] : ['@babel/plugin-syntax-dynamic-import']),

    // Modern JavaScript features
    '@babel/plugin-transform-export-namespace-from',
    '@babel/plugin-transform-json-strings',
    '@babel/plugin-transform-numeric-separator',

    // Optional chaining and nullish coalescing
    '@babel/plugin-transform-optional-chaining',
    '@babel/plugin-transform-nullish-coalescing-operator',

    // Object rest/spread
    '@babel/plugin-transform-object-rest-spread',

    // Private property in object (to match loose mode)
    ['@babel/plugin-transform-private-property-in-object', { loose: true }],

    // Private methods (to match loose mode)
    ['@babel/plugin-transform-private-methods', { loose: true }],

    // Production optimizations (only in production)
    ...(isProduction
      ? [
          '@babel/plugin-transform-react-constant-elements',
          '@babel/plugin-transform-react-inline-elements',
          'babel-plugin-transform-react-remove-prop-types',
        ]
      : []),
  ],
  };
};
