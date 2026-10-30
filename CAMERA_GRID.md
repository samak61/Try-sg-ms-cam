# Camera grid deployment

The separate viewer is at https://samak61.github.io/Try-sg-ms-cam/camera-grid/ . The existing root viewer is preserved.

The grid page is published by the repository's existing GitHub Pages build. Eight new camera Workers still require Cloudflare deployment and live playback verification. Sea Girt North uses the original Worker through a local HLS player.

## Deploy Workers

1. In Cloudflare, create an API token using the Edit Cloudflare Workers policy, scoped to the account that owns wail-dorado7m.workers.dev. Copy that account's Account ID.
2. In this repository's Settings > Secrets and variables > Actions, add repository secrets CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID. Never commit or paste credentials into chat.
3. Open Actions > Deploy camera Workers > Run workflow, with branch main.
4. Inspect all eight deployment jobs and then verify all nine videos progress at the grid URL. Successful deployment alone does not prove upstream camera playback.

The shared Worker is deployed separately for each camera; the existing sea-girt-north1 Worker is never changed. Upstream requests use the exact Referer, Origin, AppleTV User-Agent and Accept settings from the owner-provided working sea-girt-north1 source. The same settings apply to playlists, keys and media segments. Each Worker remains limited to its configured camera source. Upstream access denials are preserved; client cookies and authorization credentials are not forwarded.

Update sources in cameras.json, run node scripts/build.mjs and node --test scripts/worker.test.mjs, commit generated camera-grid files, then redeploy affected Workers. Camera availability depends on upstream providers.

Documentation: https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
