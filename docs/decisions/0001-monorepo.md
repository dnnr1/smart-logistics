# ADR 0001 — Monorepo with pnpm workspaces

- Status: Accepted
- Date: 2026-11-26

## Context

The project spans a web app, an API, shared domain logic, infrastructure, and docs. We need
one place to version, lint, test, and build everything with dependency-aware commands.

## Decision

Use **pnpm workspaces** with:

- `apps/web` — React SPA
- `apps/api` — Lambda handlers + services
- `packages/domain` — entities and pure business logic
- `packages/shared` — shared types and Zod contracts

Root scripts orchestrate tasks; CI uses `pnpm -r` (recursive) and `--filter` for
dependency-aware builds. TypeScript project references keep types consistent.

## Consequences

- One `pnpm-lock.yaml` for reproducible installs (`--frozen-lockfile` in CI).
- Shared code is reused by web and api, avoiding drift between client and server contracts.
- Slightly more tooling setup than a single app, justified by the shared domain.