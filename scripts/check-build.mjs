// Guards against production-only bugs in the built dashboards (dist/client).
//
// Each page must load only its own stylesheet plus the shared base styles.
// If admin.css and owner.css end up in the same bundle, owner.css overrides the
// admin layout (narrow 960px container, stacked header). That only shows up in
// production, never in `npm run dev`, so check the build output directly.

import { readFileSync } from "node:fs";
import { join } from "node:path";

const client = join(import.meta.dirname, "..", "dist", "client");

/** A selector that only exists in each page's own stylesheet. */
const PAGES = {
  admin: { ownSelector: ".brand__label", foreignSelector: ".business-name" },
  owner: { ownSelector: ".business-name", foreignSelector: ".brand__label" },
};

let failed = false;
const fail = (message) => {
  console.error(`✘ ${message}`);
  failed = true;
};

for (const [page, { ownSelector, foreignSelector }] of Object.entries(PAGES)) {
  const html = readFileSync(join(client, page, "index.html"), "utf8");
  const stylesheets = [...html.matchAll(/href="(\/assets\/[^"]+\.css)"/g)].map((m) => m[1]);
  const css = stylesheets.map((href) => readFileSync(join(client, href), "utf8")).join("\n");

  if (stylesheets.length === 0) fail(`${page}: page loads no stylesheet`);
  if (!css.includes(ownSelector)) fail(`${page}: its own styles (${ownSelector}) are missing`);
  if (css.includes(foreignSelector)) fail(`${page}: loads another page's styles (${foreignSelector})`);
  if (!css.includes("--brand:")) fail(`${page}: shared base styles (--brand) are missing`);
  if (!failed) console.log(`✓ ${page}: ${stylesheets.join(", ")}`);
}

if (failed) process.exit(1);
