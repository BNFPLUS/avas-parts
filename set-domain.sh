#!/bin/sh
# Points the site at avas.parts. Run this only AFTER the Cloudflare A records
# and the www CNAME resolve — see README section 8.
set -e

DOMAIN="avas.parts"
REPO="BNFPLUS/avas-parts"
EXPECTED="185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153"

echo "Checking DNS for ${DOMAIN}..."
found=$(dig +short "${DOMAIN}" A | sort | tr '\n' ' ')
if [ -z "$found" ]; then
  echo "  No A records yet. Add them in Cloudflare first, then re-run."
  exit 1
fi
echo "  found: $found"

missing=""
for ip in $EXPECTED; do
  case " $found " in
    *" $ip "*) ;;
    *) missing="$missing $ip" ;;
  esac
done
if [ -n "$missing" ]; then
  echo "  Missing GitHub Pages addresses:$missing"
  echo "  Add them in Cloudflare (proxy off), then re-run."
  exit 1
fi

echo "Writing CNAME and pushing..."
echo "${DOMAIN}" > CNAME
git add CNAME
git commit -m "Serve the site from ${DOMAIN}"
git push origin site

echo "Pointing GitHub Pages at ${DOMAIN}..."
gh api -X PUT "repos/${REPO}/pages" -f "cname=${DOMAIN}" -F "https_enforced=true"

echo
echo "Done. Certificate issuance takes a few minutes."
echo "Watch it with:  curl -sI https://${DOMAIN} | head -1"
