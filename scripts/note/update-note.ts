import { chromium, type BrowserContextOptions } from 'playwright';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type PublishState = {
  published: Record<string, { title: string; url?: string; publishedAt: string; mode: string; updatedAt?: string }>;
};

type ParsedArticle = {
  title: string;
  body: string;
  meta: Record<string, string>;
};

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OUTPUT_DIR = process.env.NOTE_OUTPUT_DIR || join(ROOT, 'note_articles', 'generated');
const STATE_PATH = process.env.NOTE_STATE_PATH || join(ROOT, 'note_articles', 'publish-state.json');
const STORAGE_PATH = process.env.NOTE_STORAGE_STATE_PATH || join(ROOT, '.auth', 'note-storage-state.json');
const CTA_IMAGE_PATH = process.env.NOTE_CTA_IMAGE_PATH || join(ROOT, 'note_articles', 'assets', 'cta-saimu-compare.png');
const CTA_IMAGE_URL =
  process.env.NOTE_CTA_IMAGE_URL || 'https://assets.st-note.com/img/1781615773-X3nNeslxyFdOLIkoPbVjSugH.png';
const HEADLESS = process.env.NOTE_HEADLESS !== 'false';
const BROWSER_CHANNEL = process.env.NOTE_BROWSER_CHANNEL;
const USER_AGENT =
  process.env.NOTE_USER_AGENT ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';

function readState(): PublishState {
  if (!existsSync(STATE_PATH)) return { published: {} };
  return JSON.parse(readFileSync(STATE_PATH, 'utf-8')) as PublishState;
}

function writeState(state: PublishState): void {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf-8');
}

function listArticlePaths(state: PublishState): string[] {
  if (process.env.NOTE_ARTICLE_PATH) return [process.env.NOTE_ARTICLE_PATH];
  if (!existsSync(OUTPUT_DIR)) return [];
  return readdirSync(OUTPUT_DIR)
    .filter((file) => file.endsWith('.md'))
    .filter((file) => state.published[file]?.url)
    .map((file) => join(OUTPUT_DIR, file));
}

function parseArticle(path: string): ParsedArticle {
  const file = readFileSync(path, 'utf-8');
  const metaBlock = file.match(/^<!--([\s\S]*?)-->\s*/)?.[1] || '';
  const meta = Object.fromEntries(
    metaBlock
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.includes(':'))
      .map((line) => {
        const [key, ...rest] = line.split(':');
        return [key.trim(), rest.join(':').trim()];
      }),
  );
  const raw = file.replace(/^<!--[\s\S]*?-->\s*/, '').trim();
  const title = raw.match(/^#\s+(.+)$/m)?.[1]?.trim() || '債務整理の相談先を比較';
  const body = raw.replace(/^#\s+.+\n?/, '').trim();
  return { title, body, meta };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
}

function isTableBlock(lines: string[], index: number): boolean {
  return (
    index + 1 < lines.length &&
    /^\s*\|.+\|\s*$/.test(lines[index]) &&
    /^\s*\|[\s:-]+\|[\s|:-]*\|\s*$/.test(lines[index + 1])
  );
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const standaloneLink = line.trim().match(/^\[(.+?)\]\((https?:\/\/[^)\s]+)\)$/);
    if (standaloneLink) {
      html.push(`<p><strong><a href="${escapeHtml(standaloneLink[2])}">▶ ${escapeHtml(standaloneLink[1])}</a></strong></p>`);
      continue;
    }

    if (isTableBlock(lines, i)) {
      const headers = splitTableRow(lines[i]);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      i--;
      html.push(
        '<ul>' +
          rows
            .map((row) => {
              const label = row[0] || '';
              const rest = row
                .slice(1)
                .map((cell, cellIndex) => {
                  const header = headers[cellIndex + 1] ? `${headers[cellIndex + 1]}: ` : '';
                  return `${header}${cell}`;
                })
                .filter(Boolean)
                .join(' / ');
              return `<li><strong>${inlineMarkdown(label)}</strong>${rest ? `: ${inlineMarkdown(rest)}` : ''}</li>`;
            })
            .join('') +
          '</ul>',
      );
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      const level = Math.min(heading[1].length, 3);
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [line.replace(/^\s*[-*]\s+/, '')];
      while (i + 1 < lines.length && /^\s*[-*]\s+/.test(lines[i + 1])) {
        items.push(lines[++i].replace(/^\s*[-*]\s+/, ''));
      }
      html.push(`<ul>${items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</ul>`);
      continue;
    }

    const para = [line.trim()];
    while (
      i + 1 < lines.length &&
      lines[i + 1].trim() &&
      !/^(#{2,4})\s+/.test(lines[i + 1]) &&
      !/^\s*[-*]\s+/.test(lines[i + 1]) &&
      !isTableBlock(lines, i + 1)
    ) {
      para.push(lines[++i].trim());
    }
    html.push(`<p>${inlineMarkdown(para.join(' '))}</p>`);
  }

  return html.join('\n');
}

