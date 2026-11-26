# ADR 0003 — Explainable heuristic risk scoring, SageMaker-ready

- Status: Accepted
- Date: 2026-11-26

## Context

We must provide delivery-delay risk now, without claiming a trained ML model exists, and
without provisioning expensive SageMaker resources by default.

## Decision

Introduce a `RiskScorer` port:

```ts
interface RiskScorer {
  score(input: RiskInput): RiskResult; // { score, level, factors[], actions[] }
}
```

- Default implementation `HeuristicRiskScorer`: a transparent weighted sum producing a
  score in `[0,100]`, with each contributing factor and a recommended action. Weights are
  constants documented in code. This is explicitly a **demonstration heuristic**, not a
  trained model.
- Future `SageMakerRiskScorer` calls a real-time endpoint and maps the response to the same
  `RiskResult`. Selection via `RISK_SCORER` env/parameter.

## Consequences

- The API and UI do not change when the backend scorer is swapped.
- No SageMaker endpoints/notebooks/training jobs are created by CloudFormation (cost safety).
- The heuristic's limitations are documented; it is not presented as ML.
- Training pipeline (S3 dataset → SageMaker → endpoint) is documented as future work.