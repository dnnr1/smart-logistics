import { z } from "zod";

export const assistantRequestSchema = z.object({
  question: z.string().trim().min(3).max(500),
});
export type AssistantRequest = z.infer<typeof assistantRequestSchema>;

export const assistantSourceSchema = z.object({
  type: z.enum(["count", "rate", "carrier", "region", "delivery"]),
  label: z.string(),
  value: z.union([z.number(), z.string()]),
});
export type AssistantSource = z.infer<typeof assistantSourceSchema>;

export const assistantResponseSchema = z.object({
  answer: z.string(),
  grounded: z.boolean(),
  sources: z.array(assistantSourceSchema),
});
export type AssistantResponse = z.infer<typeof assistantResponseSchema>;
