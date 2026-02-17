#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, '..');
const PRESET_FILE = resolve(ROOT, 'assets', 'deeplinks.json');
const DEFAULT_BASE = 'https://uminomae.github.io';

function printHelp() {
  console.log('Usage:');
  console.log('  node scripts/print-deeplinks.mjs [preset_key] [--base <origin>]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/print-deeplinks.mjs');
  console.log('  node scripts/print-deeplinks.mjs articles_readmore_open');
  console.log('  node scripts/print-deeplinks.mjs articles_readmore_open --base http://localhost:5173');
}

function parseArgs(argv) {
  let presetKey = null;
  let baseOrigin = DEFAULT_BASE;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      return { help: true };
    }
    if (arg === '--base') {
      baseOrigin = argv[i + 1];
      i += 1;
      continue;
    }
    if (!presetKey) {
      presetKey = arg;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return { help: false, presetKey, baseOrigin };
}

function buildPresetUrl(baseOrigin, basePath, preset) {
  const path = preset.path || basePath || '/';
  const url = new URL(path, baseOrigin);
  const query = preset.query || {};
  Object.entries(query).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  if (preset.hash) {
    url.hash = String(preset.hash).replace(/^#/, '');
  }
  return url.toString();
}

async function main() {
  const { help, presetKey, baseOrigin } = parseArgs(process.argv.slice(2));
  if (help) {
    printHelp();
    return;
  }

  let parsedBaseOrigin;
  try {
    parsedBaseOrigin = new URL(baseOrigin).origin;
  } catch (error) {
    throw new Error(`Invalid --base origin: ${baseOrigin}`);
  }

  const raw = await readFile(PRESET_FILE, 'utf-8');
  const data = JSON.parse(raw);
  const basePath = data.basePath || '/';
  const presets = data.presets || {};

  if (presetKey) {
    const preset = presets[presetKey];
    if (!preset) {
      throw new Error(`Preset not found: ${presetKey}`);
    }
    console.log(buildPresetUrl(parsedBaseOrigin, basePath, preset));
    return;
  }

  Object.entries(presets).forEach(([key, preset]) => {
    const url = buildPresetUrl(parsedBaseOrigin, basePath, preset);
    const label = preset.label ? `  # ${preset.label}` : '';
    console.log(`${key}\t${url}${label}`);
  });
}

main().catch((error) => {
  console.error(`[deeplinks] ${error.message}`);
  process.exit(1);
});
