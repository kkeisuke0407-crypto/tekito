import { existsSync, mkdirSync, readdirSync, renameSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const QUEUE_DIR = process.env.NOTE_PUBLISH_QUEUE_DIR || join(ROOT, 'note_articles', 'publish_queue');
const DONE_DIR = process.env.NOTE_PUBLISHED_QUEUE_DIR || join(ROOT, 'note_articles', 'published_queue');
const MAX = Number(process.env.NOTE_PUBLISH_QUEUE_MAX || 1);

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with code ${result.status}`);
  }
}

function queuedArticles() {
  if (!existsSync(QUEUE_DIR)) return [];
  return readdirSync(QUEUE_DIR)
    .filter((file) => file.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b, 'ja'))
    .map((file) => join(QUEUE_DIR, file));
}

function main() {
  mkdirSync(QUEUE_DIR, { recursive: true });
  mkdirSync(DONE_DIR, { recursive: true });

  const articles = queuedArticles().slice(0, MAX);
  if (!articles.length) {
    console.log('[note:publish:queue] no queued articles');
    return;
  }

  for (const article of articles) {
    console.log(`[note:publish:queue] publishing ${article}`);
    run('npx', ['tsx', 'scripts/note/publish-note.ts'], {
      ...process.env,
      NOTE_ARTICLE_PATH: article,
      NOTE_PUBLISH_MODE: process.env.NOTE_PUBLISH_MODE || 'publish',
      NOTE_HEADLESS: process.env.NOTE_HEADLESS || 'true',
    });

    const donePath = join(DONE_DIR, basename(article));
    renameSync(article, donePath);
    console.log(`[note:publish:queue] moved to ${donePath}`);
  }
}

try {
  main();
} catch (error) {
  console.error('[note:publish:queue] failed:', error);
  process.exit(1);
}
