#!/bin/sh
# Waits for GitHub to issue the TLS certificate for the custom domain,
# then turns on HTTPS enforcement.
REPO="BNFPLUS/avas-parts"
DOMAIN="avas.parts"

i=0
while [ "$i" -lt 60 ]; do
  state=$(gh api "repos/${REPO}/pages" --jq '.https_certificate.state // "none"')
  build=$(gh api "repos/${REPO}/pages" --jq '.status // "null"')
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://${DOMAIN}/" --max-time 10 || echo 000)
  echo "  cert=${state}  build=${build}  https=${code}"

  if [ "$state" = "approved" ] && [ "$code" = "200" ]; then
    echo "Certificate issued and the domain is serving."
    gh api -X PUT "repos/${REPO}/pages" -F "https_enforced=true" >/dev/null 2>&1 \
      && echo "HTTPS enforcement on." \
      || echo "Could not set HTTPS enforcement yet — retry shortly."
    exit 0
  fi

  case "$state" in
    errored|bad_authz|timed_out)
      echo "Certificate failed: ${state}"
      echo "Usually means a proxied (orange cloud) record, or DNS not fully propagated."
      exit 1 ;;
  esac

  i=$((i + 1))
  sleep 15
done

echo "Still pending after 15 minutes. Certificate issuance can take up to an hour."
exit 1
