terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    bucket                  = "beta-test-songs-terraform-state-bucket"
    key                     = "tfstate"
    region                  = "us-east-2"
    profile                 = "default"
    encrypt                 = "true"
    dynamodb_table          = "beta-test-songs-terraform-lock"
    shared_credentials_file = "$HOME/.aws/credentials"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}