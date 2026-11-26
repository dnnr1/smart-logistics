import type {
  Analytics,
  CarrierPerformance,
  Delivery,
  PerformancePoint,
  RecentActivity,
  RegionPerformance,
  StatusDistribution,
} from "@smart-logistics/shared";
import { isDelayed } from "./delivery";

function round(value: number, digits = 4): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

export function computeAnalytics(deliveries: Delivery[], now: Date = new Date()): Analytics {
  const totalDeliveries = deliveries.length;
  const inTransit = deliveries.filter(
    (d) => d.status === "in_transit" || d.status === "out_for_delivery",
  ).length;
  const completed = deliveries.filter((d) => d.status === "delivered").length;
  const delayed = deliveries.filter((d) => d.status === "delayed" || isDelayed(d, now)).length;
  const successRate = totalDeliveries === 0 ? 0 : round(completed / totalDeliveries);

  const statusCounts = new Map<string, number>();
  for (const d of deliveries) {
    statusCounts.set(d.status, (statusCounts.get(d.status) ?? 0) + 1);
  }
  const statusDistribution: StatusDistribution[] = [...statusCounts.entries()].map(
    ([status, count]) => ({ status: status as StatusDistribution["status"], count }),
  );

  const byDate = new Map<string, PerformancePoint>();
  for (const d of deliveries) {
    const date = d.createdAt.slice(0, 10);
    const point = byDate.get(date) ?? { date, total: 0, delivered: 0, delayed: 0 };
    point.total += 1;
    if (d.status === "delivered") point.delivered += 1;
    if (d.status === "delayed" || isDelayed(d, now)) point.delayed += 1;
    byDate.set(date, point);
  }
  const performanceOverTime = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

  const carrierMap = new Map<string, { total: number; delivered: number; delayed: number }>();
  for (const d of deliveries) {
    const c = carrierMap.get(d.carrier) ?? { total: 0, delivered: 0, delayed: 0 };
    c.total += 1;
    if (d.status === "delivered") c.delivered += 1;
    if (d.status === "delayed" || isDelayed(d, now)) c.delayed += 1;
    carrierMap.set(d.carrier, c);
  }
  const carrierPerformance: CarrierPerformance[] = [...carrierMap.entries()]
    .map(([carrier, c]) => ({
      carrier,
      total: c.total,
      delivered: c.delivered,
      delayed: c.delayed,
      onTimeRate: c.total === 0 ? 0 : round((c.total - c.delayed) / c.total),
    }))
    .sort((a, b) => a.onTimeRate - b.onTimeRate);

  const regionMap = new Map<string, { total: number; delayed: number }>();
  for (const d of deliveries) {
    const r = regionMap.get(d.region) ?? { total: 0, delayed: 0 };
    r.total += 1;
    if (d.status === "delayed" || isDelayed(d, now)) r.delayed += 1;
    regionMap.set(d.region, r);
  }
  const regionPerformance: RegionPerformance[] = [...regionMap.entries()]
    .map(([region, r]) => ({
      region,
      total: r.total,
      delayed: r.delayed,
      delayRate: r.total === 0 ? 0 : round(r.delayed / r.total),
    }))
    .sort((a, b) => b.delayRate - a.delayRate);

  const recentActivity: RecentActivity[] = deliveries
    .flatMap((d) =>
      d.events.map((e) => ({
        id: e.eventId,
        deliveryId: d.id,
        status: e.status,
        occurredAt: e.occurredAt,
        location: e.location,
      })),
    )
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 10);

  return {
    totalDeliveries,
    inTransit,
    completed,
    delayed,
    successRate,
    statusDistribution,
    performanceOverTime,
    carrierPerformance,
    regionPerformance,
    recentActivity,
  };
}
