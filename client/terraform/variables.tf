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
  aws_region = var.aws_region
  prefix     = var.service
  common_tags = {
    service   = var.service
    managedBy = "terraform"
    stage     = var.stage
  }
  content_types = {
    ".html" : "text/html",
    ".css" : "text/css",
    ".js" : "text/javascript"
  }
}

variable "domain_name" {
  type        = string
  description = "The domain name for the website."
}

variable "dns_zone_id" {
  type      = string
  sensitive = true
}

variable "frontend_bucket_name" {
  type        = string
  description = "The name of the bucket without the www. prefix. Normally domain_name."
}

variable "alb_dns_name" {
  type        = string
  description = "DNS of the application load balancer for our backend API."
}