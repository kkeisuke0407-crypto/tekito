# note記事自動生成・投稿パイプライン

このワークフローは、`note_articles/targets.json` から未生成の小中規模法律事務所・司法書士事務所を1件選び、AIでMarkdown記事を生成し、Playwrightでnoteへ投稿します。

## 仕組み

1. Google検索画面をブラウザ操作し、事務所名のサジェスト/関連検索/質問系KWを調査
2. `npm run note:generate` が `note_articles/generated/` にMarkdownを保存
3. `npm run note:quality` でSEO品質と重複感をチェック
4. `npm run note:publish` が未投稿Markdownをnoteエディタへ投入
5. `.github/workflows/daily-note-publish.yml` が毎日11:00 / 14:00 / 16:00 / 18:00 / 21:00 JSTに実行

現在の標準設定では、`RAKKO_API_KEY` がなくてもGoogleサジェスト調査を行います。ラッコAPIを使う場合だけ `NOTE_KEYWORD_SELECTION=api` を指定します。

## GitHub Variables

| Name | Example | Required |
|---|---|---|
| `ENABLE_NOTE_AUTOMATION` | `true` / `false` | no |
| `AI_PROVIDER` | `openai` or `anthropic` | no |
| `OPENAI_MODEL` | `gpt-4.1-mini` | no |
| `ANTHROPIC_MODEL` | `claude-3-5-haiku-latest` | no |
| `NOTE_COMPARISON_URL` | `https://vpscomparehub.com/money/` | yes |
| `NOTE_PUBLISH_MODE` | `publish` or `draft` | yes |
| `NOTE_KEYWORD_SELECTION` | `google` / `none` / `browser` / `api` | no |
| `RAKKO_USE_EXPANSION` | `true` | no |
| `RAKKO_USE_OTHER_KEYWORDS` | `false` | no |
| `RAKKO_EXPAND_LIMIT` | `50` | no |
| `RAKKO_MAX_TARGETS` | `30` | no |
| `RAKKO_MIN_VOLUME` | `0` | no |
| `RAKKO_MAX_VOLUME` | `1000` | no |
| `RAKKO_MAX_SEO_DIFFICULTY` | `45` | no |
| `RAKKO_BROWSER_HEADLESS` | `true` | no |
| `RAKKO_BROWSER_MAX_TARGETS` | `15` | no |
| `RAKKO_BROWSER_MODES` | `suggestKeywords,relatedKeywords` | no |
| `RAKKO_BROWSER_USE_SHORT_NAMES` | `false` | no |
| `GOOGLE_BROWSER_HEADLESS` | `true` | no |
| `GOOGLE_BROWSER_MAX_TARGETS` | `1` | no |
| `GOOGLE_BROWSER_USE_SHORT_NAMES` | `false` | no |
| `GOOGLE_SUGGESTION_PROBES` | `10` | no |

現在の自動運用では、GitHub Actions上のデフォルトを `publish` にしています。確認運用に戻す場合は GitHub Variables で `NOTE_PUBLISH_MODE=draft` を設定します。

## GitHub Secrets

AIはどちらか一方で動きます。

| Name | Purpose |
|---|---|
| `OPENAI_API_KEY` | OpenAIで記事生成する場合 |
| `ANTHROPIC_API_KEY` | Claudeで記事生成する場合 |
| `RAKKO_API_KEY` | 記事生成前にラッコキーワードAPIで候補KWを選定する場合 |
| `NOTE_STORAGE_STATE_JSON` | noteログイン済みPlaywright storageState |
| `NOTE_EMAIL` | storageStateを使わない場合のnoteログインメール |
| `NOTE_PASSWORD` | storageStateを使わない場合のnoteログインパスワード |

noteはMFAやCAPTCHAが入ることがあるため、`NOTE_STORAGE_STATE_JSON` の利用を推奨します。

## ローカル実行

```bash
npm run note:auto
```

`note:auto` は以下を順番に実行します。

1. Googleサジェスト/関連検索からKW候補を取得
2. 勝てそうで成約意図があるKWをスコアリング
3. 未生成ターゲットから1記事生成
4. 品質チェック
5. noteへ下書き保存または公開

手動で分割実行する場合:

```bash
npm run note:select-keywords:google
npm run note:generate
npm run note:quality
npm run note:publish
```

ラッコキーワードAPIを使う場合:

```bash
NOTE_KEYWORD_SELECTION=api RAKKO_API_KEY=xxxx npm run note:auto
```

ラッコキーワードの画面操作で取得する場合:

```bash
npm run note:select-keywords:browser
```

ブラウザ版は、ラッコの結果画面で `データ出力 → CSV` を試し、ダウンロードできない場合は表示テーブルから候補KWを抽出します。無料/未ログイン状態では検索ボリューム・SEO難易度が空欄になりやすいため、その場合は `note向き候補` として仮判定し、成約意図を中心にスコアリングします。

ログインが必要な場合は、初回だけ表示ブラウザで実行してください。

```bash
RAKKO_BROWSER_HEADLESS=false npm run note:select-keywords:browser
```

Google検索画面で取得する場合:

```bash
npm run note:select-keywords:google
```

