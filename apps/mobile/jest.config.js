const path = require("path");
const jestExpoPreset = require("jest-expo/jest-preset");
const testingLibraryPreset = require("@testing-library/react-native/jest-preset");

const combinedModuleNameMapper = {
  ...(testingLibraryPreset.moduleNameMapper ?? {}),
  ...jestExpoPreset.moduleNameMapper,
  "^@react-native/js-polyfills/error-guard$": "<rootDir>/jest.polyfills-mock.cjs",
  "^expo-modules-core$": "<rootDir>/jest.expo-modules-mock.cjs",
  "^expo-modules-core/src/web/index\\.web$": "<rootDir>/jest.expo-modules-web.cjs",
  "^expo$": "<rootDir>/jest.expo-mock.cjs",
  "^expo/.*$": "<rootDir>/jest.expo-mock.cjs",
  "^@/(.*)$": "<rootDir>/src/$1",
  "^@ibimina/data-access$": "<rootDir>/../../packages/data-access/src/index.ts",
  "^@ibimina/data-access/(.*)$": "<rootDir>/../../packages/data-access/src/$1",
  "^@ibimina/lib$": "<rootDir>/../../packages/lib/src/index.ts",
  "^@ibimina/lib/(.*)$": "<rootDir>/../../packages/lib/src/$1",
};

const combinedSetupFiles = [
  ...(testingLibraryPreset.setupFiles ?? []),
  ...(jestExpoPreset.setupFiles ?? []),
  "<rootDir>/jest.globals.cjs",
];

const combinedSetupFilesAfterEnv = [
  ...(testingLibraryPreset.setupFilesAfterEnv ?? []),
  ...(jestExpoPreset.setupFilesAfterEnv ?? []),
  "<rootDir>/jest.setup.js",
];

const combinedTransform = {
  ...(testingLibraryPreset.transform ?? {}),
  ...(jestExpoPreset.transform ?? {}),
  "^.+\\.[jt]sx?$": ["babel-jest", { configFile: path.resolve(__dirname, "babel.config.js") }],
};

module.exports = {
  ...testingLibraryPreset,
  ...jestExpoPreset,
  preset: "jest-expo",
  setupFiles: combinedSetupFiles,
  setupFilesAfterEnv: combinedSetupFilesAfterEnv,
  transformIgnorePatterns: [],
  moduleNameMapper: combinedModuleNameMapper,
  transform: combinedTransform,
  testMatch: ["**/__tests__/**/*.(spec|test).[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/features/auth/**/*.{ts,tsx}",
    "src/services/api/client.ts",
    "src/providers/store.ts",
  ],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "lcov", "json-summary"],
  coveragePathIgnorePatterns: ["/node_modules/", "\.stories\.(ts|tsx)$"],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
