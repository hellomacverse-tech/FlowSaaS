# n8n VPS down
1. Cloudflare Zero Trust: is the tunnel healthy? On the VPS: `docker compose ps`.
2. Tools return a clean error and charge 0 credits; the sandbox falls back per the sandbox runbook.
3. Restart: `docker compose up -d`. If the host is gone, restore from the VPS snapshot and the latest Postgres dump.
4. After recovery run one signed sandbox run and one tool run on production.
