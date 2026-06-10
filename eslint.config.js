'use strict';

const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  {
    // Fixtures are ES modules bundled by webpack, not CommonJS.
    files: ['test/fixtures/**/*.js'],
    languageOptions: {
      sourceType: 'module',
    },
  },
  // Disable stylistic rules that conflict with Prettier (keep this last).
  prettier,
];
