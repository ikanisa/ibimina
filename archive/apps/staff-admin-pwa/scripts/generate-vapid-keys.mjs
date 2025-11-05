#!/usr/bin/env node

import webpush from 'web-push';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Generating VAPID keys for Web Push...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
console.log('\nSave these keys securely!\n');

const envContent = `# Web Push VAPID Keys
# Add the public key to your .env files
# Keep the private key secure and use in backend only

VITE_PUSH_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
`;

const envPath = join(__dirname, '../.env.local.push');
writeFileSync(envPath, envContent);

console.log(`✓ Keys saved to .env.local.push`);
console.log('  Copy VITE_PUSH_PUBLIC_KEY to your .env files');
console.log('  Keep VAPID_PRIVATE_KEY secure for backend use\n');
