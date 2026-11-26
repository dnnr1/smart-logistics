import { z } from "zod";
import { deliveryStatusSchema } from "./delivery";

export const statusDistributionSchema = z.object({
  status: deliveryStatusSchema,
  count: z.number().int().nonnegative(),
});
export type StatusDistribution = z.infer<typeof statusDistributionSchema>;

export const performancePointSchema = z.object({
  date: z.string(),
  total: z.number().int().nonnegative(),
  delivered: z.number().int().nonnegative(),
  delayed: z.number().int().nonnegative(),
});
export type PerformancePoint = z.infer<typeof performancePointSchema>;

export const carrierPerformanceSchema = z.object({
  carrier: z.string(),
  total: z.number().int().nonnegative(),
  delivered: z.number().int().nonnegative(),
  delayed: z.number().int().nonnegative(),
  onTimeRate: z.number().min(0).max(1),
});
export type CarrierPerformance = z.infer<typeof carrierPerformanceSchema>;

export const regionPerformanceSchema = z.object({
  region: z.string(),
  total: z.number().int().nonnegative(),
  delayed: z.number().int().nonnegative(),
  delayRate: z.number().min(0).max(1),
});
export type RegionPerformance = z.infer<typeof regionPerformanceSchema>;

export const recentActivitySchema = z.object({
  id: z.string(),
  deliveryId: z.string(),
  status: deliveryStatusSchema,
  occurredAt: z.string().datetime(),
  location: z.string(),
});
export type RecentActivity = z.infer<typeof recentActivitySchema>;

export const analyticsSchema = z.object({
  totalDeliveries: z.number().int().nonnegative(),
  inTransit: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  delayed: z.number().int().nonnegative(),
  successRate: z.number().min(0).max(1),
  statusDistribution: z.array(statusDistributionSchema),
  performanceOverTime: z.array(performancePointSchema),
  carrierPerformance: z.array(carrierPerformanceSchema),
  regionPerformance: z.array(regionPerformanceSchema),
  recentActivity: z.array(recentActivitySchema),
});
export type Analytics = z.infer<typeof analyticsSchema>;
