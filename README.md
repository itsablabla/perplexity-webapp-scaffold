# Perplexity Web App — Phase 1 Scaffold

Public deployment scaffold for the Perplexity web app. This repository
contains only the deployment configuration used by Coolify:

- `docker-compose.yml`
- `nginx.conf`
- `README.md`

All secrets are supplied through Coolify environment variables and are
never committed to this public repository.

## Fastest Spark round-trip

The Phase 1 configuration intentionally avoids a Tailscale sidecar:

- The Coolify host is already on the tailnet.
- The webapp container uses normal Docker bridge networking for reliable
  Coolify/Traefik discovery.
- `extra_hosts` maps `spark-341c.tailc48b95.ts.net` to Spark's Tailscale
  IP, so the container can reach Spark with minimal extra hops.

Required Coolify environment variables:

- `PPLX_PAIRING_TOKEN`
- `PPLX_RPC_UPSTREAM`
- `PPLX_SPARK_TAILNET_IP`

Optional:

- `PPLX_PORT`
