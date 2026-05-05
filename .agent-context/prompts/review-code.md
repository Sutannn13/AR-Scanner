# Prompt: Review Code

Use this when reviewing current changes, a pull request, or a focused file set.

```text
Review the code with a production-risk mindset.

Before reviewing:
1. Read AGENTS.md.
2. Read .agent-context/review-checklists/pr-checklist.md.
3. Read .agent-context/review-checklists/architecture-review.md only when architecture or boundaries changed.
4. Load only the rules relevant to the changed scope.
5. For UI changes, load .agent-context/prompts/bootstrap-design.md, .agent-context/rules/frontend-architecture.md, docs/DESIGN.md, and docs/design-intent.json when present.
6. Enforce Universal SOP hard gate: block coding flow when required project docs are missing (`docs/architecture-decision-record.md`, and for UI scope `docs/DESIGN.md` plus `docs/design-intent.json`).
7. Enforce single-source and lazy-loading policy: canonical rule source must be explicitly enforced, global domain governance must load lazily based on touched scope, and conflicting duplicate rule instructions must not appear during normal flow.

Prioritize findings in this order:
1. Correctness, data loss, security, privacy, auth, and permission risks.
2. Public contract drift: APIs, events, CLI behavior, data model, UI contract, docs.
3. Missing tests for changed behavior.
4. Architecture boundary drift and maintainability risk.
5. Performance and accessibility issues with concrete impact.

For every finding:
- include file and line
- explain the real risk
- reference the rule or contract only when it materially supports the finding
- propose the smallest safe fix

Do not create stack-specific governance concerns. Use project framework details only for concrete implementation risks proven by changed code, docs, or current official documentation.
```
