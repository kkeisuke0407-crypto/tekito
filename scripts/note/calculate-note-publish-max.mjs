import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const STATE_PATH = process.env.NOTE_STATE_PATH || join(ROOT, 'note_articles', 'publish-state.json');
const DAILY_TARGET = Number(process.env.NOTE_DAILY_TARGET || 5);
const SLOTS_JST = (process.env.NOTE_SCHEDULE_SLOTS_JST || '11:13,14:27,16:41,18:18,21:52')
  .split(',')
  .map((slot) => slot.trim())
  .filter(Boolean);
const now = process.env.NOTE_SCHEDULE_NOW ? new Date(process.env.NOTE_SCHEDULE_NOW) : new Date();

function output(key, value) {
  console.log(`${key}=${value}`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`, 'utf-8');
  }
}

function jstParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    dateKey: `${byType.year}-${byType.month}-${byType.day}`,
    minutes: Number(byType.hour) * 60 + Number(byType.minute),
  };
}

function slotMinutes(slot) {
  const [hour, minute] = slot.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return undefined;
  return hour * 60 + minute;
}

function publishedOnDate(dateKey) {
  if (!existsSync(STATE_PATH)) return 0;
  const state = JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
  return Object.values(state.published || {}).filter((entry) => {
    if (entry?.mode && entry.mode !== 'publish') return false;
    if (!entry?.publishedAt) return false;
    const publishedAt = new Date(entry.publishedAt);
    if (Number.isNaN(publishedAt.getTime())) return false;
    return jstParts(publishedAt).dateKey === dateKey;
  }).length;
}

const current = jstParts(now);
const dueSlots = SLOTS_JST.map(slotMinutes).filter((minutes) => minutes != null && minutes <= current.minutes).length;
const desiredByNow = Math.min(DAILY_TARGET, dueSlots);
const already = publishedOnDate(current.dateKey);
const remaining = Math.max(0, desiredByNow - already);
const max = remaining;
const reason = remaining > 0
  ? `due:${current.dateKey}:${already}/${desiredByNow}`
  : `not_due_or_met:${current.dateKey}:${already}/${desiredByNow}`;

output('max', String(max));
output('reason', reason);
output('target_date', current.dateKey);
output('due_slots', String(dueSlots));
output('already_published', String(already));

