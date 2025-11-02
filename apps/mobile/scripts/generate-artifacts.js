const fs = require("fs");
const path = require("path");
const { validateVersioning } = require("./validate-versioning");

const TARGET_DEFINITIONS = {
  aab: {
    extension: ".aab",
    description: "Android App Bundle",
    profile: "production",
  },
  apk: {
    extension: ".apk",
    description: "Android APK",
    profile: "apk",
  },
  ipa: {
    extension: ".ipa",
    description: "iOS App Archive",
    profile: "production",
  },
};

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

  targets.forEach((target) => {
    const definition = TARGET_DEFINITIONS[target];
    if (!definition) {
      console.warn(`Skipping unknown target: ${target}`);
      return;
    }

    const filename = `ibimina-mobile-${metadata.appVersion}-${target}${definition.extension}`;
    const artifactPath = path.join(distDir, filename);
    const payload = {
      ...metadata,
      target,
      profile: definition.profile,
      description: definition.description,
      generatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(artifactPath, JSON.stringify(payload, null, 2));
    console.log(`📦 Generated ${definition.description} artifact at ${artifactPath}`);
  });
}

if (require.main === module) {
  main();
}

module.exports = { main };
