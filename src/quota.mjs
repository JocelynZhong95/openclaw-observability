// src/quota.mjs
// Monthly trace quota guard for LangSmith free tier (5,000 traces/month).
// Persists a counter to ~/.openclaw/state/langsmith-quota.json.
// Use shouldSend() before exporting; bump() after a successful export.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

const STATE_PATH = join(homedir(), '.openclaw', 'state', 'langsmith-quota.json');
const DEFAULT_LIMIT = 5000;
const WARN_AT = 0.9; // warn at 90%

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function load() {
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return { month: monthKey(), count: 0, warned: false };
  }
}

function save(state) {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function rollIfNewMonth(state) {
  const now = monthKey();
  if (state.month !== now) {
    return { month: now, count: 0, warned: false };
  }
  return state;
}

export function getStatus(limit = DEFAULT_LIMIT) {
  const state = rollIfNewMonth(load());
  return {
    month: state.month,
    used: state.count,
    limit,
    remaining: Math.max(0, limit - state.count),
    pct: state.count / limit,
    overLimit: state.count >= limit,
  };
}

export function shouldSend(limit = DEFAULT_LIMIT) {
  return !getStatus(limit).overLimit;
}

export function bump(limit = DEFAULT_LIMIT) {
  let state = rollIfNewMonth(load());
  state.count += 1;
  if (!state.warned && state.count / limit >= WARN_AT) {
    state.warned = true;
    console.warn(`⚠️  LangSmith quota ${(state.count / limit * 100).toFixed(0)}% used (${state.count}/${limit}) for ${state.month}`);
  }
  if (state.count === limit) {
    console.warn(`🛑 LangSmith quota EXHAUSTED for ${state.month}. Further sends will be skipped.`);
  }
  save(state);
  return state;
}

// CLI: node src/quota.mjs status | reset
const cmd = process.argv[2];
if (cmd === 'status') {
  console.log(getStatus());
} else if (cmd === 'reset') {
  save({ month: monthKey(), count: 0, warned: false });
  console.log('reset done');
}
