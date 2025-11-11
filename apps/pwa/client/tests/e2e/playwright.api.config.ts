import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./",
  testMatch: [
    "agent-chat-api.spec.ts",
    "loan-applications-api.spec.ts",
    "contribution-submission-api.spec.ts",
  ],
  reporter: "list",
  projects: [
    {
      name: "api",
      use: {},
    },
  ],
});
