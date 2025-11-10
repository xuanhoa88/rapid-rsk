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
  // Disable cache to ensure all builds always use latest changes
  // Note: babel-loader in webpack already has cacheDirectory: false
  api.cache(false);

  // Environment detection - use process.env directly since cache is disabled
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const isProduction = NODE_ENV === 'production';
  const isDevelopment = NODE_ENV === 'development';
  const isTest = NODE_ENV === 'test';

  // Detect if we're in a webpack/browser build context
  // Check BABEL_CALLER_NAME since we can't use api.caller() with cache disabled
  const isWebpack = process.env.BABEL_CALLER_NAME === 'babel-loader';

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
