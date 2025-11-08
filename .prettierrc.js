/**
 * Prettier configuration for React Starter Kit
 * https://prettier.io/docs/en/configuration.html
 */

// File patterns to format
const patterns = {
  all: '**/*.{js,jsx,json,css,md}',
  code: '**/*.{js,jsx}',
  styles: '**/*.css',
  config: '**/*.{json,md}',
};

const config = {
  // Line wrapping
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,

  // Quotes and punctuation
  singleQuote: true,
  trailingComma: 'all',
  semi: true,

  // Spacing
  bracketSpacing: true,
  arrowParens: 'avoid',

  // JSX
  jsxSingleQuote: true,

  // Line endings
  endOfLine: 'lf',
};

config.patterns = patterns;
module.exports = config;
