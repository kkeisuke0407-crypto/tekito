import { chromium, type BrowserContextOptions } from 'playwright';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type PublishState = {
  published: Record<string, { title: string; url?: string; publishedAt: string; mode: string }>;
};

type ParsedArticle = {
  title: string;
  body: string;
  meta: Record<string, string>;
};

type EditorStats = {
  images: number;
  moneyLinks: number;
  hasImageUnderTitleCta: boolean;
};

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OUTPUT_DIR = process.env.NOTE_OUTPUT_DIR || join(ROOT, 'note_articles', 'generated');
const STATE_PATH = process.env.NOTE_STATE_PATH || join(ROOT, 'note_articles', 'publish-state.json');
const STORAGE_PATH = process.env.NOTE_STORAGE_STATE_PATH || join(ROOT, '.auth', 'note-storage-state.json');
const HEADLESS = process.env.NOTE_HEADLESS !== 'false';
const PUBLISH_MODE = process.env.NOTE_PUBLISH_MODE || 'draft';
const BROWSER_CHANNEL = process.env.NOTE_BROWSER_CHANNEL;
const USER_AGENT =
  process.env.NOTE_USER_AGENT ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';
const CTA_IMAGE_PATH = process.env.NOTE_CTA_IMAGE_PATH || join(ROOT, 'note_articles', 'assets', 'cta-saimu-compare.png');
const CTA_IMAGE_URL =
  process.env.NOTE_CTA_IMAGE_URL || 'https://assets.st-note.com/img/1781615773-X3nNeslxyFdOLIkoPbVjSugH.png';

function readState(): PublishState {
  if (!existsSync(STATE_PATH)) return { published: {} };
  return JSON.parse(readFileSync(STATE_PATH, 'utf-8')) as PublishState;
}

function writeState(state: PublishState): void {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf-8');
}

