import type {
  Delivery,
  DeliveryEvent,
  DeliveryInput,
  DeliveryStatus,
} from "@smart-logistics/shared";

export const DELIVERY_STATUS_TRANSITIONS: Record<DeliveryStatus, readonly DeliveryStatus[]> = {
  pending: ["in_transit", "cancelled"],
  in_transit: ["out_for_delivery", "delayed", "cancelled"],
  out_for_delivery: ["delivered", "delayed"],
  delayed: ["in_transit", "out_for_delivery", "delivered"],
  delivered: [],
  cancelled: [],
};

export function canTransition(from: DeliveryStatus, to: DeliveryStatus): boolean {
  return DELIVERY_STATUS_TRANSITIONS[from].includes(to);
}

export function createDelivery(input: DeliveryInput, id: string, now: Date): Delivery {
  const iso = now.toISOString();
  const event: DeliveryEvent = {
    eventId: `${id}-evt-0`,
    deliveryId: id,
    status: "pending",
    occurredAt: iso,
    location: input.origin,
    note: "Delivery created",
  };
  return {
    id,
    trackingCode: input.trackingCode,
    status: "pending",
    origin: input.origin,
    destination: input.destination,
    carrier: input.carrier,
    region: input.region,
    distanceKm: input.distanceKm,
    estimatedDeliveryAt: input.estimatedDeliveryAt,
    createdAt: iso,
    updatedAt: iso,
    events: [event],
  };
}

export function appendEvent(
  delivery: Delivery,
  event: Omit<DeliveryEvent, "eventId" | "deliveryId">,
  now: Date,
): Delivery {
  const next: DeliveryEvent = {
    ...event,
    eventId: `${delivery.id}-evt-${delivery.events.length}`,
    deliveryId: delivery.id,
  };
  const actualDeliveryAt =
    event.status === "delivered"
      ? (delivery.actualDeliveryAt ?? now.toISOString())
      : delivery.actualDeliveryAt;
  return {
    ...delivery,
    status: event.status,
    actualDeliveryAt,
    updatedAt: now.toISOString(),
    events: [...delivery.events, next],
  };
}

export function isDelayed(delivery: Delivery, now: Date): boolean {
  if (delivery.status === "delivered" || delivery.status === "cancelled") return false;
  return new Date(delivery.estimatedDeliveryAt).getTime() < now.getTime();
}
