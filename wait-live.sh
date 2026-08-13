#!/bin/sh
# Polls the published site until GitHub Pages serves it, or the build errors.
# Poll the custom domain. bnfplus.github.io now 301s to it, so polling the
# github.io URL would never see a 200 again.
URL="https://avas.parts/"
REPO="BNFPLUS/avas-parts"

i=0
while [ "$i" -lt 40 ]; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$URL")
  status=$(gh api "repos/$REPO/pages/builds/latest" --jq '.status')

  if [ "$code" = "200" ]; then
    echo "LIVE  http=200  build=$status"
    exit 0
  fi

  if [ "$status" = "errored" ]; then
    echo "BUILD ERRORED"
    gh api "repos/$REPO/pages/builds/latest" --jq '.error.message'
    exit 1
  fi

  i=$((i + 1))
  sleep 10
done

echo "TIMEOUT  http=$code  build=$status"
exit 1
