# Testing Boundary

Use the test runner and style already present in the repo. If no test setup exists, the LLM must recommend a current, lightweight, project-fit setup from official docs before adding one.

Test what can break:
- business rules, validation, authorization, state transitions, and error paths
- public APIs, UI flows, integration boundaries, and data contracts touched by the change
- regressions around bugs being fixed
- critical accessibility or responsive behavior when UI is in scope

Backend/API test rules:
- API tests must cover request validation, authorization boundaries, success responses, documented error shapes, pagination defaults, and empty states for touched endpoints.
- Sensitive mutations such as payments, orders, status changes, inventory adjustments, and account/security changes must include duplicate-submit or retry tests when idempotency is required.
- Data-access changes must include evidence for query shape, transaction behavior, rollback or recovery paths, and N+1 prevention when relational reads are touched.
- Event or worker changes must test retry, duplicate-message handling, dead-letter or recovery behavior, and outbox relay semantics when those paths exist.
- Distributed consistency changes must test the local transaction, publish/retry behavior, and compensating action or recovery path rather than only the happy path.
- Tests should make the API contract obvious from the fixture names, inputs, and expected response shape.

Do not test framework internals, third-party library behavior, private implementation trivia, or snapshots that only freeze noise.

Tests should describe behavior, keep setup readable, and mock only at real boundaries such as network, filesystem, clock, database, or external services.
