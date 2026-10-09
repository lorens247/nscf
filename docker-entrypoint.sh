#!/bin/sh
set -eu
: "${DATABASE_URL:?Set DATABASE_URL in Coolify runtime environment variables}"
: "${AUTH_SECRET:?Set a stable AUTH_SECRET in Coolify runtime environment variables}"
SITE_URL="${SITE_URL:-${NEXT_PUBLIC_SITE_URL:-}}"
export SITE_URL
: "${SITE_URL:?Set SITE_URL (or NEXT_PUBLIC_SITE_URL) to your public HTTPS domain in Coolify runtime environment variables}"
exec "$@"
