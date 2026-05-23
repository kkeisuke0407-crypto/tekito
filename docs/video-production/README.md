# TikTok広告 動画制作素材集

弁護士退職代行（ガイア名なし版）のTikTok広告動画5本分の制作素材。

## ファイル構成

```
docs/video-production/
├── README.md                       ← このファイル
├── script-01-news.md               ← マスタードキュメント
├── script-01-news.srt              ← CapCutインポート用字幕
├── script-02-numbers.md
├── script-02-numbers.srt
├── script-03-ugc.md
├── script-03-ugc.srt
├── script-04-line.md
├── script-04-line.srt
└── script-05-three-options.md
    script-05-three-options.srt
```

## 各台本の比較

| # | タイトル | 制作難易度 | 必要素材 | 推奨配信比率 |
|---|---------|-----------|---------|------------|
| ① | ニュース風×逮捕事件 | ★☆☆ | スライド + VOICEVOX | 30% |
| ② | 数字×権威 30.4% | ★☆☆ | スライド + VOICEVOX | 20% |
| ③ | 自撮りUGC共感型 | ★★★ | **演者必要** | 30% |
| ④ | LINEモック型 | ★★☆ | LINE風モック + VOICEVOX | 10% |
| ⑤ | 3つの選択肢比較 | ★☆☆ | スライド + VOICEVOX | 10% |

**最速制作順:** ① → ② → ⑤ → ④ → ③（演者必要なため）

---

## 制作ツール一覧

### 必須（無料）
| 用途 | ツール | URL |
|------|--------|-----|
| 動画編集 | CapCut Desktop | https://www.capcut.com/ |
| ナレーション | VOICEVOX | https://voicevox.hiroshiba.jp/ |
| スライド作成 | Canva | https://www.canva.com/ |

### あるとなお良し
| 用途 | ツール |
|------|--------|
| LINE風モック作成 | Fake Chat Maker (https://fakedetail.com/) |
| 無料BGM/SE | TikTok Creative Center / DOVA-SYNDROME |
| iPhone画面モック | Canvaの「Mockup」テンプレ |

---

## 制作手順（全体フロー）

### Step 1. ナレーション音声を作る（VOICEVOX）
1. VOICEVOXを起動
2. 各 `script-XX-*.md` の「VOICEVOX用ナレーション原稿」セクションを開く
3. 推奨スピーカー・速度設定でセリフを生成
4. wav書き出し → `assets/audio/script-XX-line-Y.wav` 形式で保存

### Step 2. スライド画像を作る（Canva）
1. Canvaで「TikTok動画」テンプレ（1080×1920）を作成
2. 各 `script-XX-*.md` の「スライド仕様」セクション通りに作成
3. 1枚ずつPNG書き出し → `assets/slides/script-XX-slide-Y.png`

### Step 3. CapCutで組み立て
1. 新規プロジェクト: 1080×1920 / 30fps / 15秒
2. スライド画像をタイムラインに並べる
3. ナレーションwavを配置
4. SRTファイルをインポート（字幕→ローカル字幕）
5. BGM追加（CapCut素材ライブラリから）
6. 書き出し: MP4 / 1080P / 30fps

### Step 4. 動画チェック（書き出し前）
- [ ] 各 `script-XX-*.md` のチェックリストを確認
- [ ] ガイア名（テキスト・音声）が一切ない
- [ ] 15秒ジャスト
- [ ] CTAが最後3秒に固定で出ている
- [ ] 出典クレジット（※○○調査）が明記されている

---

## VOICEVOX推奨スピーカーまとめ

| 台本 | スピーカー | 速度 | 印象 |
|------|----------|------|------|
| ① ニュース風 | 玄野武宏（ノーマル） | 1.05 | 男性アナウンサー風 |
| ② 数字×権威 | 四国めたん（ノーマル） | 1.0 | 落ち着いた女性 |
| ③ UGC | **演者本人** | - | 合成音声NG |
| ④ LINEモック | 春日部つむぎ（ノーマル） | 1.0 | 落ち着いた女性 |
| ⑤ 3つの選択肢 | 玄野武宏（ノーマル） | 1.0 | 男性アナウンサー風 |

---

## NGワード再確認（全動画共通）

### ❌ 絶対NG
- 弁護士法人ガイア / ガイア / Gaia
- 100%辞められる / 絶対辞められる
- 業界No.1 / 最安
- 他社名直接批判（モームリ・EXIT・みやび等）
- 「ブラック企業から逃げよう」「クズ上司」など過激表現
- 「うつになる前に」など健康断定

### ✅ OKフレーズ
- 「弁護士による退職代行」
- 「ある弁護士法人の退職代行」
- 「弁護士運営の退職代行」
- 「相談だけでもOK」
- 「※○○調査」と出典明記つきデータ
- 「会社が無視するのは難しくなります」（断定回避）

---

## 配信戦略（Week 1）

1. **5本すべて配信** （2,000円/日 × 5アドセット = 10,000円/日）
2. **3日後にCTR最低の2本を停止**
3. **残り3本に予算集中**

## Week 2以降

- 勝ち1本の派生バージョン（フック違い）を3本追加
- 目標: CTR 1%以上、CPA 5,600円以下を維持

---

## 関連ドキュメント

- 元台本: `docs/tiktok-video-scripts.md`
- LP本体: `src/pages/lp/taishoku-gaia/index.astro`
- LP URL: https://vpscomparehub.com/lp/taishoku-gaia/
