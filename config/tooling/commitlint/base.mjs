export const baseCommitlintConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [2, "always", ["admin", "client", "mobile", "platform-api", "supabase", "docs"]],
    "scope-empty": [2, "never"],
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
      ],
    ],
    "subject-case": [2, "never", ["pascal-case", "upper-case"]],
    "header-max-length": [2, "always", 100],
  },
};
