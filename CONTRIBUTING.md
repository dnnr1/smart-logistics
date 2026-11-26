# Contributing to Smart Logistics

## Development setup

```bash
pnpm install
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Workflow

- Keep `main` stable; use feature branches (e.g. `feat/delivery-api`).
- Use **Conventional Commits** (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`,
  `ci`, `style`).
- Keep commits small and self-contained; never commit broken code or secrets.
- Every PR must pass CI (format, lint, typecheck, test, build) and, when `infrastructure/**`
  changes, the infrastructure validation workflow.

## Code style

- TypeScript strict mode; no `any` without justification.
- Validate external input with Zod.
- Prefer pure domain logic; keep AWS calls behind interfaces.
- Run `pnpm format` before committing.

## Commit message examples

```
feat(web): add logistics dashboard
feat(api): implement delivery endpoints
feat(ml): implement delivery risk scoring
test(api): add delivery service tests
docs: document architecture and deployment
```

## Reporting issues

Open a GitHub issue describing the problem, expected behavior, and reproduction steps.
