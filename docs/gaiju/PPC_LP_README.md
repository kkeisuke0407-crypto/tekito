# 害獣駆除 PPC比較記事LP 実装メモ

対象URL（Google検索広告の専用LP。1検索意図 = 1広告グループ = 1LP）

| URL | 広告グループ | ファイル |
|---|---|---|
| `/gaiju/nezumi/` | AG01 ネズミ・物音 | `src/pages/gaiju/nezumi.astro` |
| `/gaiju/koumori/` | AG02 コウモリ・侵入 | `src/pages/gaiju/koumori.astro` |
| `/gaiju/hakubishin/` | AG03 ハクビシン・屋根裏症状 | `src/pages/gaiju/hakubishin.astro` |

既存の `/gaiju/`（SEO記事）とは独立。CSS/JSも別ファイル（`public/gaiju/lp.css` / `public/gaiju/lp.js`）。

---

## 1. provider（掲載社）の追加・変更

`src/data/gaiju-providers.ts` の `providers` 配列だけを編集する。ページ側にはハードコードしない。

1. 公式サイトとASPの条件を確認し、実データを各フィールドへ入力する
2. `verifiedAt` に確認日、`officialUrl` に再確認用の公式URLを入れる
3. 提携済みなら `affiliateUrl` にASP発行のURLを設定する
4. `active: true` にする

掲載ページを限定したいときは `showOn: ['nezumi']` のように指定する（未指定なら3ページすべてに掲載）。

**CTAが出るのは1位（主案件）だけ**。2位以下は比較情報のみを掲載し、
「最新条件は公式サイトで確認」の注記を出す（外部リンクは張らない）。
2位以下でCTAを出したくなった場合は `ProviderCard.astro` の `showCta` 条件を変更し、
必ず `affiliateUrl` を設定してから有効にすること。

比較表の空欄は禁止。公式に記載が見つからない項目は
`公式サイトで要確認`（`UNCONFIRMED` 定数）を入れる。

- `active: false` のproviderはDOMへ一切出力されない（「準備中」「未定」等も表示しない）
- 比較社数の見出しは `comparisonTitle` がactive件数から自動で切り替わる
  （3社未満: `害獣駆除サービスを比較` / 3社以上: `害獣駆除サービス3社を比較`）
- 比較項目を増やすときは `comparisonItems` に追加する（`primary: true` はスマホの「まず見たい5項目」に出る）
- 掲載社数はページ単位で `activeProvidersFor(animal)` が判定する
- 順位の評価基準は `rankingCriteria`。成果報酬額を順位根拠として表示しないこと

## 2. アフィリエイトCTA

- CTAは `src/components/gaiju/Cta.astro` に集約。`position` と `animal` を渡すだけ
- `affiliateUrl` が空のとき、CTAは `<a>` ではなく `<button>` として出力され、クリックしても遷移しない
  （代わりに未設定エラーを表示する）。架空URLは作らない
- 電話CTAは実装しない（ASPの成果地点が「WEB申込完了」のため。電話CVの可否はASPへ確認中）

CTA設置箇所（`position` の値）:
`hero` / `body` / `rank1`（ランキングカード・1位詳細の2箇所） / `comparison` / `faq` / `final` / `sticky`

## 3. 計測

`public/gaiju/lp.js` が `dataLayer` へ送信する。

```js
{ event: 'affiliate_click', animal: 'nezumi', position: 'hero', provider: 'houseguard24', ...utm }
```

- GA4 / Google Ads の測定IDは未提供のため未設定。GTMまたはgtagのスニペットを
  `src/layouts/GaijuLp.astro` の head に追加すれば、そのまま受け取れる
- 既存 `/gaiju/` 側と揃えるため `gaiju_affiliate_click` も併せて送信している
- 補助イベント: `comparison_view` / `rank1_view` / `faq_open` / `scroll_50` / `scroll_90`
- UTM（`utm_source` / `utm_medium` / `utm_campaign` / `utm_content` / `utm_term` / `gclid`）は
  sessionStorage に保持し、`affiliate_click` のパラメータへ付与する
- 遷移先URLへUTMを付けるかは `APPEND_UTM_TO_AFFILIATE_URL`（既定 `false`）。
  ASPが未知のクエリ付与を許可しているか確認してから `true` にすること

## 4. 画像の差し替え

現時点では画像を入れず、`src/components/gaiju/ImagePlaceholder.astro` が
`■ IMAGE_SLOT: XXX` の破線プレースホルダーを表示する。

差し替え手順:
1. 該当ページの `<ImagePlaceholder slotId="..." ... />` を `<img>` / `<picture>` へ置き換える
2. `alt` は `10_IMAGE_SLOTS.md` 記載の文言を使う
3. `aspect-ratio` を維持してCLSを防ぐ（`loading="lazy"` / WebP等を推奨）

スロット一覧:

- ネズミ: `NEZUMI_HERO_01` / `NEZUMI_ENTRY_ROUTE_02` / `NEZUMI_DIY_VS_PRO_03` / `NEZUMI_FLOW_04`
- コウモリ: `KOUMORI_HERO_01` / `KOUMORI_ENTRY_ROUTE_02` / `KOUMORI_DIY_VS_PRO_03` / `KOUMORI_FLOW_04`
- ハクビシン: `HAKUBISHIN_HERO_01` / `HAKUBISHIN_DAMAGE_02` / `HAKUBISHIN_ENTRY_ROUTE_03` / `HAKUBISHIN_FLOW_04`

## 5. フッター・法務リンク

`src/data/gaiju-lp-config.ts` の `footerLinks` で管理。`href: null` の項目は出力されない（架空URLを作らない）。

## 6. 公開前に必要な作業（未完了）

- [ ] ハウスガード24のアフィリエイトURLを `gaiju-providers.ts` に設定
- [ ] 電話問い合わせが成果対象かASPへ確認（現状はWEB導線のみ）
- [ ] 広告表現（最短30分 / 即日対応 / 永年保証 / 料金 / キャンペーン / お客様の声）の利用可否をASPへ確認
- [ ] GA4 / Google Ads の測定IDを設置し、CTA 5箇所（hero / comparison / rank1 / sticky / final）の発火をテスト
- [ ] 2位以下の掲載社（ハウスプロテクト / 害獣BUZZ / ホームレスキュー / ねずみ110番）の
      記載内容を各社公式サイトで再確認する。現在の記載は各社の公表情報をもとにした
      2026-08-18時点のもので、公式サイトでの一次確認は未実施
- [ ] 提携する場合は各社のASP条件を確認のうえ `affiliateUrl` を設定
