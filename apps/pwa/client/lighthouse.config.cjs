/**
 * Lighthouse configuration for Ibimina Client PWA.
 * The CI pipeline consumes this file to enforce web-vitals and
 * payload budgets under simulated mobile network conditions.
 */
const sharedSettings = {
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
};

module.exports = {
  extends: "lighthouse:default",
  settings: sharedSettings,
  ci: {
    collect: {
      numberOfRuns: 1,
      settings: sharedSettings,
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.91 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.93 }],
        "categories:seo": ["error", { minScore: 0.93 }],
        "categories:pwa": ["error", { minScore: 0.9 }],
      },
    },
  },
};
