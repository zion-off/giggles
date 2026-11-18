# Reads CLOUDFLARE_API_TOKEN.
provider "cloudflare" {}

# Set by the deploy workflow from /deploy/giggles/TF_VAR_cloudflare_account_id.
variable "cloudflare_account_id" {
  type = string
}
