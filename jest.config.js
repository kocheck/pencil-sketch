module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^sketch$': '<rootDir>/__mocks__/sketch.ts',
    '^sketch/(.*)$': '<rootDir>/__mocks__/sketch.ts',
  },
}
