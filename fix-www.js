/* Makes https://www.avas.parts work.
 *
 * GitHub Pages issues its certificate for the configured custom domain only
 * (the apex), so https://www.* fails TLS even though the DNS is correct.
 * Cloudflare's Universal SSL already covers *.avas.parts, so:
 *
 *   1. proxy the www record (orange cloud) — Cloudflare terminates TLS for it
 *   2. add a 301 redirect www -> apex, preserving path and query
 *
 * The apex record stays unproxied. Proxying it would break GitHub's own
 * certificate.
 *
 *   node fix-www.js [path-to-token-file]
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const ZONE = "81c7ef17cf63cf42a75a6428a5f6da8d";
const DOMAIN = "avas.parts";
const WWW = `www.${DOMAIN}`;
const API = "https://api.cloudflare.com/client/v4";

const tokenFile = process.argv[2] || path.join(os.homedir(), ".cf-token");
const token = process.env.CLOUDFLARE_API_TOKEN || fs.readFileSync(tokenFile, "utf8").trim();

const call = async (p, init = {}) => {
  const r = await fetch(API + p, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  return r.json();
};
const fail = (label, res) => {
  console.error(`  ${label} FAILED: ${JSON.stringify(res.errors || res).slice(0, 300)}`);
  process.exit(1);
};

(async () => {
  /* 1. Proxy the www record */
  const recs = await call(`/zones/${ZONE}/dns_records?per_page=200`);
  if (!recs.success) fail("list records", recs);

  const www = recs.result.find(r => r.name === WWW && (r.type === "CNAME" || r.type === "A"));
  if (!www) { console.error(`  No record for ${WWW}`); process.exit(1); }

  if (www.proxied) {
    console.log(`  ${WWW} is already proxied`);
  } else {
    const up = await call(`/zones/${ZONE}/dns_records/${www.id}`, {
      method: "PATCH",
      body: JSON.stringify({ proxied: true }),
    });
    if (!up.success) fail("proxy www", up);
    console.log(`  ${WWW} now proxied through Cloudflare`);
  }

  /* Guard: the apex must NOT be proxied or GitHub's certificate breaks */
  const apexProxied = recs.result.filter(r => r.name === DOMAIN && r.proxied);
  if (apexProxied.length) {
    console.log(`  WARNING: ${DOMAIN} is proxied — this breaks GitHub's certificate. Turn it off.`);
  } else {
    console.log(`  ${DOMAIN} left unproxied, as GitHub requires`);
  }

  /* 2. Redirect rule www -> apex. Read existing rules first so we append. */
  const phase = `/zones/${ZONE}/rulesets/phases/http_request_dynamic_redirect/entrypoint`;
  let existing = [];
  const cur = await call(phase);
  if (cur.success && cur.result?.rules) existing = cur.result.rules;

  const DESC = "www to apex (avas.parts)";
  if (existing.some(r => r.description === DESC)) {
    console.log("  redirect rule already present");
  } else {
    const rule = {
      description: DESC,
      expression: `(http.host eq "${WWW}")`,
      action: "redirect",
      action_parameters: {
        from_value: {
          status_code: 301,
          target_url: { expression: `concat("https://${DOMAIN}", http.request.uri.path)` },
          preserve_query_string: true,
        },
      },
    };
    const put = await call(phase, {
      method: "PUT",
      body: JSON.stringify({ rules: [...existing, rule] }),
    });
    if (!put.success) fail("create redirect rule", put);
    console.log(`  301 redirect added: ${WWW} -> https://${DOMAIN}`);
    if (existing.length) console.log(`  (kept ${existing.length} existing redirect rule(s))`);
  }

  console.log("\nDone. Cloudflare needs a moment to pick up the proxy change.");
})();
