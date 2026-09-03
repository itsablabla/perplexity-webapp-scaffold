/**
 * Perplexity Web App — Cloudflare Worker
 *
 * Serves the full Perplexity UI from the private repo
 * (itsablabla/perplexity-webapp-ui) and reverse-proxies
 * API/RPC calls to the Perplexity RPC daemon on Spark
 * via Cloudflare Tunnel.
 *
 * Deployment:
 *   1. wrangler deploy
 *   2. On Spark: cloudflared tunnel --config /etc/cloudflared/perplexity.yml run
 *   3. Point DNS: perplexity.garzalabs.com → this Worker
 */

// RPC upstream — set via Cloudflare Worker binding or env var.
// For Phase 1, this points to the Cloudflare Tunnel ingress on Spark.
const RPC_UPSTREAM = "http://127.0.0.1:8443";

// UI assets are served from Cloudflare Pages.
// The full Perplexity UI is at: Perplexity/resources/frontend/
// Pages project: perplexity-webapp.pages.dev

const PAGES_URL = "https://perplexity-webapp.pages.dev";
const UI_BASE = "/Perplexity/resources/frontend";

// Fallback HTML if the UI isn't found
const FALLBACK_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Perplexity — Phase 1 Scaffold</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0a0a0a; color: #e5e5e5; }
    .card { text-align: center; padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #9ca3af; font-size: 0.9rem; }
    .status { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
    .ok { background: #064e3b; color: #6ee7b7; }
    .pending { background: #78350f; color: #fde68a; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Perplexity Web App</h1>
    <p>Phase 1 scaffold live on Cloudflare.</p>
    <p>RPC upstream: <code>${RPC_UPSTREAM}</code></p>
    <span class="status ok">Tunnel Active</span>
  </div>
</body>
</html>
`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/health") {
      return new Response("ok", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    // Proxy API/RPC calls to Spark
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/rpc/")) {
      const rpcPath = url.pathname.replace(/^\/(api|rpc)/, "");
      const rpcUrl = `${RPC_UPSTREAM}${rpcPath}${url.search}`;
      const rpcRequest = new Request(rpcUrl, {
        method: request.method,
        headers: {
          "Content-Type": request.headers.get("Content-Type") || "application/json",
          "X-Forwarded-For": request.headers.get("CF-Connecting-IP") || "unknown",
        },
        body: request.method !== "GET" ? request.body : undefined,
      });

      try {
        const rpcResponse = await fetch(rpcRequest);
        return new Response(rpcResponse.body, {
          status: rpcResponse.status,
          headers: {
            "Content-Type": rpcResponse.headers.get("Content-Type") || "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "RPC upstream unreachable", detail: String(err) }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Serve UI from Cloudflare Pages
    // Map / to /Perplexity/resources/frontend/index.html
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return this.fetchUI(request, env, "/Perplexity/resources/frontend/index.html");
    }

    // Serve other UI assets (strip the /Perplexity/resources/frontend prefix if present)
    let uiPath = url.pathname;
    if (uiPath.startsWith(UI_BASE)) {
      uiPath = uiPath.slice(UI_BASE.length);
    }
    return this.fetchUI(request, env, uiPath);
  },

  async fetchUI(request, env, uiPath) {
    try {
      // Fetch the UI asset from Cloudflare Pages
      const uiRequest = new Request(`${PAGES_URL}${UI_BASE}${uiPath}`, {
        method: request.method,
        headers: {
          "Accept": request.headers.get("Accept") || "*/*",
        },
      });

      const uiResponse = await fetch(uiRequest);
      if (uiResponse.status === 200) {
        return new Response(uiResponse.body, {
          status: 200,
          headers: {
            "Content-Type": uiResponse.headers.get("Content-Type") || "application/octet-stream",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }

      // Fallback to placeholder
      return new Response(FALLBACK_HTML, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    } catch (err) {
      return new Response(FALLBACK_HTML, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  },
};
