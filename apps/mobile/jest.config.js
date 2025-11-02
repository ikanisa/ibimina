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
  collectCoverage: true,
  collectCoverageFrom: ["src/app.tsx", "src/providers/store.ts", "app/(tabs)/home.tsx"],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  coverageReporters: ["text", "lcov"],
};
