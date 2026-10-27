#!/usr/bin/env bash
# Fails if server-only env names appear in client code, or if raw console.* is used in API routes.
set -u
status=0
if git grep -nE "SUPABASE_SERVICE_ROLE_KEY|ENCRYPTION_KEY_BASE64|STRIPE_SECRET_KEY|N8N_WEBHOOK_SIGNING_SECRET|CRON_SECRET" -- 'src/components' 'src/hooks' 'src/app/**/*.tsx' ':!src/app/api' ':!src/app/og' ':!src/app/sitemap*' ':!src/app/robots.ts' ':!src/app/llms.txt'; then
  echo "ERROR: server secret name referenced in client-reachable code"; status=1
fi
if git grep -nE "console\.(log|error|warn)" -- 'src/app/api' ':!src/app/api/**/*.test.ts'; then
  echo "ERROR: use lib/log in API routes"; status=1
fi
exit $status
