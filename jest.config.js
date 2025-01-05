module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.js'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/__tests__/'
    ],
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
    testTimeout: 10000
}; 