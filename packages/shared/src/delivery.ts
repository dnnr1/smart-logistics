import { z } from "zod";

export const deliveryStatusSchema = z.enum([
  "pending",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "delayed",
  "cancelled",
]);

export type DeliveryStatus = z.infer<typeof deliveryStatusSchema>;

export const deliveryEventSchema = z.object({
  eventId: z.string().min(1),
  deliveryId: z.string().min(1),
  status: deliveryStatusSchema,
  occurredAt: z.string().datetime(),
  location: z.string().min(1),
  note: z.string().max(500).optional(),
});

export type DeliveryEvent = z.infer<typeof deliveryEventSchema>;

export const deliverySchema = z.object({
  id: z.string().min(1),
  trackingCode: z.string().regex(/^[A-Z0-9]{8,16}$/),
  status: deliveryStatusSchema,
  origin: z.string().min(1),
  destination: z.string().min(1),
  carrier: z.string().min(1),
  region: z.string().min(1),
  distanceKm: z.number().nonnegative(),
  estimatedDeliveryAt: z.string().datetime(),
  actualDeliveryAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  events: z.array(deliveryEventSchema),
});

export type Delivery = z.infer<typeof deliverySchema>;

export const deliveryInputSchema = z.object({
  trackingCode: z.string().regex(/^[A-Z0-9]{8,16}$/),
  origin: z.string().min(1).max(120),
  destination: z.string().min(1).max(120),
  carrier: z.string().min(1).max(80),
  region: z.string().min(1).max(80),
  distanceKm: z.number().nonnegative().max(20000),
  estimatedDeliveryAt: z.string().datetime(),
});

export type DeliveryInput = z.infer<typeof deliveryInputSchema>;

export const deliveryListQuerySchema = z.object({
  status: deliveryStatusSchema.optional(),
  carrier: z.string().min(1).optional(),
  q: z.string().min(1).max(32).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type DeliveryListQuery = z.infer<typeof deliveryListQuerySchema>;
