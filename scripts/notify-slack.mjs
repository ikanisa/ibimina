#!/usr/bin/env node
import fs from 'node:fs';

const webhook = process.env.SLACK_WEBHOOK_URL;
if (!webhook) {
  console.log('SLACK_WEBHOOK_URL not set; skipping Slack notification.');
  process.exit(0);
}

// Prefer release metadata from CI, otherwise allow --file path
const title = process.env.RELEASE_NAME || 'New release';
const url = process.env.RELEASE_HTML_URL || '';
let body = process.env.RELEASE_BODY || '';

// Parse optional --file <path>
const fileFlagIdx = process.argv.indexOf('--file');
if (!body && fileFlagIdx !== -1 && process.argv[fileFlagIdx + 1]) {
  const p = process.argv[fileFlagIdx + 1];
  try {
    body = fs.readFileSync(p, 'utf8');
  } catch (e) {
    console.warn('Could not read file for Slack message:', e.message);
  }
}

const text = [
  `*${title}*`,
  '',
  body?.trim() || '',
  url ? `\n${url}` : '',
]
  .filter(Boolean)
  .join('\n');

const payload = { text };

const res = await fetch(webhook, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

if (!res.ok) {
  const msg = await res.text().catch(() => '');
  console.error('Slack notification failed:', res.status, msg);
  process.exit(1);
}

console.log('Slack notification sent.');

