#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SESSIONS_PATH = path.join(ROOT, 'assets', 'devlog', 'sessions.json');
const DEFAULT_COVER_PATH = path.join(ROOT, 'assets', 'devlog', 'covers', 'default.svg');

const errors = [];
const warnings = [];

function rel(p) {
  return path.relative(ROOT, p) || '.';
}

function normalizeRepoPath(p) {
  if (typeof p !== 'string') return '';
  const trimmed = p.trim();
  if (!trimmed) return '';
  return trimmed.replace(/^\.\//, '');
}

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    errors.push(`[FATAL] Failed to parse ${rel(filePath)}: ${error.message}`);
    return null;
  }
}

function fileExists(repoPath) {
  if (!repoPath) return false;
  const abs = path.join(ROOT, repoPath);
  return fs.existsSync(abs);
}

function assertString(session, key, sessionId, required = true) {
  const value = session[key];
  if (typeof value === 'string' && value.trim()) return value.trim();
  const message = `${sessionId}: missing '${key}'`;
  if (required) {
    errors.push(`[ERR] ${message}`);
  } else {
    warnings.push(`[WARN] ${message}`);
  }
  return '';
}

function assertFile(sessionId, label, repoPath, required = true) {
  const normalized = normalizeRepoPath(repoPath);
  if (!normalized) {
    const message = `${sessionId}: missing path for ${label}`;
    if (required) {
      errors.push(`[ERR] ${message}`);
    } else {
      warnings.push(`[WARN] ${message}`);
    }
    return;
  }
  if (!fileExists(normalized)) {
    const message = `${sessionId}: ${label} not found -> ${normalized}`;
    if (required) {
      errors.push(`[ERR] ${message}`);
    } else {
      warnings.push(`[WARN] ${message}`);
    }
  }
}

function validateSession(session, index) {
  const sessionId = assertString(session, 'id', `session[${index}]`, true) || `session[${index}]`;

  assertString(session, 'title_ja', sessionId, true);
  assertString(session, 'title_en', sessionId, true);
  assertString(session, 'summary_en', sessionId, false);
  assertString(session, 'date_range_ja', sessionId, true);
  assertString(session, 'date_range_en', sessionId, true);

  const contentByLang = session.content_by_lang;
  if (!contentByLang || typeof contentByLang !== 'object') {
    errors.push(`[ERR] ${sessionId}: missing 'content_by_lang' object`);
  } else {
    assertFile(sessionId, 'content_by_lang.ja', contentByLang.ja, true);
    assertFile(sessionId, 'content_by_lang.en', contentByLang.en, true);
  }

  const coverByLang = session.cover_by_lang && typeof session.cover_by_lang === 'object'
    ? session.cover_by_lang
    : null;

  const jaCover = coverByLang?.ja || session.cover_ja || session.cover;
  if (!jaCover) {
    warnings.push(`[WARN] ${sessionId}: no Japanese/base cover path (cover_by_lang.ja / cover_ja / cover)`);
  } else {
    assertFile(sessionId, 'ja cover', jaCover, true);
  }

  const enCover = coverByLang?.en || session.cover_en;
  if (!enCover) {
    warnings.push(`[WARN] ${sessionId}: no English cover path (cover_by_lang.en / cover_en), EN view will fallback to default.svg`);
  } else {
    assertFile(sessionId, 'en cover', enCover, true);
  }
}

function main() {
  console.log('Devlog i18n validation');
  console.log(`- sessions: ${rel(SESSIONS_PATH)}`);

  if (!fs.existsSync(SESSIONS_PATH)) {
    errors.push(`[FATAL] sessions file missing: ${rel(SESSIONS_PATH)}`);
  }

  if (!fs.existsSync(DEFAULT_COVER_PATH)) {
    errors.push(`[FATAL] default cover missing: ${rel(DEFAULT_COVER_PATH)}`);
  }

  const sessions = readJson(SESSIONS_PATH);
  if (!Array.isArray(sessions)) {
    errors.push('[FATAL] sessions.json must be an array');
  } else {
    sessions.forEach((session, index) => validateSession(session, index));
  }

  console.log(`- sessions checked: ${Array.isArray(sessions) ? sessions.length : 0}`);
  console.log(`- warnings: ${warnings.length}`);
  warnings.forEach((msg) => console.log(msg));

  console.log(`- errors: ${errors.length}`);
  errors.forEach((msg) => console.log(msg));

  if (errors.length > 0) {
    process.exit(1);
  }
  console.log('Validation passed');
}

main();
