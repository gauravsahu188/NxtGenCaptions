# Terraform configuration for NxtGen Captions S3 Infrastructure
# This creates the exports bucket with lifecycle policy for auto-cleanup

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1" # Mumbai region - closest to India users
}

# ─────────────────────────────────────────────────────────────────────────────
# Variables
# ─────────────────────────────────────────────────────────────────────────────

variable "project_prefix" {
  description = "Prefix for all resources"
  default     = "nxtgen"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  default     = "prod"
}

# ─────────────────────────────────────────────────────────────────────────────
# S3 Bucket for Completed Exports
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_s3_bucket" "completed_exports" {
  bucket = "${var.project_prefix}-completed-exports-${var.environment}"

  tags = {
    Name        = "NxtGen Completed Exports"
    Environment = var.environment
    Project     = "nxtgen-captions"
    ManagedBy   = "terraform"
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "completed_exports" {
  bucket = aws_s3_bucket.completed_exports.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ─────────────────────────────────────────────────────────────────────────────
# Lifecycle Policy: 48-hour expiration
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_s3_bucket_lifecycle_configuration" "completed_exports" {
  bucket = aws_s3_bucket.completed_exports.id

  rule {
    id     = "expire-old-exports"
    status = "Enabled"

    filter {
      prefix = "" # Apply to all objects
    }

    expiration {
      days = 2 # 48 hours
    }
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# S3 Bucket Policy for Lambda Execution Role
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_s3_bucket_policy" "completed_exports" {
  bucket = aws_s3_bucket.completed_exports.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowLambdaPutObject",
        Effect = "Allow",
        Principal = {
          AWS = "*" # Replace with actual Lambda execution role ARN
        },
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ],
        Resource = "${aws_s3_bucket.completed_exports.arn}/*"
      },
      {
        Sid    = "AllowLambdaGetObject",
        Effect = "Allow",
        Principal = {
          AWS = "*" # Replace with actual Lambda execution role ARN
        },
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ],
        Resource = "${aws_s3_bucket.completed_exports.arn}/*"
      },
      {
        Sid    = "AllowLambdaListBucket",
        Effect = "Allow",
        Principal = {
          AWS = "*" # Replace with actual Lambda execution role ARN
        },
        Action = [
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads"
        ],
        Resource = aws_s3_bucket.completed_exports.arn
      }
    ]
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# CORS Configuration for presigned URLs
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_s3_bucket_cors_configuration" "completed_exports" {
  bucket = aws_s3_bucket.completed_exports.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"] # Restrict to your domain in production
    max_age_seconds = 3600
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# Output
# ─────────────────────────────────────────────────────────────────────────────

output "bucket_name" {
  description = "Name of the completed exports bucket"
  value       = aws_s3_bucket.completed_exports.id
}

output "bucket_arn" {
  description = "ARN of the completed exports bucket"
  value       = aws_s3_bucket.completed_exports.arn
}

output "bucket_domain" {
  description = "Domain name of the bucket"
  value       = aws_s3_bucket.completed_exports.bucket_domain_name
}