# Perplexity Web App — Cloudflare Phase 1 Scaffold

This repository contains the public Phase 1 deployment scaffold for the
Perplexity web UI.

The full Perplexity UI comes from the Electron build:

- [Perplexity-app.zip v1.0.0](https://github.com/itsablabla/perplexity-app/releases/download/v1.0.0/Perplexity-app.zip)

Phase 1 goal:
- Host the full Perplexity UI on Cloudflare.
- Reverse-proxy API/RPC calls from the UI to the Perplexity RPC daemon on Spark.
- Use Cloudflare Tunnel for a private, fast path from Cloudflare to Spark.
- Do not use Coolify for this deployment.

This public repository intentionally contains no secrets.
