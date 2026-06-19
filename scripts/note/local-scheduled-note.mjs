import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const TMP_PREFIX = join(tmpdir(), 'note-local-scheduled-');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, '');
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || ROOT,
    env: options.env || process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with code ${result.status}`);
  }
}

function output(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || ROOT,
    env: options.env || process.env,
    encoding: 'utf-8',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with code ${result.status}\n${result.stderr || ''}`);
  }
  return result.stdout.trim();
}

function requireEnv() {
  const missing = [];
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) missing.push('OPENAI_API_KEY or ANTHROPIC_API_KEY');
  if (!process.env.NOTE_COMPARISON_URL) missing.push('NOTE_COMPARISON_URL');
  if (missing.length) {
    throw new Error(`Missing required env: ${missing.join(', ')}`);
  }
}

function defaultEnv(worktree) {
  const env = { ...process.env };
  env.AI_PROVIDER ||= env.OPENAI_API_KEY ? 'openai' : 'anthropic';
  env.NOTE_KEYWORD_SELECTION ||= 'google';
  env.NOTE_PUBLISH_MODE ||= 'publish';
  env.GOOGLE_BROWSER_MAX_TARGETS ||= '1';
  env.GOOGLE_BROWSER_HEADLESS ||= 'true';
  env.NOTE_HEADLESS ||= 'true';

  const mainStoragePath = join(ROOT, '.auth', 'note-storage-state.json');
  if (!env.NOTE_STORAGE_STATE_PATH && existsSync(mainStoragePath)) {
    env.NOTE_STORAGE_STATE_PATH = mainStoragePath;
  }

  const mainGoogleProfile = join(ROOT, '.auth', 'google-keyword-browser');
  if (!env.GOOGLE_BROWSER_USER_DATA_DIR && existsSync(dirname(mainGoogleProfile))) {
    env.GOOGLE_BROWSER_USER_DATA_DIR = mainGoogleProfile;
  }

  env.NOTE_LOCAL_SOURCE_ROOT = ROOT;
  env.NOTE_LOCAL_WORKTREE = worktree;
  return env;
}

function hasStagedChanges(worktree) {
  return output('git', ['diff', '--cached', '--name-only'], { cwd: worktree }).length > 0;
}

function main() {
  loadEnvFile(join(ROOT, '.env'));
  loadEnvFile(join(ROOT, '.env.local'));
  loadEnvFile(join(ROOT, '.env.note'));
  requireEnv();

  const worktree = join(TMP_PREFIX + Date.now().toString());
  mkdirSync(dirname(worktree), { recursive: true });

  try {
    run('git', ['fetch', 'origin', 'main'], { cwd: ROOT });
    run('git', ['worktree', 'add', '--detach', worktree, 'origin/main'], { cwd: ROOT });

    const env = defaultEnv(worktree);
    run('npm.cmd', ['ci'], { cwd: worktree, env });
    run('npm.cmd', ['run', 'note:check-config'], { cwd: worktree, env });
    run('npm.cmd', ['run', 'note:daily'], { cwd: worktree, env });

    run('git', ['config', 'user.name', 'tekito-local-bot'], { cwd: worktree });
    run('git', ['config', 'user.email', 'actions@users.noreply.github.com'], { cwd: worktree });
    run('git', ['add', 'note_articles/generated', 'note_articles/keyword-opportunities.csv', 'note_articles/keyword-opportunities.json', 'note_articles/publish-state.json'], { cwd: worktree });

    if (!hasStagedChanges(worktree)) {
      console.log('[note:local-scheduled] No note article changes.');
      return;
    }

    const date = new Date().toISOString().slice(0, 10);
    run('git', ['commit', '-m', `chore(note): local scheduled article pipeline ${date}`], { cwd: worktree });
    run('git', ['push', 'origin', 'HEAD:main'], { cwd: worktree });
  } finally {
    try {
      run('git', ['worktree', 'remove', '--force', worktree], { cwd: ROOT });
    } catch {
      rmSync(worktree, { recursive: true, force: true });
    }
  }
}

main();
