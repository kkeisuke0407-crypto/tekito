import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const STATE_PATH = process.env.NOTE_STATE_PATH || join(ROOT, 'note_articles', 'publish-state.json');
const DAILY_TARGET = Number(process.env.NOTE_DAILY_TARGET || 5);
const CATCH_UP_CRON = process.env.NOTE_CATCH_UP_CRON || '52 12 * * *';
const DEFAULT_MAX = Number(process.env.NOTE_PUBLISH_QUEUE_MAX || 1);

function output(key, value) {
  console.log(`${key}=${value}`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`, 'utf-8');
  }
}

function jstDateKey(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function eventSchedule() {
  if (process.env.NOTE_EVENT_SCHEDULE) return process.env.NOTE_EVENT_SCHEDULE;
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !existsSync(eventPath)) return '';
  try {
    const event = JSON.parse(readFileSync(eventPath, 'utf-8'));
    return typeof event.schedule === 'string' ? event.schedule : '';
  } catch {
    return '';
  }
}

function publishedToday() {
  if (!existsSync(STATE_PATH)) return 0;
  const state = JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
  const today = jstDateKey(new Date());
  return Object.values(state.published || {}).filter((entry) => {
    if (entry?.mode && entry.mode !== 'publish') return false;
    if (!entry?.publishedAt) return false;
    const publishedAt = new Date(entry.publishedAt);
    if (Number.isNaN(publishedAt.getTime())) return false;
    return jstDateKey(publishedAt) === today;
  }).length;
}

const schedule = eventSchedule().trim();
const isCatchUp = schedule === CATCH_UP_CRON;
const already = publishedToday();
const remaining = Math.max(0, DAILY_TARGET - already);
const max = isCatchUp ? remaining : DEFAULT_MAX;
const reason = isCatchUp ? `catch_up:${already}/${DAILY_TARGET}` : `regular:${DEFAULT_MAX}`;

output('max', String(max));
output('reason', reason);
