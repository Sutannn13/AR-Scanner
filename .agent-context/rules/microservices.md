# Service Boundary Rule

Do not ask for or force "monolith vs microservices" as an init default. Do not start with microservices by fashion, fear, or habit. The agent must infer the right topology from the user brief, repo evidence, team/runtime constraints, and live official docs when technology choices matter.

## Monolith Boundary

Use a single deployable system when:

- one team or one delivery stream owns most changes
- feature boundaries can stay clear inside one repo/process
- synchronous data consistency is more valuable than distributed autonomy
- observability, CI/CD, and operational maturity are still forming

Hard rules:

- Keep feature/domain boundaries explicit.
- Do not let one giant shared module become the real architecture.
- Keep contracts clear between modules.
- Refactor toward cleaner seams before extracting services.

## Service Split Boundary

Split a service only when current evidence justifies the operational cost.

Valid split signals:

- independent deploy cadence is already painful
- one domain has materially different scale, latency, security, or compliance needs
- ownership boundaries are stable and repeated coupling is causing delivery risk
- failure isolation is a real product or business requirement
- the service contract and data ownership can be documented before extraction

Hard rules:

- Each service owns its data boundary.
- Public service contracts must be documented before implementation or extraction.
- Cross-service calls need timeout, retry, idempotency, observability, and recovery behavior.
- Independent services must not use shared tables as their integration contract; communicate through documented APIs, events, or async workflows owned by the source domain.
- Avoid synchronous call chains that turn services into a distributed monolith.
- Critical cross-service mutations should prefer local transactions plus outbox, saga, choreography, orchestration, or compensating actions over two-phase commit by default.
- Prefer incremental extraction over rewrites.

If the evidence is unclear, document the uncertainty and keep the topology agent-recommended instead of pretending an offline default is correct.
