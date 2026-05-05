# PR Checklist - Quality Gate

Run this before declaring a task done. Apply only the sections relevant to the changed scope, but do not skip correctness, security, testing, or docs checks when the change touches them.

## 1. Repo Context

- [ ] The agent read `AGENTS.md` and the smallest relevant rule set.
- [ ] For non-trivial coding, review, planning, or governance work, the agent produced a Bootstrap Receipt with loaded files, selected rules, skipped rules, unreachable files, and validation plan before implementation output.
- [ ] Existing project context came from real files, docs, package metadata, and changed code, not folder name alone.
- [ ] Runtime, framework, library, topology, and design choices are explicit user constraints or agent recommendations from current evidence.
- [ ] No offline default stack, blueprint, vendor, or visual style was treated as authoritative.

## 2. Correctness

- [ ] The changed behavior matches the user request.
- [ ] Existing behavior is preserved unless the user approved a behavior change.
- [ ] Edge cases, empty states, error paths, and rollback/recovery paths are handled.
- [ ] Public contracts remain stable or are versioned and documented.

## 3. Architecture

### 2. Architecture (→ rules/architecture.md)

- [ ] Layer and module boundaries are clear for the project’s chosen structure.
- [ ] No clever hacks in backend and shared core modules
- [ ] No premature abstraction (base classes/util layers created only after repeated stable patterns)
- [ ] Readability over brevity for maintainability
- [ ] Complexity budget was applied: equivalent behavior uses fewer moving parts without losing validation, error handling, fallbacks, accessibility, tests, or security boundaries.
- [ ] Controllers, route handlers, and transport adapters do not contain business policy, raw queries, or cross-resource orchestration.
- [ ] Services or use cases own business flow, transaction boundaries, and mutation safety.
- [ ] Repositories or adapters own persistence/external IO details without hiding business decisions.
- [ ] Backend/API governance was applied through global domain rules, not stack-specific adapters or framework-only branches.
- [ ] Code is grouped by feature/domain where that improves maintainability.
- [ ] Cross-module access uses public contracts instead of internal file reach-through.
- [ ] Files above roughly 1000 lines were split or explicitly justified.
- [ ] Monolith/service split decisions are evidence-backed, not fashion-driven.

## 4. Security And Privacy

- [ ] External input is validated at trust boundaries using the project’s chosen validation approach.
- [ ] Body, query, params, headers, cookies, uploads, webhooks, and job payloads are treated as untrusted until validated and normalized.
- [ ] Secrets, tokens, credentials, and private data are not committed or logged.
- [ ] Authorization is enforced at a trusted boundary.
- [ ] Error responses and logs do not leak internals.
- [ ] Least privilege, resource-level authorization, and secret handling are preserved where sensitive data or privileged actions are touched.
- [ ] Dependency or platform security claims are based on current official docs or repo evidence.

## 5. Testing

- [ ] Changed behavior has appropriate tests at the smallest useful level.
- [ ] API changes cover validation, authorization, documented error shape, pagination defaults, and empty states where relevant.
- [ ] Sensitive mutations include idempotency or duplicate-submit coverage where duplicate side effects would be harmful.
- [ ] Tests assert behavior and contracts, not implementation trivia.
- [ ] Critical flows include failure-path coverage.
- [ ] Test fixtures are readable and do not hide the behavior under test.

## 6. Docs And Contracts

### 10. Documentation

- [ ] Scope applied: This applies to documentation, release notes, onboarding text, review summaries, and agent-facing explanations
- [ ] Style scope review is advisory and does not block merge when API docs are synced in the same commit and contract details are correct
- [ ] Required docs exist before implementation: project brief, architecture decision, flow overview, API/public contract when relevant, data model when relevant, and UI design contract when relevant.
- [ ] For docs-only or docs-first requests, implementation code was not changed unless the user explicitly asked for it or approved an implementation plan.
- [ ] Formal project docs use English by default unless the user requested another language or existing docs established one.
- [ ] Docs cover feature plan, architecture rationale, public contracts, data model, UI/design, security assumptions, testing strategy, delivery flow, and next validation actions where relevant.
- [ ] API, event, CLI, library, data, and UI contract changes update docs in the same scope.
- [ ] Public surface changes fail review if documentation updates are missing or stale in the same scope
- [ ] Documentation checks stay boundary-aware and only enforce touched scopes
- [ ] Facts, assumptions, and next actions are separated when context is incomplete.
- [ ] No emoji in formal documentation or review summaries
- [ ] Documentation uses plain English and avoids AI cliches

## 7. UI And Accessibility

- [ ] UI work follows `docs/DESIGN.md` and `docs/design-intent.json`.
- [ ] Visual direction is project-specific and not a template/default component-kit habit.
- [ ] UI work includes a Motion/Palette Decision, and product categories were treated as heuristics rather than style presets.
- [ ] Responsive behavior recomposes content and priority, not only shrinking desktop layout.
- [ ] Accessibility hard requirements are preserved: keyboard access, focus visibility, contrast, target size, status feedback, and no color-only meaning.
- [ ] Motion is treated as part of the design language for modern UI work, with reduced-motion and performance safeguards instead of defaulting to static screens.
- [ ] Broad redesigns pass the old-design regression test: the result is not the previous composition with animation, depth, media, or interaction density removed.
- [ ] UI work records an agent-chosen ambition level; broad screens and redesigns researched an expressive path first, and any downshift names a concrete blocker plus replacement interaction quality.

## 8. Dependencies And Runtime

- [ ] New dependencies are justified by capability, maintenance health, bundle/runtime cost, and current official docs.
- [ ] Official setup flows are preferred when they produce better-supported current defaults.
- [ ] Docker, framework, package, and ecosystem claims were checked live when they could be stale.
- [ ] Token optimization and memory continuity defaults remain enabled unless the user explicitly opts out.
- [ ] If `.agent-context/state/active-memory.json` exists and the task made material project progress, the agent refreshed it directly before completion and preserved privacy/user-owned entries.

## 9. State And Governance

### 11. Context-Triggered Audit Mode

- [ ] Strict audit mode activates automatically on review and PR-intent workflows
- [ ] Small edits avoid heavy checks by default unless strict mode is explicitly requested
- [ ] User can always force strict audit mode manually
- [ ] Session handoff includes active architecture contract summary.
- [ ] Drift detection warns before direction changes.
- [ ] Direction changes require explicit user confirmation.
- [ ] Default responses avoid unnecessary state-file internals.
- [ ] State internals are exposed only on explicit request.
- [ ] Diagnostic mode can explain relevant state decisions when needed.
- [ ] Canonical rule source is explicitly defined and enforced
- [ ] Global domain governance is loaded lazily based on touched scope
- [ ] No conflicting duplicate rule instructions during normal flow
- [ ] Canonical rule source is explicit and duplicate/conflicting instructions are avoided.

### 15. Universal SOP Consolidation

- [ ] `.agent-context/rules/` remains the default guidance source for implementation and review.
- [ ] Security and testing requirements remain mandatory after static template purge.
- [ ] Coding flow is blocked if `docs/architecture-decision-record.md` (or `docs/Architecture-Decision-Record.md`) is missing
- [ ] UI implementation flow is blocked if `docs/DESIGN.md` or `docs/design-intent.json` is missing

## Verdict

Report findings first, ordered by severity, with file/line references and concrete fixes. If no findings exist, say that explicitly and name any residual risk.
