const shared = require('../../jest.config.shared');

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  ...shared,
  coverageThreshold: {
    global: {
      statements: 52,
      branches: 43,
      functions: 57,
      lines: 54,
    },
  },
};
