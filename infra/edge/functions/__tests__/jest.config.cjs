module.exports = {
  rootDir: "./",
  testEnvironment: "node",
  testMatch: ["**/*.test.js"],
  setupFiles: [require.resolve("./setup.js")],
  verbose: false
};
