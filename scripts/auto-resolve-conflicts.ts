#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';

interface ConflictedFile {
  path: string;
  strategy: 'ours' | 'theirs' | 'manual' | 'merge';
}

const conflictResolutionMap: Record<string, ConflictedFile[]> = {
  '589': [
    { path: 'apps/admin/app/(staff)/staff/layout.tsx', strategy: 'merge' },
    { path: 'apps/admin/app/settings/sms-consent/page.tsx', strategy: 'merge' },
    { path: 'apps/admin/app/settings/sms-ingestion/page.tsx', strategy: 'merge' },
    { path: 'apps/admin/components/examples/NetworkMonitorExample.tsx', strategy: 'theirs' },
    { path: 'apps/admin/components/examples/NotificationExample.tsx', strategy: 'theirs' },
    { path: 'apps/admin/components/examples/README.md', strategy: 'theirs' },
    { path: 'apps/admin/package.json', strategy: 'merge' },
  ],
  '584': [
    { path: 'apps/mobile/client-android/app/build.gradle.kts', strategy: 'merge' },
    { path: 'package.json', strategy: 'merge' },
    { path: 'pnpm-lock.yaml', strategy: 'theirs' },
  ],
  '582': [
    { path: 'apps/admin/app/(main)/scan-login/page.tsx', strategy: 'merge' },
    { path: 'apps/admin/app/api/imports/sms/route.ts', strategy: 'merge' },
    { path: 'apps/admin/app/api/imports/statement/route.ts', strategy: 'merge' },
    { path: 'apps/admin/components/auth/pin-entry.tsx', strategy: 'merge' },
    { path: 'apps/admin/components/auth/pin-setup.tsx', strategy: 'merge' },
    { path: 'apps/admin/lib/supabase/config.ts', strategy: 'theirs' },
    { path: 'apps/admin/package.json', strategy: 'merge' },
  ],
  '581': [
    { path: 'package.json', strategy: 'merge' },
    { path: 'pnpm-lock.yaml', strategy: 'theirs' },
  ],
  '580': [
    { path: 'apps/admin/package.json', strategy: 'merge' },
    { path: 'package.json', strategy: 'merge' },
  ],
  '575': [
    { path: 'package.json', strategy: 'merge' },
    { path: 'pnpm-lock.yaml', strategy: 'theirs' },
  ],
  '568': [
    { path: 'package.json', strategy: 'merge' },
    { path: 'pnpm-lock.yaml', strategy: 'theirs' },
  ],
};

async function resolveConflicts(prNumber: string) {
  console.log(`🔧 Resolving conflicts for PR #${prNumber}`);
  
  const conflicts = conflictResolutionMap[prNumber] || [];
  
  for (const file of conflicts) {
    if (!existsSync(file.path)) {
      console.log(`⚠️  File not found: ${file.path}`);
      continue;
    }
    
    console.log(`📝 Processing ${file.path} with strategy: ${file.strategy}`);
    
    try {
      switch (file.strategy) {
        case 'ours':
          execSync(`git checkout --ours ${file.path}`);
          execSync(`git add ${file.path}`);
          console.log(`   ✅ Kept our version`);
          break;
          
        case 'theirs':
          execSync(`git checkout --theirs ${file.path}`);
          execSync(`git add ${file.path}`);
          console.log(`   ✅ Kept their version (main)`);
          break;
          
        case 'merge':
          console.log(`   📋 Manual merge required for ${file.path}`);
          if (file.path.includes('package.json')) {
            mergePackageJson(file.path);
          }
          break;
          
        case 'manual':
          console.log(`   ⚠️  Manual intervention required for ${file.path}`);
          break;
      }
    } catch (error) {
      console.log(`   ❌ Error processing ${file.path}: ${error}`);
    }
  }
}

function mergePackageJson(filePath: string) {
  try {
    const oursCmd = execSync(`git show :2:${filePath}`, { encoding: 'utf8' });
    const theirsCmd = execSync(`git show :3:${filePath}`, { encoding: 'utf8' });
    
    const ours = JSON.parse(oursCmd);
    const theirs = JSON.parse(theirsCmd);
    
    const merged = {
      ...theirs,
      ...ours,
      name: theirs.name || ours.name,
      version: theirs.version || ours.version,
      dependencies: { ...theirs.dependencies, ...ours.dependencies },
      devDependencies: { ...theirs.devDependencies, ...ours.devDependencies },
      scripts: { ...theirs.scripts, ...ours.scripts },
      engines: theirs.engines || ours.engines,
      packageManager: theirs.packageManager || ours.packageManager,
    };
    
    // Sort keys for consistency
    const sortedMerged = Object.keys(merged).sort().reduce((acc: any, key) => {
      acc[key] = merged[key];
      return acc;
    }, {});
    
    writeFileSync(filePath, JSON.stringify(sortedMerged, null, 2) + '\n');
    execSync(`git add ${filePath}`);
    console.log(`   ✅ Merged ${filePath}`);
  } catch (error) {
    console.log(`   ❌ Failed to auto-merge ${filePath}: ${error}`);
  }
}

// Run if called directly
if (require.main === module) {
  const prNumber = process.argv[2];
  if (!prNumber) {
    console.error('Usage: tsx auto-resolve-conflicts.ts <PR_NUMBER>');
    process.exit(1);
  }
  resolveConflicts(prNumber).catch(console.error);
}

export { resolveConflicts };
