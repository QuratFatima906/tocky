process.env.TZ = 'America/New_York';

module.exports = {
  preset: 'jest-expo',
  resolver: 'react-native-worklets/jest/resolver.js',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/design-source/', '/.maestro/'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/design-system/theme/useAppFonts.ts',
    '!src/test/**',
    '!src/**/types.ts',
    '!src/**/scheme.ts',
  ],
  coverageThreshold: {
    global: { statements: 90, branches: 80, functions: 90, lines: 90 },
    './src/design-system/tokens/': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};
