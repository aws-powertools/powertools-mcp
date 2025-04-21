/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        isolatedModules: true,
      },
    ],
  },
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 50,
      lines: 55,
      statements: 10
    }
  }
};
