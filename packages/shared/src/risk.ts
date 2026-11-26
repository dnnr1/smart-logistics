import { z } from "zod";
import { deliveryStatusSchema } from "./delivery";

export const riskLevelSchema = z.enum(["low", "medium", "high"]);
export type RiskLevel = z.infer<typeof riskLevelSchema>;

export const riskFactorSchema = z.object({
  name: z.string(),
  contribution: z.number(),
  detail: z.string(),
});
export type RiskFactor = z.infer<typeof riskFactorSchema>;

export const riskInputSchema = z.object({
  deliveryId: z.string().min(1).optional(),
  distanceKm: z.number().nonnegative().optional(),
  estimatedTransitHours: z.number().nonnegative().optional(),
  carrier: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  status: deliveryStatusSchema.optional(),
  historicalDelayRate: z.number().min(0).max(1).optional(),
});
export type RiskInput = z.infer<typeof riskInputSchema>;

export const riskResultSchema = z.object({
  score: z.number().min(0).max(100),
  level: riskLevelSchema,
  factors: z.array(riskFactorSchema),
  actions: z.array(z.string()),
  model: z.enum(["heuristic", "sagemaker"]),
});
export type RiskResult = z.infer<typeof riskResultSchema>;

export const predictionRequestSchema = z.object({
  deliveryId: z.string().min(1),
});
export type PredictionRequest = z.infer<typeof predictionRequestSchema>;
