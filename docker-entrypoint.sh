#!/bin/sh
set -eu
: "${DATABASE_URL:?Set DATABASE_URL in Coolify runtime environment variables}"
: "${AUTH_SECRET:?Set a stable AUTH_SECRET in Coolify runtime environment variables}"
: "${SITE_URL:?Set SITE_URL to your HTTPS domain}"
exec "$@"
