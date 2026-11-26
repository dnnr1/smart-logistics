import type { RiskScorer } from "@smart-logistics/domain";
import { createRiskScorer } from "@smart-logistics/domain";
import type { AppConfig } from "../config";
import type { AssistantGateway } from "../application/assistant-gateway";
import type { DeliveryRepository } from "../application/ports";
import { DeliveryService } from "../application/delivery-service";
import { AnalyticsService } from "../application/analytics-service";
import { PredictionService } from "../application/prediction-service";
import { AssistantService } from "../application/assistant-service";
import { DynamoDeliveryRepository } from "../infrastructure/dynamo-repo";
import { BedrockAssistantGateway } from "../infrastructure/bedrock-gateway";

export interface Container {
  deliveryService: DeliveryService;
  analyticsService: AnalyticsService;
  predictionService: PredictionService;
  assistantService: AssistantService;
}

export interface ContainerOverrides {
  repo?: DeliveryRepository;
  gateway?: AssistantGateway;
  scorer?: RiskScorer;
}

export function createContainer(config: AppConfig, overrides: ContainerOverrides = {}): Container {
  const repo =
    overrides.repo ?? new DynamoDeliveryRepository(config.dynamodbTableName, config.region);
  const scorer = overrides.scorer ?? createRiskScorer(config.riskScorer);
  const gateway =
    overrides.gateway ?? new BedrockAssistantGateway(config.bedrockModelId, config.bedrockRegion);

  const deliveryService = new DeliveryService(repo);
  const analyticsService = new AnalyticsService(repo);
  const predictionService = new PredictionService(repo, scorer);
  const assistantService = new AssistantService(analyticsService, gateway);

  return { deliveryService, analyticsService, predictionService, assistantService };
}
