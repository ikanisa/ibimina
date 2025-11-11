#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const repoRoot = path.resolve(scriptDir, "..");

const IGNORED_DIR_SEGMENTS = new Set(["node_modules", ".git", "dist", "build"]);

function findLocaleRoots(startDir) {
  const results = [];
  const entries = readdirSync(startDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(startDir, entry.name);
    if (entry.name === "locales") {
      results.push(fullPath);
      continue;
    }
    if (IGNORED_DIR_SEGMENTS.has(entry.name)) continue;
    results.push(...findLocaleRoots(fullPath));
  }
  return results;
}

function flattenKeys(object, prefix = "") {
  const keys = new Set();
  if (typeof object !== "object" || object === null) {
    if (prefix) keys.add(prefix);
    return keys;
  }
  for (const [key, value] of Object.entries(object)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      for (const nested of flattenKeys(value, next)) {
        keys.add(nested);
      }
    } else {
      keys.add(next);
    }
  }
  return keys;
}

function collectJsonFiles(localeDir) {
  return readdirSync(localeDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();
}

function loadJson(filePath) {
  try {
    const contents = readFileSync(filePath, "utf8");
    return JSON.parse(contents);
  } catch (error) {
    throw new Error(`Failed to parse JSON at ${filePath}: ${error.message}`);
  }
}

function analyseLocaleDirectory(localeRoot) {
  const subdirs = readdirSync(localeRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !IGNORED_DIR_SEGMENTS.has(entry.name))
    .map((entry) => entry.name)
    .sort();

  const localeSubdirs = subdirs.filter((name) => /^[a-z]{2}(?:-[A-Z]{2})?$/.test(name));

  if (localeSubdirs.length === 0) {
    return { skipped: true, reason: "no locale subdirectories" };
  }

  if (!localeSubdirs.includes("en") || !localeSubdirs.includes("rw")) {
    return {
      skipped: false,
      errors: [`${localeRoot}: expected both 'en' and 'rw' locale folders`],
    };
  }

  const referenceLocale = "en";
  const futureLocales = localeSubdirs.filter((code) => code !== "en" && code !== "rw");
  const jsonFiles = collectJsonFiles(path.join(localeRoot, referenceLocale));

  const errors = [];

  for (const fileName of jsonFiles) {
    const referencePath = path.join(localeRoot, referenceLocale, fileName);
    const referenceData = loadJson(referencePath);
    const referenceKeys = flattenKeys(referenceData);

    const rwPath = path.join(localeRoot, "rw", fileName);
    if (!statExists(rwPath)) {
      errors.push(`${localeRoot}: missing rw translation file for ${fileName}`);
    } else {
      const rwData = loadJson(rwPath);
      const rwKeys = flattenKeys(rwData);
      const missingInRw = [...referenceKeys].filter((key) => !rwKeys.has(key));
      const extraInRw = [...rwKeys].filter((key) => !referenceKeys.has(key));
      if (missingInRw.length > 0) {
        errors.push(`${rwPath}: missing keys -> ${missingInRw.join(", ")}`);
      }
      if (extraInRw.length > 0) {
        errors.push(`${rwPath}: extra keys not present in en -> ${extraInRw.join(", ")}`);
      }
      const emptyRwKeys = [...rwKeys].filter((key) => {
        const value = key.split(".").reduce((acc, part) => acc?.[part], rwData);
        return typeof value === "string" && value.trim() === "";
      });
      if (emptyRwKeys.length > 0) {
        errors.push(`${rwPath}: empty values -> ${emptyRwKeys.join(", ")}`);
      }
    }

    for (const futureLocale of futureLocales) {
      const futurePath = path.join(localeRoot, futureLocale, fileName);
      if (!statExists(futurePath)) {
        errors.push(`${localeRoot}: missing ${futureLocale} translation file for ${fileName}`);
        continue;
      }
      const futureData = loadJson(futurePath);
      const futureKeys = flattenKeys(futureData);
      const missingInFuture = [...referenceKeys].filter((key) => !futureKeys.has(key));
      if (missingInFuture.length > 0) {
        errors.push(`${futurePath}: missing keys -> ${missingInFuture.join(", ")}`);
      }
    }
  }

  return { skipped: false, errors };
}

function statExists(filePath) {
  try {
    statSync(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function main() {
  const localeRoots = findLocaleRoots(repoRoot).filter((dir) => !dir.includes("node_modules"));
  const relevantRoots = localeRoots.filter((dir) => !dir.startsWith(path.join(repoRoot, ".git")));

  const allErrors = [];
  for (const root of relevantRoots) {
    const result = analyseLocaleDirectory(root);
    if (result.skipped) {
      continue;
    }
    if (result.errors?.length) {
      allErrors.push(...result.errors);
    }
  }

  if (allErrors.length > 0) {
    console.error("\nLocale coverage check failed:");
    for (const error of allErrors) {
      console.error(` - ${error}`);
    }
    console.error("\nEnsure each locale folder mirrors the English keys before retrying.");
    process.exit(1);
  }

  console.log("Locale coverage check passed: EN, RW, and future locale files are aligned.");
}

main();
