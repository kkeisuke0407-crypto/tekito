import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const STATE_PATH = process.env.NOTE_STATE_PATH || join(ROOT, 'note_articles', 'publish-state.json');
const EVENT_NAME = process.env.GITHUB_EVENT_NAME || 'manual';
const SLOT_LIST = process.env.NOTE_SCHEDULE_SLOTS_JST || '11:13,14:27,16:41,18:18,21:52';
const WINDOW_MINUTES = Number(process.env.NOTE_SCHEDULE_WINDOW_MINUTES || 50);
const now = process.env.NOTE_SCHEDULE_NOW ? new Date(process.env.NOTE_SCHEDULE_NOW) : new Date();
const DEFAULT_CRON_SLOT_MAP = {
  '10,15 3 * * *': '12:00',
  '13,23,33,43,53 2 * * *': '11:13',
  '27,37,47,57 5 * * *': '14:27',
  '7 6 * * *': '14:27',
  '41,51 7 * * *': '16:41',
  '1,11,21 8 * * *': '16:41',
  '18,28,38,48,58 9 * * *': '18:18',
  '52 12 * * *': '21:52',
  '2,12,22,32 13 * * *': '21:52',
};

function writeOutputs(values) {
  for (const [key, value] of Object.entries(values)) {
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`, 'utf-8');
    }
    console.log(`${key}=${value}`);
  }
}

function jstDateParts(date) {
  const shifted = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

function jstSlotToUtcMs(parts, slot) {
  const [hour, minute] = slot.split(':').map(Number);
  const jstMidnightUtc = Date.UTC(parts.year, parts.month, parts.day) - 9 * 60 * 60 * 1000;
  return jstMidnightUtc + hour * 60 * 60 * 1000 + minute * 60 * 1000;
}

function jstDateKeyFromUtcMs(ms) {
  const parts = jstDateParts(new Date(ms));
  return `${parts.year}-${String(parts.month + 1).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function utcMsFromJstDateSlot(dateKey, slot) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return jstSlotToUtcMs({ year, month: month - 1, day }, slot);
}

function parseCronField(field, min, max) {
  if (field === '*') return Array.from({ length: max - min + 1 }, (_, index) => min + index);
  return field
    .split(',')
    .flatMap((part) => {
      if (/^\d+$/.test(part)) return [Number(part)];
      return [];
    })
    .filter((value) => value >= min && value <= max);
}

function latestScheduledUtcMs(cron) {
  const [minuteField, hourField] = cron.trim().split(/\s+/);
  const minutes = parseCronField(minuteField, 0, 59);
  const hours = parseCronField(hourField, 0, 23);
  if (!minutes.length || !hours.length) return undefined;

  let best;
  const nowMs = now.getTime();
  const start = new Date(nowMs - 48 * 60 * 60 * 1000);
  for (let offset = 0; offset <= 2; offset++) {
    const day = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + offset));
    for (const hour of hours) {
      for (const minute of minutes) {
        const candidate = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, minute);
        if (candidate <= nowMs && (best == null || candidate > best)) best = candidate;
      }
    }
  }
  return best;
}

function readEventSchedule() {
  if (process.env.NOTE_EVENT_SCHEDULE) return process.env.NOTE_EVENT_SCHEDULE;
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !existsSync(eventPath)) return undefined;
  const event = JSON.parse(readFileSync(eventPath, 'utf-8'));
  return typeof event.schedule === 'string' ? event.schedule : undefined;
}

function cronSlotMap() {
  const raw = process.env.NOTE_SCHEDULE_CRON_SLOT_MAP;
  if (!raw) return DEFAULT_CRON_SLOT_MAP;
  return Object.fromEntries(
    raw
      .split(',')
      .map((pair) => pair.split('='))
      .filter(([cron, slot]) => cron && slot)
      .map(([cron, slot]) => [cron.trim(), slot.trim()]),
  );
}

function findSlotFromEventSchedule() {
  const schedule = readEventSchedule();
  if (!schedule) return undefined;
  const slot = cronSlotMap()[schedule.trim()];
  if (!slot) return undefined;
  const scheduledMs = latestScheduledUtcMs(schedule);
  if (scheduledMs == null) return undefined;
  const date = jstDateKeyFromUtcMs(scheduledMs);
  const startMs = utcMsFromJstDateSlot(date, slot);
  const endMs = startMs + WINDOW_MINUTES * 60 * 1000;
  return { slot, date, key: `${date} ${slot} JST`, startMs, endMs, schedule };
}

function findCurrentSlot() {
  const parts = jstDateParts(now);
  const windowMs = WINDOW_MINUTES * 60 * 1000;
  for (const slot of SLOT_LIST.split(',').map((item) => item.trim()).filter(Boolean)) {
    const startMs = jstSlotToUtcMs(parts, slot);
    const endMs = startMs + windowMs;
    if (now.getTime() >= startMs && now.getTime() < endMs) {
      const date = `${parts.year}-${String(parts.month + 1).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
      return { slot, date, key: `${date} ${slot} JST`, startMs, endMs };
    }
  }
  return undefined;
}

function readPublishedEntries() {
  if (!existsSync(STATE_PATH)) return [];
  const state = JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
  return Object.values(state.published || {});
}

function alreadyPublishedInSlot(slot) {
  return readPublishedEntries().some((entry) => {
    if (entry?.mode && entry.mode !== 'publish') return false;
    const publishedAt = entry?.publishedAt ? new Date(entry.publishedAt).getTime() : NaN;
    return Number.isFinite(publishedAt) && publishedAt >= slot.startMs && publishedAt < slot.endMs;
  });
}

function main() {
  if (EVENT_NAME !== 'schedule') {
    writeOutputs({ should_run: 'true', reason: `event:${EVENT_NAME}`, slot_key: 'manual' });
    return;
  }

  const slot = findSlotFromEventSchedule() || findCurrentSlot();
  if (!slot) {
    writeOutputs({ should_run: 'false', reason: 'outside_publish_slot', slot_key: 'none' });
    return;
  }

  if (alreadyPublishedInSlot(slot)) {
    writeOutputs({ should_run: 'false', reason: 'slot_already_published', slot_key: slot.key });
    return;
  }

  writeOutputs({ should_run: 'true', reason: 'slot_due', slot_key: slot.key });
}

main();
