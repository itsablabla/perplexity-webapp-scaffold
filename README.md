# Perplexity Web App — Cloudflare Phase 1 Scaffold

This repository contains the public Phase 1 deployment scaffold for the
Perplexity web UI.

The full Perplexity UI comes from the Electron build:

- [Perplexity-app.zip v1.0.0](https://github.com/itsablabla/perplexity-app/releases/download/v1.0.0/Perplexity-app.zip)
- Extracted UI: [itsablabla/perplexity-webapp-ui](https://github.com/itsablabla/perplexity-webapp-ui) (private)

## Architecture

- **Cloudflare Worker** (`worker.js`) serves the full Perplexity UI and reverse-proxies API/RPC calls to the Perplexity RPC daemon on Spark.
- **Cloudflare Pages** hosts the UI assets from `perplexity-webapp-ui`.
- **Cloudflare Tunnel** (`cloudflared/perplexity.yml`) provides a private, fast path from Cloudflare to Spark.
- **No Coolify** — the UI is served from Cloudflare’s edge, not from a Docker container.

## Deployment

### 1. Deploy the Pages project

```bash
cd perplexity-webapp-scaffold
npx wrangler pages project create perplexity-webapp --production-branch main
npx wrangler pages deploy Perplexity/resources/frontend
```

### 2. Deploy the Worker

```bash
npx wrangler deploy
```

### 3. On Spark, run the Tunnel

```bash
cloudflared tunnel --config /etc/cloudflared/perplexity.yml run
```

### 4. Point DNS

```dns
perplexity.garzalabs.com CNAME perplexity-webapp.workers.dev
```

## Notes

- The Mapbox public token in `PerplexityMap-CBce-1gi.js` was redacted during the push to `perplexity-webapp-ui`. Inject the real token at runtime if you want maps to work.
- The RPC upstream is currently set to `http://127.0.0.1:8443` (the Cloudflare Tunnel ingress on Spark). Update this if the RPC daemon listens on a different port.
