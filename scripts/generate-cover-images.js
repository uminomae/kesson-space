#!/usr/bin/env node
/**
 * scripts/generate-cover-images.js
 *
 * Generates cover PNG images from devlog infographic HTML files using Puppeteer.
 *
 * Usage:
 *   node scripts/generate-cover-images.js              # all sessions, skip existing
 *   node scripts/generate-cover-images.js --force       # overwrite existing
 *   node scripts/generate-cover-images.js --session 002 # single session only
 */

const fs = require('fs');
const path = require('path');

const PROMPTS_DIR = path.resolve(__dirname, '../content/devlog/prompts');
const OUTPUT_DIR = path.resolve(__dirname, '../assets/devlog/covers');

function parseArgs(argv) {
  const args = argv.slice(2);
  const force = args.includes('--force');
  const sessionIdx = args.indexOf('--session');
  const session = sessionIdx !== -1 ? args[sessionIdx + 1] : null;
  return { force, session };
}

function findHtmlFiles(session) {
  const files = fs.readdirSync(PROMPTS_DIR)
    .filter(f => /^session-\d+-generator\.html$/.test(f))
    .sort();

  if (session) {
    const padded = session.padStart(3, '0');
    return files.filter(f => f.includes(`session-${padded}`));
  }
  return files;
}

function sessionNumFrom(filename) {
  return filename.match(/session-(\d+)/)[1];
}

async function main() {
  const { force, session } = parseArgs(process.argv);
  const files = findHtmlFiles(session);

  if (files.length === 0) {
    console.log('No matching HTML files found in', PROMPTS_DIR);
    process.exit(0);
  }

  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    console.error('Puppeteer not found. Install with:\n  npm install --save-dev puppeteer');
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  let generated = 0;
  let skipped = 0;

  try {
    for (const file of files) {
      const num = sessionNumFrom(file);
      const outputFile = path.join(OUTPUT_DIR, `session-${num}.png`);

      if (!force && fs.existsSync(outputFile)) {
        console.log(`SKIP  session-${num}.png (exists)`);
        skipped++;
        continue;
      }

      const htmlPath = path.join(PROMPTS_DIR, file);
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(`file://${htmlPath}`, { waitUntil: 'load', timeout: 10000 });

      // Canvas draws synchronously on load — small buffer for safety
      await new Promise(r => setTimeout(r, 300));

      const dataUrl = await page.evaluate(() => {
        const c = document.getElementById('coverCanvas');
        if (!c) throw new Error('No #coverCanvas found');
        return c.toDataURL('image/png');
      });

      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(outputFile, Buffer.from(base64, 'base64'));
      console.log(`SAVED session-${num}.png (${(Buffer.byteLength(base64, 'base64') / 1024).toFixed(0)} KB)`);
      generated++;

      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`\nDone: ${generated} generated, ${skipped} skipped`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
