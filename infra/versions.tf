terraform {
  required_version = ">= 1.10"

  # The deploy workflow passes bucket, key and region during terraform init.
  backend "s3" {}

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.29"
    }
  }
}
