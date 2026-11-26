# Infrastructure

Smart Logistics infrastructure is defined in `infrastructure/cloudformation/main.yaml` and is
validated statically (no AWS credentials required). It has **not been deployed** from this
repository.

## Resources

| Resource                    | Type                 | Purpose                                                    |
| --------------------------- | -------------------- | ---------------------------------------------------------- |
| DeliveriesTable             | DynamoDB             | Deliveries + GSIs (status, carrier, region, trackingCode)  |
| HistoricalDataBucket        | S3                   | Future historical datasets (versioned, encrypted, private) |
| FrontendBucket              | S3                   | SPA assets (private, encrypted)                            |
| FrontendOriginAccessControl | CloudFront OAC       | Restricts S3 access to CloudFront                          |
| FrontendBucketPolicy        | S3 bucket policy     | Allows CloudFront (OAC) read-only                          |
| CloudFrontDistribution      | CloudFront           | HTTPS CDN with SPA fallback                                |
| RouterLogGroup              | CloudWatch Logs      | Lambda logs with configurable retention                    |
| RouterRole                  | IAM                  | Least-privilege Lambda execution role                      |
| RouterFunction              | Lambda               | API router (Node.js)                                       |
| HttpApi                     | API Gateway HTTP API | Public API                                                 |
| RouterIntegration + Routes  | API Gateway          | Proxy integration for all endpoints                        |
| HttpApiStage                | API Gateway          | Stage (per environment)                                    |
| ApiInvokePermission         | Lambda               | API Gateway → Lambda invoke                                |

No SageMaker endpoints, notebooks, or training jobs are created.

## Parameters

- `EnvironmentName`, `ApplicationName`
- `DynamoDBBillingMode` (`PAY_PER_REQUEST` default, `PROVISIONED` optional) + capacity
- `CloudWatchRetentionInDays`
- `BedrockModelId`, `BedrockRegion` (empty model id disables the assistant → 503)
- `SageMakerEndpointName` (optional, not created here)
- `LambdaCodeBucket`, `LambdaCodeKey`

## Outputs

`ApiUrl`, `DeliveriesTableName`, `HistoricalDataBucketName`, `FrontendBucketName`,
`CloudFrontDomain`.

## Packaging and deployment

1. Build the API bundle:

   ```bash
   pnpm --filter @smart-logistics/api build   # produces apps/api/dist/index.cjs
   ```

2. Upload the bundle to an S3 bucket you control (the bucket is not created by the stack):

   ```bash
   aws s3 cp apps/api/dist/index.cjs s3://<code-bucket>/smart-logistics/api.zip
   ```

3. Deploy the stack:

   ```bash
   aws cloudformation deploy \
     --template-file infrastructure/cloudformation/main.yaml \
     --stack-name smart-logistics \
     --parameter-overrides EnvironmentName=prod LambdaCodeBucket=<code-bucket> \
     --capabilities CAPABILITY_IAM
   ```

4. Build and publish the web app:

   ```bash
   pnpm --filter @smart-logistics/web build
   aws s3 sync apps/web/dist s3://<frontend-bucket> --delete
   ```

   The frontend bucket name is the `FrontendBucketName` output.

5. (Optional) Seed `data/samples/deliveries.json` into DynamoDB with a small script.

## Validation (local, no AWS credentials)

```bash
cfn-lint infrastructure/cloudformation/main.yaml
node scripts/infra-static-checks.mjs
```

CI additionally runs `yamllint` and CloudFormation Guard
(`infrastructure/guard/rules.guard`) via `.github/workflows/infrastructure.yaml`.

## Cost considerations

- **Lambda / API Gateway / DynamoDB (on-demand) / S3 / CloudFront**: pay-per-use, low for a
  portfolio workload.
- **Bedrock**: billed per request when enabled.
- **CloudWatch Logs**: retention is configurable (default 14 days) to limit storage cost.
- **SageMaker**: not provisioned; a real-time endpoint would incur hourly charges and is
  intentionally excluded.

## Branch protection (manual)

Branch protection and required status checks cannot be set from repository code. On GitHub,
protect `main` and require the `CI` checks (`Lint, typecheck, test and build`) and, when
infrastructure files change, `Infrastructure Validation` (`Static infrastructure validation`).

## Limitations

- The stack is validated statically but not deployed here.
- Lambda code must be packaged and uploaded to S3 before deployment.
- `cfn-guard` runs in CI; local validation covers cfn-lint and the static security script.
