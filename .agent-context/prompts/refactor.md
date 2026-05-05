# Prompt: Refactor Code

Use this when code needs cleanup, splitting, or safer structure without changing user-visible behavior.

```text
Refactor the target code while preserving existing behavior.

Before editing:
1. Read AGENTS.md and the smallest relevant rules from .agent-context/rules/.
2. Inspect the real repo conventions before introducing a new structure.
3. If required project docs are missing, stop and bootstrap or update docs first.
4. If the change touches UI, load .agent-context/prompts/bootstrap-design.md and .agent-context/rules/frontend-architecture.md before editing.
5. If the change touches a dependency, framework, Docker, runtime, or ecosystem claim, verify current official docs before choosing.
6. Enforce Universal SOP hard gate: stop implementation if `docs/architecture-decision-record.md` is missing, and for UI scope stop if `docs/DESIGN.md` or `docs/design-intent.json` is missing.
7. Enforce backend universal principles: no clever hacks, no premature abstraction, readability over brevity.
8. For backend/API scope, enforce layered boundaries, zero-trust input validation, safe centralized error responses, bounded list reads, transaction safety for multi-write mutations, idempotency for sensitive mutations, and behavior-focused API tests.
9. Backend/API governance is global and stack-agnostic. Do not create stack-specific adapters or framework-specific rule branches; apply the global rules through the framework already present in the target project.
10. Enforce the complexity budget: choose fewer moving parts only when behavior, safety, clarity, and maintainability stay intact.

Refactor rules:
- Improve clarity, boundaries, naming, validation, error handling, tests, and docs.
- Prioritize maintainability over compressed one-liners.
- Do not choose a stack, framework, library, or topology from offline assumptions.
- Keep module boundaries explicit and project-specific.
- Split large files when the split makes the flow easier to understand.
- Do not introduce abstractions before the repeated pattern is real.
- Remove code that does not carry behavior, safety, clarity, maintainability, or test value.
- Prefer the shorter implementation only when it keeps the same guarantees.
- Run a final simplification pass before completion.
- Update tests and docs whenever behavior contracts, public APIs, data shape, or UI contracts change.

For every meaningful change, explain:
- what risk or friction existed
- what changed
- why the new shape is safer or easier to maintain
```
