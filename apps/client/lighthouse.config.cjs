/**
 * Lighthouse configuration for Ibimina Client PWA.
 * The CI pipeline consumes this file to enforce web-vitals and
 * payload budgets under simulated mobile network conditions.
 */
module.exports = {
  extends: "lighthouse:default",
  settings: {
    formFactor: "mobile",
    screenEmulation: {
      mobile: true,
      width: 360,
      height: 640,
      deviceScaleFactor: 3,
      disabled: false,
    },
    throttlingMethod: "simulate",
    throttling: {
      cpuSlowdownMultiplier: 4,
      downloadThroughputKbps: 1500,
      uploadThroughputKbps: 750,
      rttMs: 150,
    },
    budgets: [
      {
        path: "/",
        resourceSizes: [
          {
            resourceType: "script",
            budget: 275,
          },
          {
            resourceType: "total",
            budget: 1100,
          },
        ],
        timings: [
          {
            metric: "largest-contentful-paint",
            budget: 2500,
          },
          {
            metric: "experimental-interaction-to-next-paint",
            budget: 200,
          },
          {
            metric: "cumulative-layout-shift",
            budget: 0.1,
          },
        ],
      },
    ],
  },
};
