import type { Delivery, DeliveryListQuery } from "@smart-logistics/shared";
import type { DeliveryRepository, ListResult } from "../application/ports";

/** In-memory repository used by tests and local development. */
export class InMemoryDeliveryRepository implements DeliveryRepository {
  private readonly items = new Map<string, Delivery>();

  async getById(id: string): Promise<Delivery | null> {
    return this.items.get(id) ?? null;
  }

  async list(query: DeliveryListQuery): Promise<ListResult> {
    let filtered = [...this.items.values()];
    if (query.status) filtered = filtered.filter((d) => d.status === query.status);
    if (query.carrier) filtered = filtered.filter((d) => d.carrier === query.carrier);
    if (query.q) {
      const q = query.q.toUpperCase();
      filtered = filtered.filter((d) => d.trackingCode.includes(q));
    }
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const total = filtered.length;
    const start = (query.page - 1) * query.pageSize;
    const items = filtered.slice(start, start + query.pageSize);
    return { items, total };
  }

  async create(delivery: Delivery): Promise<Delivery> {
    this.items.set(delivery.id, delivery);
    return delivery;
  }

  async save(delivery: Delivery): Promise<Delivery> {
    this.items.set(delivery.id, delivery);
    return delivery;
  }

  async all(): Promise<Delivery[]> {
    return [...this.items.values()];
  }

  seed(deliveries: Delivery[]): void {
    for (const d of deliveries) this.items.set(d.id, d);
  }
}
