module.exports = {
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverage: false,
  setupFilesAfterEnv: ['./__tests__/setup.js'],
  testTimeout: 30000,
};
