import type {
  Delivery,
  DeliveryInput,
  DeliveryListQuery,
  PaginatedData,
} from "@smart-logistics/shared";
import { createDelivery } from "@smart-logistics/domain";
import { randomUUID } from "node:crypto";
import type { DeliveryRepository } from "./ports";

export class DeliveryService {
  constructor(private readonly repo: DeliveryRepository) {}

  async get(id: string): Promise<Delivery | null> {
    return this.repo.getById(id);
  }

  async list(query: DeliveryListQuery): Promise<PaginatedData<Delivery>> {
    const { items, total } = await this.repo.list(query);
    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async create(input: DeliveryInput): Promise<Delivery> {
    const id = randomUUID();
    const delivery = createDelivery(input, id, new Date());
    return this.repo.create(delivery);
  }
}
