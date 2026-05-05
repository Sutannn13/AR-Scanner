---
description: Refactor code without changing behavior
---

## Workflow: Refactor Code

1. Read `AGENTS.md`.
2. Use `.agent-context/prompts/refactor.md` as the canonical refactor prompt.
3. Inspect the target files and existing repo conventions before changing structure.
4. Keep behavior stable unless the user explicitly approves a behavior change.
5. Update docs and tests when contracts, public surfaces, or architecture boundaries change.
6. Run `.agent-context/review-checklists/pr-checklist.md` before declaring done.