function listArticles(state: PublishState): string[] {
  if (process.env.NOTE_ARTICLE_PATH) return [process.env.NOTE_ARTICLE_PATH];
  if (!existsSync(OUTPUT_DIR)) return [];
  return readdirSync(OUTPUT_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => join(OUTPUT_DIR, file))
    .filter((path) => !state.published[basename(path)]);
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
  const match = raw.match(/^#\s+(.+)$/m);
  const title = match?.[1]?.trim() || '債務整理の相談先を比較';
  const body = raw.replace(/^#\s+.+\n?/, '').trim();
  return { title, body, meta };
}

function textLength(text: string): number {
  return text.replace(/\s+/g, '').length;
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function assertSeoReadyForPublish(articlePath: string, title: string, body: string, meta: Record<string, string>): void {
  if (PUBLISH_MODE !== 'publish' || process.env.NOTE_STRICT_SEO_CHECK === 'false') return;

  const primaryKeyword = meta.primaryKeyword;
  const errors: string[] = [];

  if (meta.provider === 'template' && process.env.NOTE_ALLOW_TEMPLATE_PUBLISH !== 'true') {
    errors.push('template-generated article');
  }
  if (primaryKeyword && !title.includes(primaryKeyword)) {
    errors.push(`title does not include primaryKeyword: ${primaryKeyword}`);
  }
  if (primaryKeyword && !body.slice(0, 700).includes(primaryKeyword)) {
    errors.push(`lead does not include primaryKeyword near the top: ${primaryKeyword}`);
  }
  if (textLength(body) < 2400) {
    errors.push('body is too short for an SEO article');
  }
  if (!hasAny(body, [/検索意図/, /先出し回答/, /結論/, /まず確認/])) {
    errors.push('missing search-intent answer section');
  }
  if (!hasAny(body, [/比較/, /他の候補/, /他事務所/])) {
    errors.push('missing comparison angle');
  }
  if (!hasAny(body, [/費用/, /料金/, /着手金/, /報酬/])) {
    errors.push('missing fee angle');
  }
  if (!hasAny(body, [/公式サイト/, /無料相談/, /相談時/])) {
    errors.push('missing official/free-consultation confirmation angle');
  }

  if (errors.length) {
    throw new Error(
      `SEO quality gate failed for ${articlePath}: ${errors.join(', ')}. ` +
        'Review or regenerate the article before publishing.',
    );
  }
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

    if (/^>\s+/.test(line)) {
      const quoteLines = [line.replace(/^>\s+/, '')];
      while (i + 1 < lines.length && /^>\s+/.test(lines[i + 1])) {
        quoteLines.push(lines[++i].replace(/^>\s+/, ''));
      }
      html.push(`<blockquote>${quoteLines.map((q) => `<p>${inlineMarkdown(q)}</p>`).join('')}</blockquote>`);
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
      !/^>\s+/.test(lines[i + 1]) &&
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

async function writeStorageSecret(): Promise<string | undefined> {
  const json = process.env.NOTE_STORAGE_STATE_JSON;
  if (!json) return existsSync(STORAGE_PATH) ? STORAGE_PATH : undefined;
  mkdirSync(join(STORAGE_PATH, '..'), { recursive: true });
  writeFileSync(STORAGE_PATH, json, 'utf-8');
  return STORAGE_PATH;
}

async function maybeLogin(page: any): Promise<void> {
  await page.goto('https://note.com/login', { waitUntil: 'domcontentloaded' });
  if (!/login/.test(page.url())) return;

  const email = process.env.NOTE_EMAIL;
  const password = process.env.NOTE_PASSWORD;
  if (!email || !password) {
    throw new Error('NOTE_STORAGE_STATE_JSON or NOTE_EMAIL/NOTE_PASSWORD is required');
  }

  const emailInput = page.locator('input[type="email"], input[name="email"], input[autocomplete="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.getByRole('button', { name: /ログイン|Log in|Login/i }).click();
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  if (/login/.test(page.url())) {
    throw new Error('note login did not complete. MFA or CAPTCHA may require NOTE_STORAGE_STATE_JSON.');
  }
}

async function fillEditable(page: any, label: 'title' | 'body', text: string): Promise<void> {
  const selectors =
    label === 'title'
      ? [
          'textarea[placeholder="記事タイトル"]',
          'textarea[placeholder*="タイトル"]',
          'input[placeholder*="タイトル"]',
          '[contenteditable="true"][aria-label*="タイトル"]',
          '[contenteditable="true"]',
        ]
      : ['.ProseMirror[contenteditable="true"]', '[role="textbox"][contenteditable="true"]', '[contenteditable="true"]'];

  const locators = selectors.map((selector) => page.locator(selector));
  for (const locator of locators) {
    const count = await locator.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      const el = locator.nth(i);
      if (!(await el.isVisible().catch(() => false))) continue;
      await el.click();
      const tagName = await el.evaluate((node: HTMLElement) => node.tagName.toLowerCase());
      if (tagName === 'textarea' || tagName === 'input') {
        await el.fill(text);
      } else {
        const html = label === 'body' ? `${ctaImageHtml()}\n${markdownToHtml(text)}` : markdownToHtml(text);
        await el.evaluate(
          (node: HTMLElement, payload: { text: string; html: string }) => {
            node.focus();
            const data = new DataTransfer();
            data.setData('text/plain', payload.text);
            data.setData('text/html', payload.html);
            const event = new ClipboardEvent('paste', {
              bubbles: true,
              cancelable: true,
              clipboardData: data,
            });
            node.dispatchEvent(event);
          },
          { text, html },
        );
      }
      return;
    }
  }
  throw new Error(`Could not find note ${label} editor`);
}

async function clickIfExists(page: any, name: RegExp): Promise<boolean> {
  const button = page.getByRole('button', { name }).first();
  if (!(await button.isVisible().catch(() => false))) return false;
  await button.click();
  return true;
}

function extractNoteId(url: string): string | undefined {
  return url.match(/\/notes\/(n[a-z0-9]+)/)?.[1] || url.match(/\/n\/(n[a-z0-9]+)/)?.[1];
}

async function getEditorStats(page: any): Promise<EditorStats> {
  return page.evaluate(() => {
    const editor = document.querySelector('.ProseMirror[contenteditable="true"]');
    const text = editor?.textContent || '';
    return {
      images: editor?.querySelectorAll('img').length || 0,
      moneyLinks: editor?.querySelectorAll('a[href*="vpscomparehub.com/money"]').length || 0,
      hasImageUnderTitleCta: text.includes('相談先を選ぶ前に、他の候補と比較しておく'),
    };
  });
}

async function insertCtaImageIfAvailable(page: any): Promise<void> {
  if (!existsSync(CTA_IMAGE_PATH)) return;
  const editor = page.locator('.ProseMirror[contenteditable="true"]').first();
  if (!(await editor.isVisible().catch(() => false))) return;
  const imageBase64 = readFileSync(CTA_IMAGE_PATH).toString('base64');
  await editor.click();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Home' : 'Control+Home').catch(() => {});
  await editor.evaluate(
    (node: HTMLElement, payload: { base64: string; fileName: string }) => {
      node.focus();
      const range = document.createRange();
      if (node.firstChild) {
        range.setStartBefore(node.firstChild);
      } else {
        range.selectNodeContents(node);
        range.collapse(true);
      }
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      const binary = atob(payload.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const file = new File([bytes], payload.fileName, { type: 'image/png' });
      const data = new DataTransfer();
      data.items.add(file);
      node.dispatchEvent(
        new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: data,
        }),
      );
    },
    { base64: imageBase64, fileName: basename(CTA_IMAGE_PATH) },
  );
  await page.waitForTimeout(8000);
  await page.keyboard.press('End').catch(() => {});
  await page.keyboard.press('Enter').catch(() => {});
}

async function assertPublishReady(page: any): Promise<void> {
  const stats = await getEditorStats(page);
  if (existsSync(CTA_IMAGE_PATH) && stats.images < 1) {
    throw new Error('CTA image was not inserted. Aborting before publish.');
  }
  if (!stats.hasImageUnderTitleCta) {
    throw new Error('Image-under-title CTA block is missing. Aborting before publish.');
  }
  if (stats.moneyLinks < 1) {
    throw new Error('Comparison LP CTA link is missing. Aborting before publish.');
  }
}

async function resolvePublicUrl(page: any, editorUrl: string): Promise<string> {
  const noteId = extractNoteId(editorUrl);
  if (!noteId) return page.url();
  await page.goto(`https://note.com/notes/${noteId}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(2500);
  return page.url();
}

async function publishOne(articlePath: string): Promise<{ title: string; url?: string }> {
  const storageState = await writeStorageSecret();
  const contextOptions: BrowserContextOptions = { userAgent: USER_AGENT };
  if (storageState) contextOptions.storageState = storageState;

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
  await context
    .grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://editor.note.com' })
    .catch(() => {});
  const page = await context.newPage();

  try {
    if (!storageState) await maybeLogin(page);
    const { title, body, meta } = parseArticle(articlePath);
    assertSeoReadyForPublish(articlePath, title, body, meta);
    await page.goto('https://note.com/notes/new', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/editor\.note\.com\/(new|notes\/.+\/edit)/, { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('textarea[placeholder*="タイトル"], .ProseMirror[contenteditable="true"]', {
      timeout: 45000,
    });
    await fillEditable(page, 'title', title);
    await fillEditable(page, 'body', body);
    await assertPublishReady(page);
    await page.waitForTimeout(1500);
    await clickIfExists(page, /一時保存|下書き保存|保存/i);
    await page.waitForTimeout(5000);

    if (PUBLISH_MODE === 'publish') {
      const editorUrl = page.url();
      await clickIfExists(page, /公開に進む|公開設定|公開|Publish/i);
      await page.waitForURL(/\/publish\//, { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2500);
      await clickIfExists(page, /投稿する|更新する|公開する|Publish/i);
      await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(6000);
      const publicUrl = await resolvePublicUrl(page, editorUrl);
      await context.storageState({ path: STORAGE_PATH }).catch(() => {});
      return { title, url: publicUrl };
    }

    const url = page.url();
    await context.storageState({ path: STORAGE_PATH }).catch(() => {});
    return { title, url };
  } finally {
    await browser.close();
  }
}

async function main() {
  const state = readState();
  const articles = listArticles(state);
  const article = articles[0];
  if (!article) {
    console.log('[note:publish] no unpublished article');
    return;
  }

  const result = await publishOne(article);
  state.published[basename(article)] = {
    title: result.title,
    url: result.url,
    publishedAt: new Date().toISOString(),
    mode: PUBLISH_MODE,
  };
  writeState(state);
  console.log(`[note:publish] ${PUBLISH_MODE}: ${result.title} ${result.url || ''}`);
}

main().catch((err) => {
  console.error('[note:publish] failed:', err);
  process.exit(1);
});
