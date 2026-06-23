# note-dispatcher Cloudflare Worker

GitHub Actionsの内蔵 `schedule` が不安定だったため、Cloudflare Workers Cronから `workflow_dispatch` を叩いてnote投稿ワークフローを起動します。

Workerは投稿処理を直接行いません。GitHub Actionsの `.github/workflows/daily-note-publish.yml` を起動するだけです。投稿すべき本数の判定は既存の `scripts/note/calculate-note-publish-max.mjs` が行います。

## 必要なGitHub Token

Fine-grained personal access tokenを作成します。

- Repository access: `kkeisuke0407-crypto/tekito` のみ
- Permissions: `Actions: Read and write`
- 期限: できれば90日以上、運用に合わせて更新

## Cloudflareへの登録

```bash
cd workers/note-dispatcher
npx wrangler login
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put DISPATCH_TOKEN
npx wrangler deploy
```

`DISPATCH_TOKEN` は手動テストURLを保護するための任意の長い文字列です。

## 手動テスト

デプロイ後、Worker URLに対して以下を実行します。

```bash
curl -H "x-dispatch-token: <DISPATCH_TOKEN>" https://<worker-url>/dispatch
```

レスポンスが `"ok": true` ならGitHub Actionsの `Daily note queue publish` が起動します。

## Cron

`wrangler.toml` のcronはUTCです。

```toml
crons = ["7,22,37,52 2-14 * * *"]
```

これはJSTの `11:07〜23:52` に15分おきで起動します。実際に投稿するかどうかはGitHub Actions側で判定します。

## GitHub側のSecrets/Variables

GitHub Actionsには既存どおり以下が必要です。

- `NOTE_STORAGE_STATE_JSON` secret
- `NOTE_COMPARISON_URL` variable
- `NOTE_PUBLISH_MODE=publish` variable
- `ENABLE_NOTE_AUTOMATION=true` variable

## 注意

GitHub Actions側の `schedule:` は重複投稿防止のため外しています。起動元はCloudflare Workerに一本化します。
