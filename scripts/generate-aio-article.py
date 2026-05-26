#!/usr/bin/env python3
"""
AIO最適化コラム記事自動生成スクリプト

Usage:
  python scripts/generate-aio-article.py                         # topics.jsonから自動選択
  python scripts/generate-aio-article.py --topic "テーマ"        # テーマ指定
  python scripts/generate-aio-article.py --topic "テーマ" --category comparison --cv-type lawyer
"""

import anthropic
import json
import os
import re
import sys
import argparse
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COLUMNS_FILE = ROOT / "src" / "data" / "detective-columns.js"
TOPICS_FILE = Path(__file__).resolve().parent / "topics.json"

CATEGORY_LABELS = {
    "experience": "体験談",
    "comparison": "選択肢比較",
    "mental": "メンタル",
}

INTERNAL_LINKS = """
- /detective/ — TOP（中の人ナビ）
- /detective/flow/ — どれから始める？ガイド
- /detective/column/ — コラム一覧
- /detective/gps/ — GPS活用ガイド（設置条件・法的注意点）
- /detective/lawyer/ — 弁護士相談ガイド（タイミング・費用）
- /detective/uranai/ — 電話占いガイド（気持ちの整理）
- /detective/#ranking — 探偵社比較ランキング
- /detective/about/ — 中の人プロフィール
"""


def build_prompt(topic: str, category: str, cv_type: str) -> str:
    cat_label = CATEGORY_LABELS[category]
    return f"""あなたは「中の人ナビ」のコラムライターです。

**著者プロフィール**
「弁護士の中の人」——法律事務所で約10年間事務員として勤務し、何百件もの浮気・離婚・慰謝料案件を間近で見てきた。弁護士ではないため法的アドバイスは行わず、実体験・事務員目線の情報を正直に発信している。

---

## 生成する記事のテーマ
{topic}

カテゴリ: {category}（{cat_label}）
CV誘導先: {cv_type}

---

## AIO最適化ルール（必須・全項目厳守）

1. **BLUF構造（最重要）**
   - 各H2の直下1文目が直接回答。前置き・文脈説明を一切入れない
   - ✅「答えから言うと、〇〇です。理由は〜」
   - ❌「多くの方が疑問に思うことですが、実は〜」

2. **見出しの70%以上を疑問形に**
   - 「〜とは？」「なぜ〜なのか？」「〜するとどうなる？」「〜と〜の違いは？」

3. **セクション長の最適化**
   - H2セクション：100〜300語（AIの引用率が最も高い範囲）
   - 段落：50〜150語・最大4文
   - 各段落は単独で引用されうる完結した内容に

4. **リスト率40〜60%**
   - 手順→番号付きリスト、選択肢・特徴→箇条書き（3〜7項目）
   - 各bullet pointは独立して引用可能な1つの事実

5. **数値・具体的データを必ず含める**
   - 「多い」→「約7割のケースで〜」「相場は40〜60万円程度」

6. **E-E-A-T信号**
   - col-leadで事務所での実体験・経験件数に言及
   - col-episodeで具体的な1場面を生き生きと描写（登場人物の台詞・状況を含む）

7. **FAQセクションを必ず末尾に**
   - 3〜5問、各回答40〜80語（AI直接引用できるサイズ）
   - FAQの見出し前にcol-divider-ornamentを入れる

8. **デッドゾーン回避**
   - 全コンテンツの先頭30%に重要な回答を集中（中間60%に埋めない）

---

## 使用するHTMLコンポーネント

```
<p class="col-lead">冒頭リード文（著者の実体験）</p>

<div class="col-toc">
  <div class="col-toc-title">この記事の内容</div>
  <ol><li><a href="#p1">見出し</a></li>...</ol>
</div>

<h2 id="p1"><span class="col-pattern-icon">✅</span>見出し（疑問形）</h2>

<div class="col-point">
  <div class="col-point-title">ここがポイント</div>
  <ul><li>...</li></ul>
</div>

<div class="col-warn">
  <div class="col-warn-title">注意</div>
  <p>...</p>
</div>

<div class="col-check">
  <div class="col-check-title">確認</div>
  <p>...</p>
</div>

<div class="col-episode">
  <p>事務所での具体的な場面描写（台詞・状況を含む）</p>
</div>

<div class="col-quote">印象的な一言・格言</div>

<div class="col-table-wrap">
  <table class="col-table">
    <thead><tr><th>項目</th><th>A</th><th>B</th></tr></thead>
    <tbody><tr><td>...</td><td>...</td><td>...</td></tr></tbody>
  </table>
</div>

<div class="col-conclusion">
  <h3>まとめ</h3>
  <p>直接回答・数値・次のアクション</p>
</div>

<div class="col-divider-ornament"></div>

<p class="col-cta-lead">関連ページへのリンクを含む誘導文</p>
```

---

## 内部リンク（適切な箇所で自然に使用）
{INTERNAL_LINKS}

---

## 出力形式（必ずこの形式のみで出力。他のテキスト一切不要）

===JSON_START===
{{
  "slug": "kebab-case-英数字とハイフンのみ-20文字以内",
  "title": "記事タイトル（疑問形推奨）",
  "category": "{category}",
  "categoryLabel": "{cat_label}",
  "excerpt": "120〜160文字の要約。最初の文が直接回答になるように。",
  "readingTime": 8,
  "cvType": "{cv_type}",
  "faqSchema": [
    {{"q": "質問1（疑問形）", "a": "回答1（40〜80語の直接回答）"}},
    {{"q": "質問2", "a": "回答2"}},
    {{"q": "質問3", "a": "回答3"}}
  ]
}}
===JSON_END===
===BODY_START===
[ここにHTML記事本文。ダブルクォートはそのまま使用可能。バックティック文字（`）は使用しないこと。]
===BODY_END==="""


