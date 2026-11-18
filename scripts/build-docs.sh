#!/usr/bin/env bash
# Builds the documentation site into the files infra/ uploads. Run from the
# repository root. Nothing here talks to Cloudflare: the last step uses Wrangler
# only to bundle the Worker, and it exits before uploading anything.
set -euo pipefail

# pnpm 9, matching the lockfile and the CI workflows.
if ! command -v pnpm >/dev/null || [ "$(pnpm --version | cut -d. -f1)" != "9" ]; then
  npm install --global pnpm@9
fi

pnpm install --frozen-lockfile
pnpm build                               # the giggles library, which the docs import
pnpm --filter documentation generate-og  # OG images in documentation/public/og
pnpm --filter documentation exec opennextjs-cloudflare build

cd documentation
# The static-assets incremental cache: copies prerendered pages into .open-next/assets.
pnpm exec opennextjs-cloudflare populateCache local
# Bundles .open-next/worker.js and its imports into dist/. OPEN_NEXT_DEPLOY keeps
# Wrangler from handing the command over to opennextjs-cloudflare.
rm -rf dist
OPEN_NEXT_DEPLOY=true pnpm exec wrangler deploy --dry-run --outdir dist
