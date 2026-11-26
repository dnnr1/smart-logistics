# Machine Learning Strategy

## Current state (baseline)

Delivery-delay risk is produced by an **explainable heuristic**, not a trained model. It is
implemented in `packages/domain/src/risk/heuristic.ts` behind the `RiskScorer` port and is
covered by unit tests. The API and UI consume the same `RiskResult` shape regardless of the
scorer implementation.

The heuristic combines bounded, documented factors:

| Factor                                                       | Points          |
| ------------------------------------------------------------ | --------------- |
| Distance (>300 / >800 / >1500 km)                            | 6 / 12 / 20     |
| Estimated transit (>24 / >48 / >72 h)                        | 8 / 14 / 20     |
| Carrier historical delay rate                                | `rate * 30`     |
| Current status (delayed/pending/out_for_delivery/in_transit) | 30 / 10 / 8 / 4 |

The total is clamped to `[0,100]` and mapped to `low` (<33), `medium` (33–65), `high` (≥66),
with contributing factors and recommended actions. **This is a demonstration baseline.**

## Why a heuristic first

- No labeled historical dataset or trained model exists yet.
- It is transparent, testable, and cheap to run.
- It establishes the interface and output contract the UI depends on.

## Evolution to a trained model (future)

1. **Dataset** — store historical deliveries (with outcomes) in the S3 historical bucket
   (`infrastructure/cloudformation` provisions it; no data is uploaded by default).
2. **Preprocessing** — feature engineering (distance, transit, carrier/region aggregates,
   status), train/validation split.
3. **Training** — Amazon SageMaker training job (not provisioned by default, to avoid cost).
4. **Evaluation** — precision/recall/ROC-AUC on held-out data; compare against the heuristic.
5. **Deployment** — a SageMaker real-time endpoint (explicit, opt-in; not created by default).
6. **Integration** — implement `SageMakerRiskScorer` (stub in
   `packages/domain/src/risk/sagemaker.ts`) that calls the endpoint and maps the response to
   `RiskResult`. Select it with `RISK_SCORER=sagemaker` and `SAGEMAKER_ENDPOINT_NAME`.

Because the scorer is behind a port and selected by configuration, switching backends requires
no API or UI changes.

## Guardrails

- The heuristic is never presented as a trained model.
- Requesting `RISK_SCORER=sagemaker` without an implementation fails loudly instead of silently
  falling back to the heuristic.
- No SageMaker endpoints, notebooks, or training jobs are created by CloudFormation.
