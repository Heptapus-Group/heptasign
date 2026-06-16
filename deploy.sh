#!/usr/bin/env bash
#
# HeptaSign production deploy: pull the latest image, recreate containers, run
# migrations, then remove dangling images so the disk does not fill up.
#
# Usage (on the server, from the repo dir):
#   ./deploy.sh
set -euo pipefail

COMPOSE="docker-compose -f docker-compose.prod.yml"

echo "==> Pulling latest image"
$COMPOSE pull

echo "==> Recreating containers"
$COMPOSE up -d

echo "==> Applying database migrations"
$COMPOSE exec -T heptapus-sign-app npx prisma migrate deploy

echo "==> Removing dangling (untagged) images"
docker image prune -f

echo "==> Disk usage"
docker system df
