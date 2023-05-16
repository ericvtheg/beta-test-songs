terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
      configuration_aliases = [ aws.us-east-1 ]
    }
  }

  backend "s3" {
    bucket                  = "beta-test-songs-frontend-terraform-state-bucket"
    key                     = "tfstate"
    region                  = "us-east-2"
    profile                 = "default"
    encrypt                 = "true"
    dynamodb_table          = "beta-test-songs-frontend-terraform-lock"
    shared_credentials_file = "$HOME/.aws/credentials"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

provider "aws" {
  alias = "us-east-1"
  region = "us-east-1"
  
  default_tags {
    tags = local.common_tags
  }
}