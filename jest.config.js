export default {
    preset: 'ts-jest',
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: { target: 'es6' } }],
    },
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
    coverageReporters: ['lcovonly', 'text', 'text-summary'],
    coverageThreshold: {
        global: {
            branches: 80, // Restored to original value
            functions: 80, // Restored to original value
            lines: 80, // Restored to original value
            statements: -10, // Original value
        },
    },
};
