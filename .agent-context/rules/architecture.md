# Architecture - Separation of Concerns and Structure

> If a service imports transport concerns or raw persistence concerns directly, the architecture is already drifting.

## Universal Backend Principles (Mandatory)

These principles are mandatory for backend and shared core modules.

- No clever hacks.
- No premature abstraction.
- Readability over brevity.
- Keep transport, application, domain, and infrastructure concerns separated.
- Favor explicit module boundaries over hidden cross-layer shortcuts.

## Complexity Budget (Mandatory)

Prefer the smallest clear implementation that fully preserves behavior, safety, and maintainability.

- If two implementations are equivalent in behavior and quality, choose the one with fewer moving parts.
- Remove code that does not carry behavior, safety, clarity, maintainability, or test value.
- Prefer direct logic over extra wrappers, layers, classes, config, or state when the abstraction does not reduce real complexity.
- Keep validation, error handling, fallback paths, accessibility, tests, security boundaries, and observability when they protect real behavior.
- Run a final simplification pass before completion.
- Do not optimize for line count alone.
- Do not replace clear code with clever, dense, or surprising code.
- Do not remove safeguards just because the happy path works.

## Universal SOP Baseline (Mandatory)

The `.agent-context/rules/` directory is the default guidance source for implementation and review.

- Backend and frontend mindset checks are both required when a task spans API and UI boundaries.
- Security and testing are non-negotiable baseline requirements.
- Hard block before coding:
  - `docs/project-brief.md` must exist.
  - `docs/architecture-decision-record.md` (alias: `docs/Architecture-Decision-Record.md`) must exist.
  - `docs/flow-overview.md` must exist.
  - If the project uses persistent data, `docs/database-schema.md` must exist.
  - If the project exposes API or web application flows, `docs/api-contract.md` must exist.
  - For UI scope, `docs/DESIGN.md` and `docs/design-intent.json` must exist.
- Required docs coverage must include feature plan, architecture rationale, public contracts, data model when relevant, UI/design when relevant, security assumptions, testing strategy, delivery flow, and next validation actions.
- If required project context docs are missing, stop implementation and bootstrap docs before writing application code.
- Bootstrap flow: analyze the real repo plus the latest user prompt before authoring those docs.
- Bootstrap docs must be adaptive and project-specific. Do not create generic placeholder templates.
- When context is incomplete, separate confirmed facts from assumptions, add an `Assumptions to Validate` section, and end with the next validation action.

## Rules as Guardian (Cross-Session Consistency)

- Session handoff must include active architecture contract summary.
- Contract summary must include explicit user constraints, runtime/architecture decision status, active project docs, and the core patterns currently evidenced by the repo.
- Detect drift before changing runtime choices, topology, public contracts, or core patterns.
- Direction changes require explicit user confirmation before applying changes.
- When confirmation is provided, record the rationale in session notes or PR context.

## Invisible State Management with Explain-on-Demand

- Default responses must avoid unnecessary state-file internals.
- State internals are exposed only on explicit user request.
- Diagnostic mode explains relevant state decisions when needed.
- Keep default explanations concise and outcome-first.

## Single Source of Truth and Lazy Rule Loading

- Canonical rule source is .instructions.md.
- Adapter entry files stay thin and must point to the canonical source.
- Load global domain rules lazily based on touched scope.
- Do not create or load stack-specific governance adapters as the baseline.
- Runtime or framework evidence can clarify implementation details, but it must not replace the global architecture, security, data, API, error, event, and testing boundaries.
- Keep rule-loading output deterministic for init and release validation.

## Architecture Decision Boundary

Do not force a default architecture label before the repo, delivery model, and boundary evidence are clear.

Do not split into distributed services without evidence. Do not keep everything in one process by habit either.

Service separation only makes sense when multiple signals are true, such as:

- frequent deploy conflicts across domains
- clear scale mismatch between domains
- separate team ownership causing repeated coupling pain
- hard fault-isolation requirements
- already-stable contracts and data boundaries

## Layer Boundaries (Mandatory)

- Transport or controller layer: parse input, validate shape, enforce auth at the edge, return protocol responses. No business policy, no raw SQL, no external workflow orchestration.
- Application or service layer: business rules, orchestration, transactions, and use-case flow. No request or response objects, no UI formatting, no raw transport dependencies.
- Domain layer: pure business invariants, calculations, value objects, and policies. No framework, network, database, or file-system coupling.
- Infrastructure or repository layer: database, queue, cache, file system, and external API adapters. No business policy hidden in queries or adapters.

## Dependency Direction

- Dependencies flow inward: transport to application to domain.
- Infrastructure depends inward through interfaces or well-defined ports.
- Domain must not depend on infrastructure.
- Application must not depend on transport details.

## Project Structure and File Size Discipline

- Group code by feature or domain, not by one giant technical folder per type.
- Backend feature modules use `src/modules/<feature>/...` when the repo has no stronger existing convention.
- Frontend feature modules use `src/features/<feature>/...` when the repo has no stronger existing convention.
- Cross-cutting utilities belong in explicit shared locations, not scattered feature internals.
- Files above roughly 1000 lines are a refactor trigger, not a success signal.
- Preserve one clear public entrypoint per module when helpful, but move implementation into smaller focused files.
- Keep code compact because the design is understood, not because safeguards were removed.

## Module Communication

- Import through a module's public API instead of reaching into internal files.
- Keep contracts explicit at boundaries between modules.
- If a new developer cannot find the full flow of a feature in one clear area, the structure is too diffuse.
