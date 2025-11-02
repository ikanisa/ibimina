const fs = require("fs");
const path = require("path");
const https = require("https");
const { spawnSync } = require("child_process");
const { validateVersioning } = require("./validate-versioning");

const TARGET_DEFINITIONS = {
  aab: {
    extension: ".aab",
    description: "Android App Bundle",
    profile: "production",
    platform: "android",
  },
  apk: {
    extension: ".apk",
    description: "Android APK",
    profile: "apk",
    platform: "android",
  },
  ipa: {
    extension: ".ipa",
    description: "iOS App Archive",
    profile: "production",
    platform: "ios",
  },
};

function runEasBuild({ profile, platform, target }) {
  const args = [
    "build",
    "--non-interactive",
    "--wait",
    "--json",
    "--profile",
    profile,
    "--platform",
    platform,
  ];

  console.log(
    `🚀 Running EAS build for target "${target}" (profile=${profile}, platform=${platform})...`
  );
  const result = spawnSync("eas", args, { encoding: "utf-8" });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
    throw new Error(
      `EAS build failed for target "${target}" with exit code ${result.status}.\n${output}`
    );
  }

  const rawBuildInfo = parseEasJson(result.stdout);
  if (!rawBuildInfo) {
    throw new Error(
      `Failed to parse EAS build output for target "${target}". Received:\n${result.stdout}`
    );
  }

  const buildInfo = Array.isArray(rawBuildInfo?.builds) ? rawBuildInfo.builds[0] : rawBuildInfo;

  if (!buildInfo) {
    throw new Error(`EAS build for target "${target}" did not return any build records.`);
  }

  if (buildInfo.status !== "finished") {
    throw new Error(
      `EAS build for target "${target}" did not finish successfully (status=${buildInfo.status}).`
    );
  }

  const buildUrl = buildInfo?.artifacts?.buildUrl;
  if (!buildUrl) {
    throw new Error(`EAS build for target "${target}" completed but no artifact URL was returned.`);
  }

  return { buildUrl, buildInfo };
}

function parseEasJson(stdout) {
  const lines = stdout.trim().split(/\r?\n/).reverse();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      // ignore until we find the JSON payload
    }
  }
  return null;
}

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    function handle(urlToFetch, redirects = 0) {
      if (redirects > 5) {
        reject(new Error("Too many redirects while downloading artifact."));
        return;
      }

      https
        .get(urlToFetch, (response) => {
          if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400) {
            const nextLocation = response.headers.location;
            if (!nextLocation) {
              reject(
                new Error(
                  `Redirect response received without a location header when downloading ${urlToFetch}.`
                )
              );
              return;
            }

            handle(nextLocation, redirects + 1);
            return;
          }

          if (response.statusCode !== 200) {
            reject(
              new Error(
                `Unexpected status code ${response.statusCode} while downloading ${urlToFetch}.`
              )
            );
            return;
          }

          const fileStream = fs.createWriteStream(destination);
          response.pipe(fileStream);
          fileStream.on("finish", () => fileStream.close(resolve));
          fileStream.on("error", reject);
        })
        .on("error", reject);
    }

    handle(url);
  });
}

function resolveTargets() {
  const targetArgument = process.argv.find((arg) => arg.startsWith("--target="));
  if (!targetArgument) {
    return Object.keys(TARGET_DEFINITIONS);
  }

  return targetArgument
    .replace("--target=", "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function main() {
  const { metadata, errors } = validateVersioning({ exitOnError: false });
  if (errors.length > 0) {
    console.error("Cannot generate artifacts until version metadata is valid:");
    errors.forEach((error) => console.error(` - ${error}`));
    process.exit(1);
  }

  const targets = resolveTargets();
  const distDir = path.join(__dirname, "..", "dist");
  fs.mkdirSync(distDir, { recursive: true });

  const generationSteps = targets.map(async (target) => {
    const definition = TARGET_DEFINITIONS[target];
    if (!definition) {
      console.warn(`Skipping unknown target: ${target}`);
      return;
    }

    const filename = `ibimina-mobile-${metadata.appVersion}-${target}${definition.extension}`;
    const artifactPath = path.join(distDir, filename);
    const { buildUrl, buildInfo } = runEasBuild({
      profile: definition.profile,
      platform: definition.platform,
      target,
    });

    console.log(`⬇️  Downloading artifact for ${target} from ${buildUrl}`);
    await downloadFile(buildUrl, artifactPath);
    console.log(`📦 Saved ${definition.description} artifact to ${artifactPath}`);

    const metadataPath = `${artifactPath}.json`;
    fs.writeFileSync(
      metadataPath,
      JSON.stringify(
        {
          ...metadata,
          target,
          profile: definition.profile,
          description: definition.description,
          generatedAt: new Date().toISOString(),
          build: {
            id: buildInfo.id,
            status: buildInfo.status,
            platform: definition.platform,
            profile: definition.profile,
            buildUrl,
          },
        },
        null,
        2
      )
    );
    console.log(`📝 Wrote build metadata to ${metadataPath}`);
  });

  return Promise.all(generationSteps);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = { main };
