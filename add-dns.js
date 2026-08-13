/* Creates the GitHub Pages DNS records for avas.parts in Cloudflare.
 *
 * Token is read from a file so it never has to be pasted into a chat
 * transcript, and is never printed.
 *
 *   node add-dns.js [path-to-token-file]     (default ~/.cf-token)
 *
 * Records are created with proxy OFF — an orange cloud breaks GitHub's
 * certificate issuance for the custom domain.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const DOMAIN = "avas.parts";
const PAGES_IPS = ["185.199.108.153", "185.199.109.153", "185.199.110.153", "185.199.111.153"];
const WWW_TARGET = "bnfplus.github.io";
const API = "https://api.cloudflare.com/client/v4";

const tokenFile = process.argv[2] || path.join(os.homedir(), ".cf-token");
let token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) {
  try { token = fs.readFileSync(tokenFile, "utf8").trim(); }
  catch { console.error(`No token. Set CLOUDFLARE_API_TOKEN or save it to ${tokenFile}`); process.exit(1); }
}

const call = async (p, init = {}) => {
  const r = await fetch(API + p, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  return r.json();
};

(async () => {
  /* Authenticate by looking up the zone we're about to edit.
     Do NOT use /user/tokens/verify — OAuth-issued tokens (cfat_ prefix)
     work against resource endpoints but are rejected there, a false negative. */
  console.log(`Looking up the ${DOMAIN} zone...`);
  const zres = await call(`/zones?name=${DOMAIN}`);
  if (!zres.success || !zres.result?.length) {
    console.error("  Could not read the zone:", JSON.stringify(zres.errors || zres).slice(0, 300));
    process.exit(1);
  }
  const zone = zres.result[0];
  console.log(`  ${zone.name} — ${zone.status} — zone ${zone.id}`);

  /* Existing records, so re-runs are safe */
  const cur = await call(`/zones/${zone.id}/dns_records?per_page=200`);
  if (!cur.success) {
    console.error("  Could not list records:", JSON.stringify(cur.errors).slice(0, 300));
    process.exit(1);
  }
  const has = (type, name, content) =>
    cur.result.some(r => r.type === type && r.name === name && r.content === content);

  const want = [
    ...PAGES_IPS.map(ip => ({ type: "A", name: DOMAIN, content: ip })),
    { type: "CNAME", name: `www.${DOMAIN}`, content: WWW_TARGET },
  ];

  console.log("Creating records (proxy off)...");
  let created = 0, skipped = 0;
  for (const rec of want) {
    if (has(rec.type, rec.name, rec.content)) {
      console.log(`  ${rec.type} ${rec.name} -> ${rec.content}  already there`);
      skipped++;
      continue;
    }
    const out = await call(`/zones/${zone.id}/dns_records`, {
      method: "POST",
      body: JSON.stringify({ ...rec, ttl: 1, proxied: false }),
    });
    if (out.success) {
      console.log(`  ${rec.type} ${rec.name} -> ${rec.content}  created`);
      created++;
    } else {
      const msg = (out.errors || []).map(e => `${e.code} ${e.message}`).join("; ");
      if (/already exist/i.test(msg) || (out.errors || []).some(e => e.code === 81057 || e.code === 81058)) {
        console.log(`  ${rec.type} ${rec.name} -> ${rec.content}  already there`);
        skipped++;
      } else {
        console.error(`  ${rec.type} ${rec.name} -> ${rec.content}  FAILED: ${msg}`);
        process.exit(1);
      }
    }
  }

  /* Anything proxied on these names would break GitHub's certificate */
  const after = await call(`/zones/${zone.id}/dns_records?per_page=200`);
  const proxied = (after.result || []).filter(
    r => (r.name === DOMAIN || r.name === `www.${DOMAIN}`) && r.proxied);
  if (proxied.length) {
    console.log("\nWARNING — these records are proxied (orange cloud) and will break TLS:");
    proxied.forEach(r => console.log(`  ${r.type} ${r.name} -> ${r.content}`));
    console.log("Turn the proxy off for them in the Cloudflare dashboard.");
  }

  console.log(`\n${created} created, ${skipped} already present.`);
  console.log("DNS usually propagates in under a minute. Then: sh set-domain.sh");
})();
