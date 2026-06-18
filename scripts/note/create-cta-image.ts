import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OUTPUT = process.env.NOTE_CTA_IMAGE_PATH || join(ROOT, 'note_articles', 'assets', 'cta-saimu-compare.png');

const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: 1200px;
      height: 630px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f7fafc;
      color: #172033;
    }
    .card {
      width: 1200px;
      height: 630px;
      padding: 64px 72px;
      background:
        linear-gradient(135deg, rgba(20, 83, 45, 0.10), rgba(37, 99, 235, 0.08)),
        #ffffff;
      border: 1px solid #d8e0ea;
    }
    .eyebrow {
      display: inline-block;
      padding: 10px 18px;
      border-radius: 999px;
      background: #e8f5ee;
      color: #17633a;
      font-weight: 800;
      font-size: 28px;
      margin-bottom: 28px;
    }
    h1 {
      margin: 0;
      font-size: 64px;
      line-height: 1.18;
      letter-spacing: 0;
      color: #101828;
    }
    .lead {
      margin-top: 28px;
      font-size: 34px;
      line-height: 1.45;
      color: #39465b;
      font-weight: 600;
    }
    .badges {
      display: flex;
      gap: 16px;
      margin-top: 36px;
      flex-wrap: wrap;
    }
    .badge {
      padding: 14px 20px;
      border-radius: 10px;
      background: #f1f5f9;
      color: #243247;
      font-size: 26px;
      font-weight: 700;
    }
    .button {
      display: inline-block;
      margin-top: 40px;
      padding: 20px 38px;
      border-radius: 12px;
      background: #0f766e;
      color: white;
      font-size: 34px;
      font-weight: 900;
      box-shadow: 0 12px 26px rgba(15, 118, 110, 0.24);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="eyebrow">相談前に3社比較</div>
    <h1>債務整理の相談先は<br>比較してから選ぶ</h1>
    <div class="lead">無料相談・費用・対応範囲・分割払いを<br>まとめて確認できます。</div>
    <div class="badges">
      <div class="badge">無料相談</div>
      <div class="badge">全国対応</div>
      <div class="badge">費用比較</div>
      <div class="badge">家族/職場への配慮</div>
    </div>
    <div class="button">相談先を比較する</div>
  </div>
</body>
</html>`;

async function main() {
  mkdirSync(dirname(OUTPUT), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  const buffer = await page.screenshot({ type: 'png' });
  writeFileSync(OUTPUT, buffer);
  await browser.close();
  console.log(`[note:cta] wrote ${OUTPUT}`);
}

main().catch((err) => {
  console.error('[note:cta] failed:', err);
  process.exit(1);
});
