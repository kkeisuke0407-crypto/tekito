import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const STATE_PATH = process.env.NOTE_STATE_PATH || join(ROOT, 'note_articles', 'publish-state.json');
const EVENT_NAME = process.env.GITHUB_EVENT_NAME || 'manual';
const SLOT_LIST = process.env.NOTE_SCHEDULE_SLOTS_JST || '11:13,14:27,16:41,18:18,21:52';
const WINDOW_MINUTES = Number(process.env.NOTE_SCHEDULE_WINDOW_MINUTES || 50);
const now = process.env.NOTE_SCHEDULE_NOW ? new Date(process.env.NOTE_SCHEDULE_NOW) : new Date();

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

  const slot = findCurrentSlot();
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