function ctaImageHtml(): string {
  return `<p><img src="${escapeHtml(CTA_IMAGE_URL)}" alt="債務整理に強い相談先おすすめ3選" width="1200" height="675"></p>`;
}

function extractNoteId(url: string): string | undefined {
  return url.match(/\/n\/(n[a-z0-9]+)/)?.[1] || url.match(/\/notes\/(n[a-z0-9]+)/)?.[1];
}

async function writeStorageSecret(): Promise<string | undefined> {
  const json = process.env.NOTE_STORAGE_STATE_JSON;
  if (!json) return existsSync(STORAGE_PATH) ? STORAGE_PATH : undefined;
  mkdirSync(dirname(STORAGE_PATH), { recursive: true });
  writeFileSync(STORAGE_PATH, json, 'utf-8');
  return STORAGE_PATH;
}

async function fillTitle(page: any, title: string): Promise<void> {
  const titleInput = page.locator('textarea[placeholder="記事タイトル"], textarea[placeholder*="タイトル"], input[placeholder*="タイトル"]').first();
  await titleInput.waitFor({ state: 'visible', timeout: 45000 });
  await titleInput.fill(title);
  const value = await titleInput.inputValue();
  if (value !== title) throw new Error(`title did not update: ${value}`);
}

async function fillBody(page: any, body: string): Promise<void> {
  const editor = page.locator('.ProseMirror[contenteditable="true"], [role="textbox"][contenteditable="true"], [contenteditable="true"]').first();
  await editor.waitFor({ state: 'visible', timeout: 45000 });
  const html = `${ctaImageHtml()}\n${markdownToHtml(body)}`;
  await editor.evaluate((node: HTMLElement) => {
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await page.evaluate(async (payload: { text: string; html: string }) => {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([payload.html], { type: 'text/html' }),
        'text/plain': new Blob([payload.text], { type: 'text/plain' }),
      }),
    ]);
  }, { text: body, html });
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+V' : 'Control+V');
  await page.waitForTimeout(2500);
  const expected = body
    .replace(/\[(.+?)\]\([^)]+\)/g, '$1')
    .replace(/[#*`>|-]/g, '')
    .replace(/\s+/g, '')
    .slice(0, 45);
  const actual = ((await editor.innerText()) || '').replace(/[#*`>|-]/g, '').replace(/\s+/g, '');
  if (!actual.includes(expected)) {
    throw new Error(`body did not update after paste. expected=${expected} actualHead=${actual.slice(0, 180)}`);
  }
}

async function assertEditorReady(page: any): Promise<void> {
  const stats = await page.evaluate(() => {
    const editor = document.querySelector('.ProseMirror[contenteditable="true"]');
    const text = editor?.textContent || '';
    return {
      images: editor?.querySelectorAll('img').length || 0,
      links: editor?.querySelectorAll('a[href*="vpscomparehub.com/money"]').length || 0,
      hasImageUnderTitleCta: text.includes('相談先を選ぶ前に、他の候補と比較しておく'),
      hasComparisonCtaText: text.includes('債務整理に強い相談先を比較する') || text.includes('債務整理の相談先を比較する'),
    };
  });
  if (stats.images < 1) throw new Error('CTA image was not inserted');
  if (stats.links < 1 && !stats.hasComparisonCtaText) throw new Error('comparison LP link is missing');
  if (!stats.hasImageUnderTitleCta) throw new Error('image-under-title CTA is missing');
}

async function clickIfExists(page: any, name: RegExp): Promise<boolean> {
  const button = page.getByRole('button', { name }).first();
  if (!(await button.isVisible().catch(() => false))) return false;
  await button.click();
  return true;
}

async function clickButtonByText(page: any, name: RegExp): Promise<boolean> {
  const buttons = page.locator('button').filter({ hasText: name });
  const count = await buttons.count().catch(() => 0);
  for (let i = count - 1; i >= 0; i--) {
    const button = buttons.nth(i);
    if (!(await button.isVisible().catch(() => false))) continue;
    await button.evaluate((node: HTMLButtonElement) => node.click());
    return true;
  }
  return false;
}

async function saveUpdate(page: any): Promise<void> {
  await page.waitForTimeout(1500);
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(500);
  const before = page.url();
  if (!(await clickButtonByText(page, /公開に進む|公開設定|Publish/i))) {
    throw new Error('Could not find publish settings button');
  }
  await page.waitForURL(/\/publish\//, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(5000);
  if (!/\/publish\//.test(page.url())) {
    const buttons = await page.evaluate(() =>
      [...document.querySelectorAll('button')]
        .map((button) => button.textContent?.trim() || button.getAttribute('aria-label') || '')
        .filter(Boolean)
        .slice(0, 20),
    );
    throw new Error(`Publish settings did not open. before=${before} after=${page.url()} buttons=${buttons.join(' / ')}`);
  }
  if (!(await clickButtonByText(page, /更新する|投稿する|公開する|Publish/i))) {
    const buttons = await page.evaluate(() =>
      [...document.querySelectorAll('button')]
        .map((button) => button.textContent?.trim() || button.getAttribute('aria-label') || '')
        .filter(Boolean)
        .slice(0, 20),
    );
    throw new Error(`Could not find final update/publish button. buttons=${buttons.join(' / ')}`);
  }
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(6000);
}

async function updateOne(context: any, articlePath: string, url: string): Promise<{ title: string; url: string }> {
  const noteId = extractNoteId(url);
  if (!noteId) throw new Error(`Could not extract note id from ${url}`);
  const { title, body } = parseArticle(articlePath);
  const page = await context.newPage();
  try {
    await page.goto(`https://editor.note.com/notes/${noteId}/edit`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('textarea[placeholder*="タイトル"], .ProseMirror[contenteditable="true"]', { timeout: 45000 });
    await fillTitle(page, title);
    await fillBody(page, body);
    await assertEditorReady(page);
    await saveUpdate(page);
    return { title, url };
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  const state = readState();
  const articlePaths = listArticlePaths(state);
  if (!articlePaths.length) {
    console.log('[note:update] no published articles to update');
    return;
  }

  const storageState = await writeStorageSecret();
  if (!storageState) throw new Error('NOTE_STORAGE_STATE_JSON or .auth/note-storage-state.json is required');

  const contextOptions: BrowserContextOptions = { storageState, userAgent: USER_AGENT };
  const browser = await chromium.launch({
    headless: HEADLESS,
    channel: BROWSER_CHANNEL || undefined,
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-blink-features=AutomationControlled',
    ],
  });
  const context = await browser.newContext(contextOptions);
  try {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://editor.note.com' }).catch(() => {});
    for (const articlePath of articlePaths) {
      const file = basename(articlePath);
      const item = state.published[file];
      if (!item?.url) continue;
      const result = await updateOne(context, articlePath, item.url);
      state.published[file] = {
        ...item,
        title: result.title,
        url: result.url,
        mode: item.mode === 'publish' ? 'publish' : item.mode,
        updatedAt: new Date().toISOString(),
      };
      writeState(state);
      console.log(`[note:update] updated ${file}: ${result.title} ${result.url}`);
    }
    await context.storageState({ path: STORAGE_PATH }).catch(() => {});
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('[note:update] failed:', err);
  process.exit(1);
});
