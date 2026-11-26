import type { Delivery, DeliveryInput, DeliveryListQuery } from "@smart-logistics/shared";

export interface ListResult {
  items: Delivery[];
  total: number;
}

export interface DeliveryRepository {
  getById(id: string): Promise<Delivery | null>;
  list(query: DeliveryListQuery): Promise<ListResult>;
  create(delivery: Delivery): Promise<Delivery>;
  save(delivery: Delivery): Promise<Delivery>;
  all(): Promise<Delivery[]>;
}

export type NewDelivery = DeliveryInput;
