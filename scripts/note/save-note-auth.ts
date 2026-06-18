import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const STORAGE_PATH = process.env.NOTE_STORAGE_STATE_PATH || join(ROOT, '.auth', 'note-storage-state.json');
const TIMEOUT_MS = Number(process.env.NOTE_AUTH_TIMEOUT_MS || 10 * 60 * 1000);
const CHANNEL = process.env.NOTE_AUTH_CHANNEL;

async function canAccessEditor(page: any): Promise<boolean> {
  await page.goto('https://note.com/notes/new', { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(3000).catch(() => {});
  return !page.url().includes('/login');
}

async function main() {
  mkdirSync(dirname(STORAGE_PATH), { recursive: true });
  const browser = await chromium.launch({
    headless: false,
    channel: CHANNEL || undefined,
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://note.com/login', { waitUntil: 'domcontentloaded' });

  console.log('[note:auth] Browser opened. Please log in to note in the opened Chromium window.');
  console.log('[note:auth] Storage state will be saved after login is detected.');

  const startedAt = Date.now();
  while (Date.now() - startedAt < TIMEOUT_MS) {
    if (page.isClosed()) {
      await context.storageState({ path: STORAGE_PATH }).catch(() => {});
      console.log(`[note:auth] Browser was closed. Saved best-effort state to ${STORAGE_PATH}`);
      await browser.close().catch(() => {});
      return;
    }
    const url = page.url();
    const maybeLoggedIn =
      url.startsWith('https://note.com/') && !url.includes('/login') && !url.includes('/signup');
    const loggedIn = maybeLoggedIn && (await canAccessEditor(page));
    if (loggedIn) {
      await context.storageState({ path: STORAGE_PATH });
      console.log(`[note:auth] Saved ${STORAGE_PATH}`);
      await browser.close();
      return;
    }
    await page.waitForTimeout(2000).catch(async () => {
      await context.storageState({ path: STORAGE_PATH }).catch(() => {});
    });
  }

  await context.storageState({ path: STORAGE_PATH }).catch(() => {});
  await browser.close().catch(() => {});
  throw new Error(`note login was not detected within ${Math.round(TIMEOUT_MS / 1000)} seconds`);
}

main().catch((err) => {
  console.error('[note:auth] failed:', err);
  process.exit(1);
});
