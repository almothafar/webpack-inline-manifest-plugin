'use strict';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  // webpack production builds can take a few seconds, especially on CI.
  testTimeout: 30000,
  collectCoverageFrom: ['index.js'],
};
