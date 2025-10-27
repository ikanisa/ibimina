terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "random_password" "field_encryption" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "ibimina" {
  name        = "${var.project_name}-app-secrets"
  description = "Runtime secrets for the Ibimina staff PWA"
}

resource "aws_secretsmanager_secret_version" "ibimina" {
  secret_id     = aws_secretsmanager_secret.ibimina.id
  secret_string = jsonencode({
    LOG_DRAIN_URL             = var.log_drain_url
    LOG_DRAIN_TOKEN           = var.log_drain_token
    LOG_DRAIN_ALERT_WEBHOOK   = var.log_drain_alert_webhook
    LOG_DRAIN_ALERT_TOKEN     = var.log_drain_alert_token
    FIELD_ENCRYPTION_KEY      = random_password.field_encryption.result
    RATE_LIMIT_MAX            = var.rate_limit_max
    RATE_LIMIT_WINDOW_SECONDS = var.rate_limit_window_seconds
    RECON_AUTO_ESCALATE_HOURS = var.recon_auto_escalate_hours
    OPENAI_API_KEY            = var.openai_api_key
    OPENAI_RESPONSES_MODEL    = var.openai_responses_model
  })
}

resource "aws_cloudwatch_log_group" "edge_functions" {
  name              = "/ibimina/${var.environment}/edge-functions"
  retention_in_days = 30
}

resource "aws_s3_bucket" "reports" {
  bucket = "${var.project_name}-${var.environment}-reports"
  force_destroy = true

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  versioning {
    enabled = true
  }
}

variable "project_name" {
  type        = string
  description = "Prefix used for cloud resources"
}

variable "environment" {
  type        = string
  description = "Deployment environment (e.g. staging, prod)"
}

variable "aws_region" {
  type        = string
  description = "AWS region for infrastructure"
  default     = "eu-west-1"
}

variable "rate_limit_max" {
  type        = number
  description = "Default max hits per window for edge function rate limiting"
  default     = 300
}

variable "rate_limit_window_seconds" {
  type        = number
  description = "Rate limit window in seconds"
  default     = 60
}

variable "recon_auto_escalate_hours" {
  type        = number
  description = "Lookback window for scheduled reconciliation escalation"
  default     = 48
}

variable "openai_api_key" {
  type        = string
  description = "API key for AI fallback parsing"
  sensitive   = true
}

variable "openai_responses_model" {
  type        = string
  description = "OpenAI Responses API model used for structured SMS parsing"
  default     = "gpt-4.1-mini"
}

variable "log_drain_url" {
  type        = string
  description = "External endpoint that receives structured log payloads"
}

variable "log_drain_token" {
  type        = string
  description = "Bearer token added to log drain requests"
  sensitive   = true
}

variable "log_drain_alert_webhook" {
  type        = string
  description = "Webhook invoked when the log drain repeatedly fails"
}

variable "log_drain_alert_token" {
  type        = string
  description = "Bearer token included with log drain alert webhook calls"
  sensitive   = true
}
