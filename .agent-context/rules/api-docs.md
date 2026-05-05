# API and Public Contract Boundary

## Documentation as Hard Rule (Boundary-Aware)

If a change affects an API, CLI command, exported library behavior, schema, event, or integration contract, update the matching docs in the same change.

## Contract Rules

- Document the public surface before or alongside implementation.
- Machine-readable API contracts should use the current project standard. If unresolved, the LLM must recommend a current maintained option from official docs.
- HTTP APIs should prefer OpenAPI 3.1 when no stronger project standard exists.
- List endpoints must document pagination, limits, filtering, sorting, and empty-state behavior.
- Sensitive mutation endpoints must document idempotency behavior, retry safety, duplicate-submit handling, and any required idempotency key or request fingerprint.
- Public error contracts must document stable machine-readable codes and any RFC 9457 Problem Details-style fields the project exposes, including safe trace or correlation identifiers when present.
- Async, webhook, and event contracts must document idempotency, retry, ordering, dead-letter or recovery behavior, and duplicate-message handling.
- Event APIs should define producer, consumer, payload, versioning, retry, and failure behavior.
- CLI/library public behavior must update README, help text, changelog, or docs as appropriate.
- Do not write "see code" as the contract.
- Do not expose generic `object` or `any` contract shapes when the boundary can be typed.
- Public error shapes must be safe, stable, and documented.

## Human Writing Standard (Mandatory)

This applies to documentation, release notes, onboarding text, review summaries, and agent-facing explanations.
API docs and README updates are included in this scope.

### Language Default

Write formal project docs in English by default, even when the user prompt is in another language. Use another documentation language only when the user explicitly asks for it or when existing project docs already establish that language.

### Style Baseline

1. Write for native English speakers.
2. Target an 8th-grade reading level.
3. Use clear, direct, plain language.
4. Keep sentence rhythm natural with short and medium sentences.
5. Sound confident, practical, and conversational.
6. State the main point first, then supporting detail.

### Required Behavior

1. Explain decisions the way a competent coworker would explain them out loud.
2. Cut unnecessary words and remove filler.
3. Use concrete verbs and everyday phrasing.
4. Rewrite and reorder content when flow is weak.
5. Keep explanations short by default; expand only when complexity requires it.

### Scope Severity and Merge Behavior

1. Scope style guidance controls readability and consistency.
2. Style baseline findings are advisory by default and must not block endpoint-change commits that already include accurate docs/spec updates.
3. Hard blockers remain contract failures: missing same-commit docs sync, incorrect schema, missing required responses, or factual inaccuracies.
4. If style polish is still needed, open a follow-up task instead of delaying the contract update.

### Non-Negotiables

1. No emoji in formal artifacts.
2. Avoid AI cliches and buzzwords: delve, leverage, robust, utilize, seamless.
3. Avoid inflated, academic, or performative language.
4. Avoid padding, hedging, and redundant phrasing.

### Critical Controls

1. Any claim about quality, performance, or reliability must include a measurable source and timestamp.
2. Expand acronyms on first use, then use terms consistently.
3. Separate facts from assumptions explicitly.
4. End major explanations with a clear next action.

### Final Check

Read the text out loud before shipping. If it sounds robotic, rewrite it.
