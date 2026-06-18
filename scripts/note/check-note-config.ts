import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const STORAGE_PATH = process.env.NOTE_STORAGE_STATE_PATH || join(ROOT, '.auth', 'note-storage-state.json');

type Check = {
  name: string;
  ok: boolean;
  required: boolean;
  detail: string;
};

function hasEnv(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function add(checks: Check[], name: string, ok: boolean, required: boolean, detail: string): void {
  checks.push({ name, ok, required, detail });
}

function main() {
  const checks: Check[] = [];
  const provider = (process.env.AI_PROVIDER || '').toLowerCase();
  const keywordSelection = (process.env.NOTE_KEYWORD_SELECTION || 'google').toLowerCase();
  const publishMode = process.env.NOTE_PUBLISH_MODE || 'draft';
  const hasOpenAI = hasEnv('OPENAI_API_KEY');
  const hasAnthropic = hasEnv('ANTHROPIC_API_KEY');
  const hasStorageJson = hasEnv('NOTE_STORAGE_STATE_JSON');
  const hasLocalStorage = existsSync(STORAGE_PATH);

  add(checks, 'AI_PROVIDER', Boolean(provider), false, provider || 'auto');
  add(checks, 'OPENAI_API_KEY or ANTHROPIC_API_KEY', hasOpenAI || hasAnthropic, true, hasOpenAI ? 'openai set' : hasAnthropic ? 'anthropic set' : 'missing');

  if (provider === 'openai') add(checks, 'OPENAI_API_KEY', hasOpenAI, true, hasOpenAI ? 'set' : 'missing');
  if (provider === 'anthropic') add(checks, 'ANTHROPIC_API_KEY', hasAnthropic, true, hasAnthropic ? 'set' : 'missing');

  add(checks, 'NOTE_COMPARISON_URL', hasEnv('NOTE_COMPARISON_URL'), true, process.env.NOTE_COMPARISON_URL || 'missing');
  add(checks, 'NOTE_PUBLISH_MODE', ['draft', 'publish'].includes(publishMode), true, publishMode);
  add(checks, 'NOTE_KEYWORD_SELECTION', ['none', 'google', 'browser', 'rakko-browser', 'api'].includes(keywordSelection), true, keywordSelection);

  if (keywordSelection === 'api') add(checks, 'RAKKO_API_KEY', hasEnv('RAKKO_API_KEY'), true, hasEnv('RAKKO_API_KEY') ? 'set' : 'missing');

  const noteAuthRequired = publishMode === 'draft' || publishMode === 'publish';
  add(
    checks,
    'NOTE_STORAGE_STATE_JSON or local storageState',
    hasStorageJson || hasLocalStorage,
    noteAuthRequired,
    hasStorageJson ? 'NOTE_STORAGE_STATE_JSON set' : hasLocalStorage ? `local file exists (${STORAGE_PATH})` : 'missing',
  );

  if (hasLocalStorage) {
    try {
      JSON.parse(readFileSync(STORAGE_PATH, 'utf-8'));
      add(checks, 'local storageState JSON parse', true, false, 'valid JSON');
    } catch {
      add(checks, 'local storageState JSON parse', false, true, 'invalid JSON');
    }
  }

  console.log('[note:check-config]');
  for (const check of checks) {
    const mark = check.ok ? 'OK' : check.required ? 'NG' : 'WARN';
    console.log(`${mark} ${check.name}: ${check.detail}`);
  }

  const failed = checks.filter((check) => check.required && !check.ok);
  if (failed.length) {
    console.error(`[note:check-config] failed: ${failed.map((check) => check.name).join(', ')}`);
    process.exit(1);
  }
}

main();
