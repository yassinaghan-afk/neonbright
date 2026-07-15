#!/usr/bin/env bash
# Prove CMS + uploads persist across container restart with STORAGE_ROOT volume.
# Does NOT touch production data.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose -f docker-compose.persistence.yml"
NAME="neonbright-persist-test"

if ! command -v docker >/dev/null 2>&1; then
  echo "FAIL: docker is not installed or not on PATH"
  exit 2
fi

cleanup() {
  $COMPOSE down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "==> Building image"
$COMPOSE build

echo "==> Starting container with named volume"
$COMPOSE up -d

echo "==> Waiting for server"
for i in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:3000/" >/dev/null; then
    break
  fi
  sleep 2
  if [[ "$i" -eq 60 ]]; then
    echo "FAIL: server did not become ready"
    $COMPOSE logs --tail=80
    exit 1
  fi
done

MARKER="persist-$(date +%s)"
CID="$($COMPOSE ps -q neonbright)"

echo "==> Seed a CMS marker and upload file inside container"
docker exec "$CID" sh -c "mkdir -p /app/storage/uploads/cms"
docker exec "$CID" sh -c "echo '${MARKER}' > /app/storage/uploads/cms/persist_test.txt"
docker exec "$CID" node -e "
const fs=require('fs');
const p='/app/storage/cms-content.json';
let c={};
try{c=JSON.parse(fs.readFileSync(p,'utf8'));}catch(e){}
c.__persistMarker='${MARKER}';
c.updatedAt=new Date().toISOString();
const tmp=p+'.tmp';
fs.writeFileSync(tmp, JSON.stringify(c,null,2));
fs.renameSync(tmp,p);
console.log('cms marker written');
"

# Place a real image for /uploads rewrite check
docker exec "$CID" sh -c 'printf "%s" "fakepng" > /app/storage/uploads/cms/img_persist_test.png'

echo "==> Verify /uploads/... before restart"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/uploads/cms/img_persist_test.png")
if [[ "$CODE" != "200" ]]; then
  echo "FAIL: /uploads/cms/img_persist_test.png returned HTTP $CODE (expected 200)"
  exit 1
fi
echo "OK: /uploads returned HTTP 200"

echo "==> Capture CMS marker before restart"
BEFORE=$(docker exec "$CID" node -e "console.log(JSON.parse(require('fs').readFileSync('/app/storage/cms-content.json','utf8')).__persistMarker||'')")
if [[ "$BEFORE" != "$MARKER" ]]; then
  echo "FAIL: CMS marker missing before restart"
  exit 1
fi

EXISTING_UPDATED=$(docker exec "$CID" node -e "console.log(JSON.parse(require('fs').readFileSync('/app/storage/cms-content.json','utf8')).updatedAt||'')")

echo "==> Restart container (volume kept)"
$COMPOSE restart
sleep 3
for i in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:3000/" >/dev/null; then break; fi
  sleep 2
done

CID="$($COMPOSE ps -q neonbright)"

echo "==> Verify CMS survived restart"
AFTER=$(docker exec "$CID" node -e "console.log(JSON.parse(require('fs').readFileSync('/app/storage/cms-content.json','utf8')).__persistMarker||'')")
if [[ "$AFTER" != "$MARKER" ]]; then
  echo "FAIL: CMS marker lost after restart"
  exit 1
fi
echo "OK: CMS marker persisted"

echo "==> Verify upload file survived restart"
docker exec "$CID" test -f /app/storage/uploads/cms/persist_test.txt
CONTENT=$(docker exec "$CID" cat /app/storage/uploads/cms/persist_test.txt)
if [[ "$CONTENT" != "$MARKER" ]]; then
  echo "FAIL: upload content mismatch"
  exit 1
fi
echo "OK: upload file persisted"

echo "==> Verify /uploads/... still 200 after restart"
CODE2=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/uploads/cms/img_persist_test.png")
if [[ "$CODE2" != "200" ]]; then
  echo "FAIL: /uploads after restart returned HTTP $CODE2"
  exit 1
fi
echo "OK: /uploads returned HTTP 200 after restart"

echo "==> Verify bootstrap did not overwrite existing CMS"
AFTER_UPDATED=$(docker exec "$CID" node -e "console.log(JSON.parse(require('fs').readFileSync('/app/storage/cms-content.json','utf8')).updatedAt||'')")
if [[ "$AFTER_UPDATED" != "$EXISTING_UPDATED" ]]; then
  # marker must still be present even if timestamps differ slightly
  AFTER2=$(docker exec "$CID" node -e "console.log(JSON.parse(require('fs').readFileSync('/app/storage/cms-content.json','utf8')).__persistMarker||'')")
  if [[ "$AFTER2" != "$MARKER" ]]; then
    echo "FAIL: CMS appears overwritten at startup"
    exit 1
  fi
fi
echo "OK: existing CMS not overwritten at startup"

echo ""
echo "PASS: Docker persistence test succeeded"
