#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'BACKUP_PEPPER',
  'MFA_SESSION_SECRET',
  'TRUSTED_COOKIE_SECRET',
  'HMAC_SHARED_SECRET',
  'KMS_DATA_KEY_BASE64',
];

const OPTIONAL_ENV_VARS = [
  'OPENAI_API_KEY',
  'SENTRY_DSN',
  'POSTHOG_API_KEY',
  'LOG_DRAIN_URL',
];

function checkEnvVars() {
  console.log('🔍 Checking environment variables...\n');
  
  const missing = [];
  const optionalMissing = [];
  
  // Check required variables
  REQUIRED_ENV_VARS.forEach(varName => {
    if (!process.env[varName] || process.env[varName].includes('placeholder') || process.env[varName].includes('stub')) {
      missing.push(varName);
    }
  });
  
  // Check optional variables
  OPTIONAL_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
      optionalMissing.push(varName);
    }
  });
  
  // Check .env file exists
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  No .env file found!');
    console.log('📝 Creating .env from .env.example...\n');
    
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ .env file created. Please update the values.\n');
    } else {
      console.log('❌ .env.example not found. Cannot create .env file.\n');
    }
  }
  
  // Report results
  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n📖 Please set these variables in your .env file or environment.');
    console.log('   See .env.example for the full list of required variables.\n');
    process.exit(1);
  }
  
  if (optionalMissing.length > 0) {
    console.log('⚠️  Optional environment variables not set:');
    optionalMissing.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n💡 These are optional but recommended for full functionality.\n');
  }
  
  console.log('✅ All required environment variables are set!\n');
  
  // Generate placeholder secrets if needed
  const crypto = require('crypto');
  const needsSecrets = REQUIRED_ENV_VARS.filter(varName => {
    const value = process.env[varName];
    return !value || value.length < 32;
  });
  
  if (needsSecrets.length > 0) {
    console.log('🔐 Generate secure secrets with these commands:\n');
    needsSecrets.forEach(varName => {
      if (varName.includes('BASE64')) {
        console.log(`export ${varName}=$(openssl rand -base64 32)`);
      } else {
        console.log(`export ${varName}=$(openssl rand -hex 32)`);
      }
    });
    console.log('');
  }
}

// Run check
try {
  checkEnvVars();
} catch (error) {
  console.error('❌ Error checking environment variables:', error.message);
  process.exit(1);
}
