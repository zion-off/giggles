# The documentation site, deployed as the giggles-docs Worker. scripts/build-docs.sh
# produces documentation/dist (the bundled Worker and its WebAssembly modules) and
# documentation/.open-next/assets (static files). The hostname giggles.zzzzion.com
# is managed in zion-off/infra.

locals {
  docs_dir    = "${path.module}/../documentation"
  docs_worker = "${local.docs_dir}/dist/worker.js"

  # Wrangler names WebAssembly modules <hash>-<name>.wasm?module, and worker.js
  # imports them by those names. The hashes change with the libraries' versions.
  docs_wasm_modules = fileset("${local.docs_dir}/dist", "*.wasm*")
}

resource "cloudflare_workers_script" "docs" {
  account_id     = var.cloudflare_account_id
  script_name    = "giggles-docs"
  main_module    = "worker.js"
  content_file   = local.docs_worker
  content_sha256 = filesha256(local.docs_worker)

  # Must match documentation/wrangler.jsonc, which Wrangler bundles with.
  compatibility_date  = "2026-02-22"
  compatibility_flags = ["nodejs_compat"]

  # The provider computes each module's hash from its file.
  files = {
    for name in local.docs_wasm_modules : name => {
      content_file = "${local.docs_dir}/dist/${name}"
      content_type = "application/wasm"
    }
  }

  assets = {
    directory = "${local.docs_dir}/.open-next/assets"
  }

  bindings = [{
    name = "ASSETS"
    type = "assets"
  }]
}
