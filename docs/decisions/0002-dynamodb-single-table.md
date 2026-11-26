# ADR 0002 — DynamoDB single-table design

- Status: Accepted
- Date: 2026-11-26

## Context

Deliveries and their event history must be read by id, listed/filtered by status, and
aggregated by carrier and region. We want low-cost, low-latency access without scans.

## Decision

One DynamoDB table with a generic composite key and three GSIs.

- Table PK/SK: `PK` (`DELIVERY#<id>`), `SK` (`META` for the root item, `EVT#<occurredAt>` for
  events). Delivery history is a single `Query` on `PK` ordered by `SK`.
- `GSI1` (`PK1=STATUS#<status>`, `SK1=createdAt`) — list/filter by status.
- `GSI2` (`PK2=CARRIER#<carrier>`, `SK2=createdAt`) — carrier analytics.
- `GSI3` (`PK3=REGION#<region>`, `SK3=createdAt`) — regional analytics.
- `GSI4` (`trackingCode`) — lookup by tracking code.

All GSIs use `PAY_PER_REQUEST` billing by default (parameterized) to avoid idle capacity cost.

## Consequences

- No cross-item transactions needed for the current access patterns; a `TransactWriteItem`
  can create a delivery + its initial event atomically.
- Event history is naturally ordered and paginated.
- Adding a new access pattern means adding a GSI, not a new table.
- Scan is avoided for all user-facing reads except the tracking-code fallback.
