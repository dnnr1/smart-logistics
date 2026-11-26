#!/usr/bin/env node
// Lightweight, dependency-free static security checks for CloudFormation templates.
// Complements cfn-lint (structure) and cfn-guard (rules) with a few high-signal
// assertions that must hold for every template in infrastructure/cloudformation.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "infrastructure/cloudformation";

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ya?ml)$/.test(entry)) out.push(full);
  }
  return out;
}

const failures = [];
const files = walk(ROOT);

if (files.length === 0) {
  failures.push(`No CloudFormation templates found under ${ROOT}`);
}

for (const file of files) {
  const text = readFileSync(file, "utf8");

  // 1. S3 buckets must block public access and encrypt at rest.
  if (text.includes("AWS::S3::Bucket")) {
    for (const setting of [
      "BlockPublicAcls: true",
      "BlockPublicPolicy: true",
      "IgnorePublicAcls: true",
      "RestrictPublicBuckets: true",
    ]) {
      if (!text.includes(setting)) {
        failures.push(`${file}: S3 bucket missing "${setting}"`);
      }
    }
    if (!text.includes("BucketEncryption")) {
      failures.push(`${file}: S3 bucket missing BucketEncryption`);
    }
  }

  // 2. Log groups must set a retention period.
  if (text.includes("AWS::Logs::LogGroup") && !text.includes("RetentionInDays")) {
    failures.push(`${file}: CloudWatch log group missing RetentionInDays`);
  }

  // 3. No IAM policy may pair a wildcard action with a wildcard resource.
  const wildcardAction = /Action:\s*["']?\*/.test(text);
  const wildcardResource = /Resource:\s*["']?\*/.test(text);
  if (wildcardAction && wildcardResource) {
    failures.push(`${file}: wildcard Action with wildcard Resource is not allowed`);
  }
}

if (failures.length > 0) {
  console.error("Static infrastructure security checks FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`Static infrastructure security checks passed (${files.length} template files).`);
