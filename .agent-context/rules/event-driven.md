# Event Boundary

Do not add event-driven architecture because it sounds modern. Use it only when the product or repo shows a real async boundary.

Use events when:
- multiple independent consumers must react to the same fact
- synchronous coupling would harm reliability, latency, or ownership
- audit history, fan-out, or eventual consistency is a real requirement
- the team can operate retries, monitoring, and failure recovery

Reject events when a direct call, database transaction, or simple module boundary is enough.

Hard rules:
- events describe facts that already happened
- payloads are versioned, typed, and documented
- producers do not know consumer internals
- consumers are idempotent
- retries are bounded and dead-letter or recovery behavior is defined
- transactional publishing uses an outbox or equivalent safety pattern when data consistency matters
- dual-write flows that update local state and publish a message must use a transactional outbox or document an equivalent atomicity and replay strategy
- distributed transactions and two-phase commit are not the default recovery model; prefer local transactions plus saga, choreography, orchestration, or explicit compensating actions when consistency crosses service boundaries
- message handlers must record processed message identifiers or use another duplicate-detection strategy when the delivery model can retry or redeliver
- event catalogs or docs identify producer, consumers, ownership, and schema evolution rules

If event tooling is unresolved, the LLM must recommend a current project-fit broker or managed service from official docs before implementation.
