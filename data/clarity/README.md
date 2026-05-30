# Clarity Data Export

Microsoft Clarity の Data Export API から取得した集計データ（直近1〜3日分）。

## 取得方法

GitHub Actions タブから `Clarity Data Fetch (manual)` を開き、**Run workflow** をクリック。
取得日数（1, 2, 3）を指定して実行すると、`YYYY-MM-DD.json` がこのフォルダにコミットされる。

## ローカル実行

```bash
export CLARITY_TOKEN="<JWT>"
./scripts/fetch-clarity.sh 3
```

## データ内容

各 JSON は7つのクエリ結果を含む:
- `overall` — 全体メトリクス（PV, セッション, ユニーク）
- `byPage` — ページ別（URL dimension）
- `byDevice` — デバイス別
- `byBrowser` — ブラウザ別
- `byOS` — OS別
- `byCountry` — 国別
- `bySource` — 流入元別

## 注意

- API は直近 **最大3日分** までしか取れない（公式制約）
- ヒートマップ画像・セッション動画は API では取得不可（ダッシュボード参照）
- トークン (`CLARITY_TOKEN`) は GitHub Secrets に保存。リポジトリにコミットしない
