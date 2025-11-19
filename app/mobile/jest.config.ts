import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleNameMapper: {
    "^@theme/(.*)$": "<rootDir>/src/theme/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@screens/(.*)$": "<rootDir>/src/screens/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
};

export default config;
