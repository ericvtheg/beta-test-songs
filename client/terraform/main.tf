resource "aws_s3_bucket" "beta-test-songs-frontend-bucket" {
  bucket = var.frontend_bucket_name
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
  source       = each.value
  content_type = lookup(local.content_types, regex("\\.[^.]+$", each.value), null)
  etag         = filemd5("../${each.value}")
}

resource "aws_s3_bucket_website_configuration" "beta-test-songs-frontend-hosting" {
  bucket = aws_s3_bucket.beta-test-songs-frontend-bucket.id

  index_document {
    suffix = "index.html"
  }
}