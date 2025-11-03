#!/usr/bin/env node

// Verification script to check all required dependencies are installed

const requiredDeps = {
  // Navigation dependencies
  '@react-navigation/native': true,
  '@react-navigation/native-stack': true,
  '@react-navigation/bottom-tabs': true,
  'react-native-screens': true,
  'react-native-safe-area-context': true,
  'react-native-gesture-handler': true,
  'react-native-reanimated': true,
  
  // Visual dependencies
  'expo-linear-gradient': true,
  'expo-blur': true,
  '@expo/vector-icons': true,
  'dayjs': true,
  
  // Base dependencies
  'expo': true,
  'react': true,
  'react-native': true,
};

console.log('Verifying installed dependencies...\n');

const packageJson = require('./package.json');
const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

let allInstalled = true;
let missingDeps = [];

for (const dep of Object.keys(requiredDeps)) {
  if (deps[dep]) {
    console.log(`✓ ${dep} (${deps[dep]})`);
  } else {
    console.log(`✗ ${dep} - MISSING`);
    allInstalled = false;
    missingDeps.push(dep);
  }
}

console.log('\n--- Configuration Files ---');

// Check babel.config.js
const fs = require('fs');
const babelConfig = fs.readFileSync('./babel.config.js', 'utf8');
if (babelConfig.includes('react-native-reanimated/plugin')) {
  console.log('✓ babel.config.js has Reanimated plugin');
} else {
  console.log('✗ babel.config.js missing Reanimated plugin');
  allInstalled = false;
}

// Check index.js
const indexJs = fs.readFileSync('./index.js', 'utf8');
if (indexJs.includes("import 'react-native-gesture-handler'")) {
  console.log('✓ index.js imports gesture-handler first');
} else {
  console.log('✗ index.js does not import gesture-handler first');
  allInstalled = false;
}

if (indexJs.includes('registerRootComponent')) {
  console.log('✓ index.js registers App component');
} else {
  console.log('✗ index.js does not register App component');
  allInstalled = false;
}

console.log('\n--- Summary ---');
if (allInstalled) {
  console.log('✓ All requirements met! The app is ready.');
  process.exit(0);
} else {
  console.log('✗ Some requirements are missing:');
  if (missingDeps.length > 0) {
    console.log('  Missing dependencies:', missingDeps.join(', '));
  }
  process.exit(1);
}