Google版は、事務所名をGoogle検索窓に入力してサジェストを確認し、検索結果ページの関連検索・質問系の文言も拾います。検索ボリュームやSEO難易度は取得できませんが、実際にGoogle上で出る指名周辺KWを拾えるため、note記事の初期検証に向いています。

日次パイプラインでGoogle版を使う場合:

```bash
npm run note:daily
```

Googleは短時間に大量アクセスすると確認画面やCAPTCHAが出る場合があります。自動投稿用途では `GOOGLE_BROWSER_MAX_TARGETS=1` のまま、1回1事務所で回してください。候補調査だけ広げたい時のみ一時的に `GOOGLE_BROWSER_MAX_TARGETS=3` などを指定します。

出力:

- `note_articles/keyword-opportunities.json`
- `note_articles/keyword-opportunities.csv`

記事生成時は、`keyword-opportunities.json` が存在する場合、優先度が高く未生成の事務所KWから選ばれます。無効化したい場合は `NOTE_USE_RAKKO_SELECTION=false` を指定します。

## キーワード選定ロジック

`note:select-keywords` / `note:select-keywords:browser` / `note:select-keywords:google` は、まず `targets.json` の各事務所名を検索し、サジェスト/関連キーワードから実際に検索される候補を拾います。

重視するKW:

- 口コミ・評判
- 費用・料金・着手金・分割
- 怪しい・しつこい・電話
- 任意整理・債務整理・自己破産・個人再生
- 相談・無料相談・依頼
- 家族/職場にバレる不安

優先度は以下で決めます。

- `note勝ちやすさ`: SEO難易度45以下を基本ライン、30以下は強く評価
- `成約意図`: 費用/相談/任意整理/依頼系を強、口コミ/評判/怪しい系を中として評価
- `検索ボリューム`: 10〜300を最も評価。大きすぎるKWはnoteでは避ける
- `ラッコ由来`: 手作りseedより、ラッコのサジェスト/関連KWで出たものを優先
- `ノイズ除去`: デフォルトではフル事務所名を含むKWのみ採用。略称調査は `RAKKO_BROWSER_USE_SHORT_NAMES=true` の時だけ使う

CSVには `commercialIntent` と `winability` が出ます。まずは `★★★★☆` 以上、または `★★★☆☆` でも `成約意図:強` のKWから記事化してください。

noteのGoogleログインはPlaywright/Chromium経由だとGoogle側にブロックされる場合があります。その場合は、note側でメールアドレス/パスワードログインを設定して `NOTE_EMAIL` / `NOTE_PASSWORD` を使うか、通常Chrome/EdgeでstorageStateを保存します。

```bash
# 通常Chromeでログイン状態を保存
NOTE_AUTH_CHANNEL=chrome npm run note:auth

# Microsoft Edgeでログイン状態を保存
NOTE_AUTH_CHANNEL=msedge npm run note:auth
```

特定ターゲットだけ生成する場合:

```bash
NOTE_TARGET_SLUG=kogawa-houmu-review npm run note:generate
```

## 品質ルール

- テンプレート生成記事は投稿フロー検証専用。本公開には使わない
- `NOTE_PUBLISH_MODE=publish` では、`provider: template` のMarkdownは原則公開できない
- 1記事1検索意図にする。同じ事務所でも「口コミ」「費用」「怪しい/しつこい」「任意整理」は別設計にする
- H2の順序を全記事で固定しない
- タイトルと冒頭150文字以内に主KWを自然に入れる
- 冒頭で検索意図に答える。ただし公開記事の見出しは「口コミを見る前に確認したいこと」「評判だけで判断する前に」など、読者向けに自然な表現にする
- 事務所名だけを差し替えたような一般論でH2を埋めない
- 費用・対応範囲・連絡方法・公式確認・他事務所比較の観点を入れる
- 架空口コミは生成しない
- 口コミは「見るべき観点」として扱う
- 「怪しい」「やばい」は断定しない
- 断定的な法律助言にしない
- 比較LPへのCTAは画像直下、リード直下、口コミ後、費用後、記事末に入れる
- 投稿前にCTA画像、画像直下CTA、比較LPリンクの存在をチェックする
- CTA画像が入らない場合は公開せずエラーで止める
- CTA画像は本文HTMLの先頭に挿入する。カーソル位置への画像貼り付けは、note側で末尾にずれることがあるため使わない

`npm run note:quality` は、通常は未公開の生成済み記事だけを確認します。公開済みも含めて全件監査する場合は `NOTE_QUALITY_INCLUDE_PUBLISHED=true npm run note:quality` を使います。以下を満たさない記事は失敗にします。

- `provider: template` ではない
- 主KWがタイトルと冒頭に入っている
- 本文量がSEO記事として短すぎない
- 検索意図への回答がある。内部チェックでは「口コミを見る前」「相談前に確認」など自然な見出しも許可する
- 比較・費用・公式確認の観点がある
- 複数記事で見出し構造やタイトルが似すぎていない

## note公開時のチェック

`npm run note:publish` は、公開前に以下を自動確認します。

- CTA画像が本文内に1枚以上ある
- 画像直下CTA「相談先を選ぶ前に、他の候補と比較しておく」がある
- 比較LPへのリンクが1本以上ある

`NOTE_PUBLISH_MODE=publish` の場合は、公開設定画面で `投稿する` または `更新する` まで進め、`publish-state.json` には公開ページURLを保存します。
