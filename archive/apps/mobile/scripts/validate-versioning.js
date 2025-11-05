const SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)(?:[-+][0-9A-Za-z.-]+)?$/;
const INTEGER_REGEX = /^\d+$/;
const BUILD_REGEX = /^\d+(?:\.\d+)*$/;

function formatError(message) {
  return `❌ ${message}`;
}

function validateVersioning({ exitOnError = false, logOnSuccess = false } = {}) {
  const appVersion = process.env.APP_VERSION ?? "";
  const androidVersionCode = process.env.ANDROID_VERSION_CODE ?? "";
  const iosBuildNumber = process.env.IOS_BUILD_NUMBER ?? "";

  const errors = [];

  if (!appVersion) {
    errors.push("APP_VERSION is required (e.g. 1.2.3)");
  } else if (!SEMVER_REGEX.test(appVersion)) {
    errors.push("APP_VERSION must follow semantic versioning (major.minor.patch)");
  }

  if (!androidVersionCode) {
    errors.push("ANDROID_VERSION_CODE is required (positive integer)");
  } else if (!INTEGER_REGEX.test(androidVersionCode) || Number(androidVersionCode) <= 0) {
    errors.push("ANDROID_VERSION_CODE must be a positive integer");
  }

  if (!iosBuildNumber) {
    errors.push("IOS_BUILD_NUMBER is required (incrementing integer or dotted string)");
  } else if (!BUILD_REGEX.test(iosBuildNumber)) {
    errors.push("IOS_BUILD_NUMBER must contain only digits and optional dots");
  }

  if (errors.length > 0) {
    if (exitOnError) {
      console.error("\nVersion metadata validation failed:\n" + errors.map(formatError).join("\n"));
      process.exit(1);
    }
    return { errors, metadata: { appVersion, androidVersionCode, iosBuildNumber } };
  }

  const metadata = {
    appVersion,
    androidVersionCode: Number.parseInt(androidVersionCode, 10),
    iosBuildNumber,
  };

  if (logOnSuccess) {
    console.log(
      `✅ Version metadata validated (app=${metadata.appVersion}, androidCode=${metadata.androidVersionCode}, iosBuild=${metadata.iosBuildNumber})`
    );
  }

  return { errors: [], metadata };
}

if (require.main === module) {
  validateVersioning({ exitOnError: true, logOnSuccess: true });
}

module.exports = { validateVersioning };
