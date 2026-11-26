import type { RiskScorerKind } from "@smart-logistics/domain";

export interface AppConfig {
  region: string;
  dynamodbTableName: string;
  riskScorer: RiskScorerKind;
  sageMakerEndpointName: string;
  bedrockModelId: string;
  bedrockRegion: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const riskScorer = env.RISK_SCORER === "sagemaker" ? "sagemaker" : "heuristic";
  return {
    region: env.AWS_REGION ?? "us-east-1",
    dynamodbTableName: env.DYNAMODB_TABLE_NAME ?? "smart-logistics-dev-deliveries",
    riskScorer,
    sageMakerEndpointName: env.SAGEMAKER_ENDPOINT_NAME ?? "",
    bedrockModelId: env.BEDROCK_MODEL_ID ?? "",
    bedrockRegion: env.BEDROCK_REGION ?? env.AWS_REGION ?? "us-east-1",
  };
}
