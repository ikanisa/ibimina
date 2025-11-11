import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCoverageMap } from "istanbul-lib-coverage";

const repoRoot = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const reportsDir = path.join(repoRoot, ".reports", "coverage");

const DOMAINS = {
  web: {
    threshold: 80,
    packages: [
      { name: "@ibimina/admin", path: "apps/pwa/staff-admin" },
      { name: "@ibimina/ui", path: "packages/ui" },
    ],
  },
  server: {
    threshold: 80,
    packages: [{ name: "@ibimina/platform-api", path: "apps/platform-api" }],
  },
  mobile: {
    threshold: 60,
    packages: [{ name: "@ibimina/client", path: "apps/pwa/client" }],
  },
};

async function loadCoverage(packageRoot) {
  const nycOutput = path.join(packageRoot, ".nyc_output");
  let entries;
  try {
    entries = await readdir(nycOutput, { withFileTypes: true });
  } catch {
    return null;
  }

  const coverageMap = createCoverageMap({});
  let merged = false;

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const raw = await readFile(path.join(nycOutput, entry.name), "utf8");
    if (!raw.trim()) continue;
    try {
      const parsed = JSON.parse(raw);
      coverageMap.merge(parsed);
      merged = true;
    } catch (error) {
      console.warn(`Skipping malformed coverage file ${entry.name}:`, error);
    }
  }

  return merged ? coverageMap : null;
}

function extractLineCoverage(map) {
  const summary = map.getCoverageSummary();
  const lines = summary.lines.pct ?? 0;
  return Number.isFinite(lines) ? lines : 0;
}

async function persistCoverage(domain, map) {
  await mkdir(reportsDir, { recursive: true });
  const jsonPath = path.join(reportsDir, `${domain}-coverage-final.json`);
  await writeFile(jsonPath, JSON.stringify(map.toJSON(), null, 2));
}

async function main() {
  const results = [];

  for (const [domain, config] of Object.entries(DOMAINS)) {
    const domainMap = createCoverageMap({});
    const missing = [];

    for (const pkg of config.packages) {
      const packageRoot = path.join(repoRoot, pkg.path);
      const coverage = await loadCoverage(packageRoot);
      if (!coverage) {
        missing.push(pkg.name);
        continue;
      }
      domainMap.merge(coverage.toJSON());
    }

    if (missing.length > 0) {
      throw new Error(
        `No coverage data found for ${missing.join(", ")}. Ensure the test commands ran with coverage.`
      );
    }

    if (domainMap.files().length === 0) {
      throw new Error(`Coverage data was not generated for ${domain}.`);
    }

    await persistCoverage(domain, domainMap);
    const lineCoverage = extractLineCoverage(domainMap);
    const passed = lineCoverage >= config.threshold;
    results.push({
      domain,
      lineCoverage,
      threshold: config.threshold,
      passed,
    });

    console.log(
      `Coverage for ${domain}: ${lineCoverage.toFixed(2)}% (threshold ${config.threshold}%)`
    );
    if (!passed) {
      console.error(`Coverage for ${domain} fell below the required threshold.`);
    }
  }

  const summaryPath = path.join(reportsDir, "coverage-summary.json");
  await writeFile(summaryPath, JSON.stringify(results, null, 2));

  const markdownLines = [
    "| Domain | Lines % | Threshold | Status |",
    "| --- | ---: | ---: | --- |",
  ];
  for (const result of results) {
    const status = result.passed ? "✅ Pass" : "❌ Fail";
    markdownLines.push(
      `| ${result.domain} | ${result.lineCoverage.toFixed(2)} | ${result.threshold} | ${status} |`
    );
  }
  await writeFile(path.join(reportsDir, "coverage-summary.md"), markdownLines.join("\n"));

  const failed = results.filter((r) => !r.passed);
  if (failed.length > 0) {
    const message = failed
      .map((r) => `${r.domain}: ${r.lineCoverage.toFixed(2)}% (required ${r.threshold}%)`)
      .join("; ");
    throw new Error(`Coverage thresholds not met -> ${message}`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
