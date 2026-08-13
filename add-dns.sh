#!/bin/sh
# Creates the GitHub Pages DNS records for avas.parts in Cloudflare.
#
# Needs a Cloudflare API token with Zone:DNS:Edit on the avas.parts zone:
#   Cloudflare dashboard -> My Profile -> API Tokens -> Create Token
#   -> "Edit zone DNS" template -> Zone Resources: Include -> Specific zone -> avas.parts
#
#   export CLOUDFLARE_API_TOKEN=...
#   sh add-dns.sh
#
# Records are created with proxy OFF. An orange cloud breaks GitHub's
# certificate issuance for the custom domain.
set -e

DOMAIN="avas.parts"
PAGES_IPS="185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153"
WWW_TARGET="bnfplus.github.io"
API="https://api.cloudflare.com/client/v4"

# Token comes from the environment, or from a file so it never has to be
# pasted into a chat transcript. Default file: ~/.cf-token (chmod 600).
TOKEN_FILE="${1:-${HOME}/.cf-token}"
if [ -z "${CLOUDFLARE_API_TOKEN}" ] && [ -r "${TOKEN_FILE}" ]; then
  CLOUDFLARE_API_TOKEN=$(tr -d ' \t\r\n' < "${TOKEN_FILE}")
fi

if [ -z "${CLOUDFLARE_API_TOKEN}" ]; then
  echo "No token found."
  echo "  Either:  export CLOUDFLARE_API_TOKEN=..."
  echo "  Or save it to ${TOKEN_FILE} and re-run."
  exit 1
fi

# Authenticate by looking up the zone we are about to edit. Do NOT use
# /user/tokens/verify — OAuth-issued tokens (cfat_ prefix) authenticate
# fine against the resource endpoints but are rejected by that one, which
# makes it a false negative. The token is never printed.

auth() { curl -s -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json" "$@"; }

echo "Looking up the ${DOMAIN} zone..."
zone_json=$(auth "${API}/zones?name=${DOMAIN}")
ZONE_ID=$(printf '%s' "$zone_json" | sed -n 's/.*"id":"\([0-9a-f]\{32\}\)".*/\1/p' | head -1)

if [ -z "$ZONE_ID" ]; then
  echo "Could not find the zone. Response:"
  printf '%s\n' "$zone_json" | head -c 400
  exit 1
fi
echo "  zone id: ${ZONE_ID}"

create() {   # create <type> <name> <content>
  echo "  ${1} ${2} -> ${3}"
  body="{\"type\":\"${1}\",\"name\":\"${2}\",\"content\":\"${3}\",\"ttl\":1,\"proxied\":false}"
  out=$(auth -X POST "${API}/zones/${ZONE_ID}/dns_records" --data "$body")
  case "$out" in
    *'"success":true'*)          echo "    created" ;;
    *"already exists"*)          echo "    already there, skipping" ;;
    *'81058'*)                   echo "    already there, skipping" ;;
    *) echo "    FAILED:"; printf '%s\n' "$out" | head -c 300; echo; exit 1 ;;
  esac
}

echo "Creating records (proxy off)..."
for ip in $PAGES_IPS; do
  create A "$DOMAIN" "$ip"
done
create CNAME "www.${DOMAIN}" "$WWW_TARGET"

echo
echo "Records in place. DNS usually propagates in under a minute."
echo "Then run:  sh set-domain.sh"
