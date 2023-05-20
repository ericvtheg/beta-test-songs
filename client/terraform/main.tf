resource "aws_s3_bucket" "beta-test-songs-frontend-bucket" {
  bucket = var.frontend_bucket_name
}

resource "aws_s3_bucket_ownership_controls" "beta-test-songs-frontend-bucket-controls" {
  bucket = aws_s3_bucket.beta-test-songs-frontend-bucket.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "beta-test-songs-frontend-bucket-acl" {
  depends_on = [
    aws_s3_bucket_ownership_controls.beta-test-songs-frontend-bucket-controls,
    aws_s3_bucket_public_access_block.beta-test-songs-frontend-bucket-access,
  ]

  bucket = aws_s3_bucket.beta-test-songs-frontend-bucket.id
  acl    = "public-read"
}

resource "aws_s3_bucket_public_access_block" "beta-test-songs-frontend-bucket-access" {
  bucket = aws_s3_bucket.beta-test-songs-frontend-bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "beta-test-songs-frontend-bucket-policy" {
  bucket = aws_s3_bucket.beta-test-songs-frontend-bucket.id
  policy = jsonencode(
    {
      "Version" : "2012-10-17",
      "Statement" : [
        {
          "Sid" : "PublicReadGetObject",
          "Effect" : "Allow",
          "Principal" : "*",
          "Action" : "s3:GetObject",
          "Resource" : "arn:aws:s3:::${aws_s3_bucket.beta-test-songs-frontend-bucket.id}/*"
        }
      ]
    }
  )
}

resource "aws_s3_object" "beta-test-songs-frontend-bucket-files" {
  for_each     = fileset("${path.module}/..", "dist/**/*.{html,css,js}") #can include images here
  bucket       = aws_s3_bucket.beta-test-songs-frontend-bucket.id
  key          = replace(each.value, "/^dist//", "")
  source       = "../${each.value}"
  content_type = lookup(local.content_types, regex("\\.[^.]+$", each.value), null)
  etag         = filemd5("../${each.value}")
}

resource "aws_s3_bucket_website_configuration" "beta-test-songs-frontend-hosting" {
  bucket = aws_s3_bucket.beta-test-songs-frontend-bucket.id

  index_document {
    suffix = "index.html"
  }
  error_document {
    key = "index.html"
  }
}

resource "aws_acm_certificate" "beta-test-songs-frontend-cert" {
  provider = aws.us-east-1

  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}", "*.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_cloudfront_distribution" "beta-test-songs-frontend-distribution" {
  enabled         = true
  is_ipv6_enabled = true

  origin {
    domain_name = aws_s3_bucket_website_configuration.beta-test-songs-frontend-hosting.website_endpoint
    origin_id   = aws_s3_bucket.beta-test-songs-frontend-bucket.bucket_regional_domain_name

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_keepalive_timeout = 5
      origin_protocol_policy   = "http-only"
      origin_read_timeout      = 30
      origin_ssl_protocols = [
        "TLSv1.2",
      ]
    }
  }

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.beta-test-songs-frontend-cert.arn
    ssl_support_method  = "sni-only"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
      locations        = []
    }
  }

  aliases = [var.domain_name, "www.${var.domain_name}", "*.${var.domain_name}"]

  default_cache_behavior {
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = aws_s3_bucket.beta-test-songs-frontend-bucket.bucket_regional_domain_name
  }

  origin {
    domain_name = var.alb_dns_name
    origin_id   = "BACKEND_ALB_ORIGIN_ID"

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_keepalive_timeout = 5
      origin_protocol_policy   = "https-only"
      origin_read_timeout      = 30
      origin_ssl_protocols = [
        "TLSv1.2",
      ]
    }
  }

  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "BACKEND_ALB_ORIGIN_ID"

    forwarded_values {
      query_string = true
      headers      = ["Origin", "Host"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }
}

resource "aws_route53_record" "www-beta-test-songs" {
  zone_id = var.dns_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.beta-test-songs-frontend-distribution.domain_name
    zone_id                = aws_cloudfront_distribution.beta-test-songs-frontend-distribution.hosted_zone_id
    evaluate_target_health = true
  }
}
