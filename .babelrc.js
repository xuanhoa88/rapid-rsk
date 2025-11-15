/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

module.exports = api => {
  // ---- Caching ----
  api.cache.never();

  // ---- Environment ----
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const isProduction = NODE_ENV === 'production';
  const isDevelopment = NODE_ENV === 'development';
  const isTest = NODE_ENV === 'test';

  // ---- Export Config ----
  return {
    targets: 'defaults',

    presets: [
      [
        '@babel/preset-env',
        {
          targets: { node: 'current' },
          modules: 'commonjs',
          useBuiltIns: 'usage',
          corejs: 3,
        },
      ],
      [
        '@babel/preset-react',
        {
          development: isDevelopment || isTest,
          runtime: 'automatic',
        },
      ],
    ],

    plugins: [
      //
      // 📦 Code Splitting / SSR
      //
      '@loadable/babel-plugin',

      //
      // ⚙ Class fields & private methods
      //
      ['@babel/plugin-transform-class-properties', { loose: true }],
      ['@babel/plugin-transform-private-methods', { loose: true }],
      ['@babel/plugin-transform-private-property-in-object', { loose: true }],

      //
      // 📘 Syntax features
      //
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-transform-export-namespace-from',
      '@babel/plugin-transform-json-strings',
      '@babel/plugin-transform-numeric-separator',
      '@babel/plugin-transform-optional-chaining',
      '@babel/plugin-transform-nullish-coalescing-operator',
      '@babel/plugin-transform-object-rest-spread',

      //
      // 🚀 Production-only optimizations
      //
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
