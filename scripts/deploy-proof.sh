#!/usr/bin/env bash
# Deploy GitHub main to the PROOF container on the VPS.
#
# GitHub main is the only version of this app. The server copy is a mirror:
# this script saves anything made on the server, resets the checkout to
# origin/main, rebuilds, restarts, and checks the live page.
#
#   bash scripts/deploy-proof.sh                 deploy now
#   bash scripts/deploy-proof.sh --if-changed    deploy only when main moved (cron)
#   bash scripts/deploy-proof.sh --install-cron  deploy now and check main every 10 minutes
#
# A failed build leaves the running container as it was.

set -uo pipefail
REPO=/root/flow-visualizer-telemetry
LOG=/root/deploy-proof.log
STATE=/root/.proof-deploy-attempted
BOOKING=https://calendar.app.google/ZwcGeFdXqTq58dLR6
MODE="${1:-}"

cd "$REPO" || { echo "no repo at $REPO"; exit 1; }
exec > >(tee -a "$LOG") 2>&1
echo "=== $(date -u +%FT%TZ) deploy-proof $MODE"

if [ "$MODE" = "--install-cron" ]; then
  LINE="*/10 * * * * /usr/bin/env bash $REPO/scripts/deploy-proof.sh --if-changed >/dev/null 2>&1"
  ( crontab -l 2>/dev/null | grep -v 'deploy-proof.sh' ; echo "$LINE" ) | crontab -
  echo "cron installed: main is checked every 10 minutes"
fi

git fetch -q origin main || { echo "FETCH FAILED"; exit 1; }
REMOTE=$(git rev-parse origin/main)

if [ "$MODE" = "--if-changed" ] && [ -f "$STATE" ] && [ "$(cat "$STATE")" = "$REMOTE" ]; then
  exit 0
fi
echo "$REMOTE" > "$STATE"

# Keep any commits or edits made on the server, then mirror main.
STAMP=$(date +%Y%m%d-%H%M%S)
if [ -n "$(git log origin/main..HEAD --oneline 2>/dev/null)" ]; then
  git branch "server-work-$STAMP" HEAD
  mkdir -p "/root/server-work/$STAMP"
  git format-patch -q origin/main..HEAD -o "/root/server-work/$STAMP"
  if git push -q origin "HEAD:refs/heads/server-work/$STAMP" 2>/dev/null; then
    echo "server commits saved to GitHub branch server-work/$STAMP"
  else
    echo "server commits saved to /root/server-work/$STAMP and local branch server-work-$STAMP"
  fi
fi
if ! git diff --quiet || ! git diff --cached --quiet; then
  git stash push -q -m "deploy-proof $STAMP" && echo "server file edits saved: git stash list"
fi
git checkout -q -B main origin/main && git reset -q --hard origin/main
echo "code: $(git log --oneline -1)"

export PROOF_BOOKING_URL="$BOOKING"
if ! docker compose build proof-app; then
  echo "BUILD FAILED. The live container is unchanged."
  exit 1
fi

# Free port 3000 if something other than this container holds it.
OWNER=$(docker ps --filter "publish=3000" --format '{{.Names}}' | grep -v '^flow-visualizer-telemetry$' || true)
if [ -n "$OWNER" ]; then
  echo "port 3000 held by container(s): $OWNER. Stopping them."
  docker stop $OWNER >/dev/null
fi
docker rm -f flow-visualizer-telemetry >/dev/null 2>&1 || true
docker compose up -d --force-recreate proof-app || echo "UP FAILED"

sleep 12
docker ps --filter name=flow-visualizer-telemetry --format 'container: {{.Names}} {{.Status}} {{.Ports}}'
if curl -s localhost:3000/proof/screen | grep -q 'Operational'; then
  echo "LIVE OK $(git log --oneline -1)"
else
  echo "LIVE CHECK FAILED: port 3000 is not serving main."
  echo "listening on 3000:"; ss -ltnp 'sport = :3000' 2>/dev/null | tail -n +2
  docker logs --tail 25 flow-visualizer-telemetry 2>&1
  exit 1
fi
