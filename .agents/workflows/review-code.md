---
description: Review code with project contracts and risk-first findings
---

## Workflow: Review Code

1. Read `AGENTS.md`.
2. Use `.agent-context/prompts/review-code.md` as the canonical review prompt.
3. Apply `.agent-context/review-checklists/pr-checklist.md`.
4. Load architecture, frontend, security, testing, API, event, realtime, or Docker rules only when the changed scope needs them.
5. Report findings first, ordered by severity, with file/line references and concrete fixes.
