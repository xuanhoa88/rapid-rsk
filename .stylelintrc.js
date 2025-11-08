/**
 * Stylelint configuration for React Starter Kit
 * https://stylelint.io/user-guide/configuration/
 */

// File patterns to lint
const patterns = {
  all: 'src/**/*.{css,less,styl,scss,sass,sss}',
  css: 'src/**/*.css',
  scss: 'src/**/*.scss',
  sass: 'src/**/*.sass',
};

const config = {
  extends: 'stylelint-config-standard',

  rules: {
    // Disable rules that conflict with Prettier
    'declaration-colon-newline-after': null,
    'value-list-comma-newline-after': null,

    // CSS Modules support
    'property-no-unknown': [
      true,
      {
        ignoreProperties: ['composes'],
      },
    ],
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global', 'local'],
      },
    ],
  },
};

config.patterns = patterns;
module.exports = config;
