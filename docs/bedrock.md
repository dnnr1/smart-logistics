# Amazon Bedrock Assistant

The AI assistant answers logistics managers' questions using **Amazon Bedrock**, called
**only on the backend**. The frontend never receives AWS credentials or model access.

## Flow

1. `POST /assistant` validates the question with Zod (3–500 chars).
2. `AssistantService` builds a **grounded context** from real analytics (counts, delay rates by
   region, carrier on-time rates).
3. `BedrockAssistantGateway` calls Bedrock `Converse` with a system prompt that:
   - forbids inventing metrics,
   - requires an explicit "insufficient data" answer when context is lacking,
   - keeps the assistant read-only.
4. The response returns `{ answer, grounded: true, sources[] }`.

## Configuration

- `BEDROCK_MODEL_ID` — the model identifier (environment/parameter driven; never hardcoded).
- `BEDROCK_REGION` — region hosting the model.
- The Lambda execution role needs `bedrock:InvokeModel` scoped to the chosen model/region.

If `BEDROCK_MODEL_ID` is empty (or the role lacks access), the endpoint returns
`503 AI_UNAVAILABLE` and the UI shows a clear unavailable state. **No simulated or hardcoded
answers are ever returned.**

## Error handling

- Validation errors → `400`.
- Missing configuration / model access errors → `503 AI_UNAVAILABLE`.
- Unexpected errors → `500` with a generic message and a request id (details logged, not leaked).

## Testing

`apps/api` unit tests cover the available and unavailable paths with a fake gateway; the router
test asserts `200` when available and `503` when not. Live Bedrock behavior is **unverified**
without AWS credentials and model access.

## Responsible AI

Answers are grounded in operational data, uncertainty is explicit, and the assistant cannot
modify records. Humans remain responsible for operational decisions.