def parse_response(text: str) -> dict:
    json_match = re.search(r'===JSON_START===\s*(.*?)\s*===JSON_END===', text, re.DOTALL)
    body_match = re.search(r'===BODY_START===\s*(.*?)\s*===BODY_END===', text, re.DOTALL)

    if not json_match:
        raise ValueError("===JSON_START=== / ===JSON_END=== が見つかりません")
    if not body_match:
        raise ValueError("===BODY_START=== / ===BODY_END=== が見つかりません")

    data = json.loads(json_match.group(1))
    data['body'] = body_match.group(1).strip()
    return data


def get_existing_slugs() -> set:
    content = COLUMNS_FILE.read_text('utf-8')
    return set(re.findall(r"slug:\s*'([^']+)'", content))


def make_unique_slug(slug: str, existing: set) -> str:
    if slug not in existing:
        return slug
    i = 2
    while f"{slug}-{i}" in existing:
        i += 1
    return f"{slug}-{i}"


def format_js_object(data: dict) -> str:
    today = date.today().isoformat()
    # Escape for JS template literal
    body = data['body'].replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')

    faq_lines = ',\n    '.join(
        f'{{ q: {json.dumps(item["q"], ensure_ascii=False)}, a: {json.dumps(item["a"], ensure_ascii=False)} }}'
        for item in data.get('faqSchema', [])
    )

    return f"""  {{
    slug: '{data["slug"]}',
    title: {json.dumps(data["title"], ensure_ascii=False)},
    category: '{data["category"]}',
    categoryLabel: '{data["categoryLabel"]}',
    published: '{today}',
    excerpt: {json.dumps(data["excerpt"], ensure_ascii=False)},
    readingTime: {data["readingTime"]},
    cvType: '{data["cvType"]}',
    faqSchema: [
    {faq_lines}
    ],
    body: `{body}`
  }}"""


def insert_article(js_object: str) -> None:
    content = COLUMNS_FILE.read_text('utf-8')
    pos = content.rfind('\n];')
    if pos == -1:
        raise ValueError(f"columns配列の末尾 (];) が見つかりません: {COLUMNS_FILE}")
    new_content = content[:pos] + ',\n' + js_object + content[pos:]
    COLUMNS_FILE.write_text(new_content, 'utf-8')


def mark_topic_used(topic: str) -> None:
    with open(TOPICS_FILE, encoding='utf-8') as f:
        topics = json.load(f)
    for t in topics:
        if t['topic'] == topic:
            t['used'] = True
            break
    with open(TOPICS_FILE, 'w', encoding='utf-8') as f:
        json.dump(topics, f, ensure_ascii=False, indent=2)


def write_github_output(key: str, value: str) -> None:
    gho = os.environ.get('GITHUB_OUTPUT', '')
    if gho:
        with open(gho, 'a', encoding='utf-8') as f:
            f.write(f"{key}={value}\n")


def main() -> None:
    parser = argparse.ArgumentParser(description='AIO最適化コラム記事生成')
    parser.add_argument('--topic', help='記事テーマ（未指定時はtopics.jsonから選択）')
    parser.add_argument('--category', default='comparison',
                        choices=['experience', 'comparison', 'mental'])
    parser.add_argument('--cv-type', default='all',
                        choices=['detective', 'gps', 'lawyer', 'uranai', 'all'])
    args = parser.parse_args()

    # トピック選択
    manual = bool(args.topic)
    if manual:
        topic, category, cv_type = args.topic, args.category, args.cv_type
    else:
        with open(TOPICS_FILE, encoding='utf-8') as f:
            topics = json.load(f)
        item = next((t for t in topics if not t.get('used')), None)
        if not item:
            print("全トピック使用済み。scripts/topics.json に追加してください。")
            sys.exit(0)
        topic = item['topic']
        category = item.get('category', 'comparison')
        cv_type = item.get('cvType', 'all')

    print(f"📝 生成中: {topic}")
    print(f"   カテゴリ: {category} / CV: {cv_type}")

    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY が設定されていません")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)
    response = client.messages.create(
        model='claude-sonnet-4-6',
        max_tokens=8000,
        messages=[{'role': 'user', 'content': build_prompt(topic, category, cv_type)}]
    )

    raw = response.content[0].text
    data = parse_response(raw)

    # スラッグ重複チェック
    existing_slugs = get_existing_slugs()
    data['slug'] = make_unique_slug(data['slug'], existing_slugs)

    js_object = format_js_object(data)
    insert_article(js_object)

    if not manual:
        mark_topic_used(topic)

    print(f"✅ 追加完了: {data['slug']}")
    print(f"   タイトル: {data['title']}")
    print(f"   FAQ: {len(data.get('faqSchema', []))}問")
    print(f"   使用トークン: {response.usage.input_tokens + response.usage.output_tokens}")

    write_github_output('slug', data['slug'])
    write_github_output('title', data['title'])


if __name__ == '__main__':
    main()
