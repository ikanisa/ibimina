#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIST_DIR="${APP_DIR}/dist"

mkdir -p "${DIST_DIR}"

TEMP_JSON="$(mktemp)"
trap 'rm -f "${TEMP_JSON}"' EXIT

cd "${APP_DIR}"

# Trigger the remote build and wait for it to finish. Capture the JSON output for artifact retrieval.
pnpm exec eas build --platform ios --profile production --non-interactive --wait --json > "${TEMP_JSON}"

ARTIFACT_URL="$(node <<'NODE' "${TEMP_JSON}"
const fs = require('fs');
const path = process.argv[1];

const input = fs.readFileSync(path, 'utf8');
if (!input.trim()) {
  console.error('No JSON output received from EAS build.');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(input);
} catch (error) {
  console.error('Failed to parse EAS build JSON output:', error.message);
  process.exit(1);
}

function extractUrl(value) {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = extractUrl(item);
      if (url) {
        return url;
      }
    }
    return null;
  }
  if (value.artifacts) {
    if (value.artifacts.applicationArchiveUrl) {
      return value.artifacts.applicationArchiveUrl;
    }
    if (value.artifacts.buildUrl) {
      return value.artifacts.buildUrl;
    }
  }
  if (value.builds) {
    return extractUrl(value.builds);
  }
  if (value.jobs) {
    return extractUrl(value.jobs);
  }
  if (value.build) {
    return extractUrl(value.build);
  }
  if (value.result) {
    return extractUrl(value.result);
  }
  return null;
}

const url = extractUrl(data);
if (!url) {
  console.error('Could not find an application archive URL in the EAS build output.');
  process.exit(1);
}

console.log(url);
NODE
)"

if [[ -z "${ARTIFACT_URL}" ]]; then
  echo "Failed to determine the artifact URL from the EAS build output." >&2
  exit 1
fi

curl -fL "${ARTIFACT_URL}" -o "${DIST_DIR}/Ibimina.ipa"

echo "iOS build artifact downloaded to ${DIST_DIR}/Ibimina.ipa"
