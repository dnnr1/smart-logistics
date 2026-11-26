# Security & Responsible AI

This document describes the security posture of Smart Logistics. Controls marked
_(planned)_ are implemented in later phases; this file is updated as they land.

## 1. Secrets & credentials

- No AWS credentials, API keys, or secrets are committed. `.env.example` lists variable
  names only, never values.
- AWS access is provided to Lambda via its **execution role** (IAM), never via static keys.
- CloudFormation templates contain **no secrets**; runtime config comes from environment
  variables and SSM/parameters.
- `.gitignore` excludes `.env`, build output, and local credential files.

## 2. IAM least privilege

- Each Lambda role is scoped to the specific DynamoDB table/GSIs and (for the assistant)
  the specific Bedrock model/region it needs.
- No `Action: "*"` on `Resource: "*"` in application roles. Wildcards are avoided where a
  concrete ARN is available (table, bucket, log group, model).
- API Gateway → Lambda invoke permission is scoped per API/stage.

## 3. Data protection

- S3 buckets: **public access blocked**, default encryption (SSE-S3/SSE-KMS), versioning on
  the historical bucket.
- DynamoDB: encryption at rest (AWS-managed or KMS), point-in-time recovery optional.
- CloudWatch log groups: encrypted, with a configurable retention period.
- Transport: CloudFront and API Gateway are HTTPS-only.

## 4. Input validation & output safety

- All external input validated with **Zod** (path/query/body) before use.
- Centralized error handling returns generic messages + request id; internal errors are
  logged, not leaked.
- Structured logging avoids logging secrets or full payloads of sensitive fields.

## 5. Responsible AI

- Bedrock is called **only on the backend**; credentials never reach the frontend.
- Answers are **grounded** in real analytics context; the system prompt forbids inventing
  metrics and requires an explicit "insufficient data" response when context is lacking.
- The assistant **cannot modify** logistics records (read-only Q&A surface).
- Uncertainty is explicit; humans remain responsible for operational decisions.
- If Bedrock is unavailable, the API returns `503 AI_UNAVAILABLE` and the UI shows a clear
  unavailable state — no simulated or hardcoded "AI" answers.

## 6. CI/CD security

- GitHub Actions uses least-privilege `permissions` (contents: read by default).
- Third-party actions pinned to reviewed versions/SHAs.
- Static infrastructure validation runs **without AWS credentials**.
- No secrets are exposed in workflow logs.

## 7. Data usage

- All sample/seed data is **fictional**. No real customer or employer data is used.