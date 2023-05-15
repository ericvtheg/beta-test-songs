variable "stage" {
  type    = string
  default = "prod"
}

variable "service" {
  type        = string
  description = "The service name"
  default     = "beta-test-songs"
}

variable "aws_region" {
  type        = string
  description = "The region in which to create and manage resources"
  default     = "us-east-2"
}

locals {
  aws_region = "us-east-2"
  prefix     = "beta-test-songs"
  common_tags = {
    service   = var.service
    managedBy = "terraform"
    stage     = var.stage
  }
  vpc_cidr = var.vpc_cidr
}

variable "vpc_cidr" {
  default = "10.100.0.0/16"
}

variable "azs" {
  type        = list(string)
  description = "the name of availability zones to use subnets"
  default     = ["us-east-2a", "us-east-2b"]
}

variable "public_subnets" {
  type        = list(string)
  description = "the CIDR blocks to create public subnets"
  default     = ["10.100.10.0/24", "10.100.20.0/24"]
}

variable "private_subnets" {
  type        = list(string)
  description = "the CIDR blocks to create private subnets"
  default     = ["10.100.30.0/24", "10.100.40.0/24"]
}

variable "image_tag" {
  type = string
}

### Secrets

output "db_host" {
  value     = aws_db_instance.beta-test-songs-rds.address
  sensitive = true
}

variable "db_name" {
  type      = string
  sensitive = true
}

variable "db_username" {
  type      = string
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "domain_name" {
  type      = string
  sensitive = true
}

variable "dns_zone_id" {
  type      = string
  sensitive = true
}