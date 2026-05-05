---
description: Initialize a project with repo-grounded guidance and required docs
---

## Workflow: Initialize Project

1. Read `AGENTS.md`, then follow the canonical bootstrap chain only as far as the task requires.
2. Use `.agent-context/prompts/init-project.md` as the canonical init prompt.
3. For existing projects, inspect real project files before naming the product, describing the context, or recommending runtime/architecture choices.
4. For fresh projects, keep questions minimal and ask the agent to recommend unresolved runtime, framework, library, and architecture choices from the brief plus live official docs.
5. Ensure required docs exist before implementation: project brief, architecture decision, flow overview, API/public contract when relevant, data model when relevant, UI design contract when relevant, security assumptions, and testing strategy.
6. Run `.agent-context/review-checklists/pr-checklist.md` before declaring the init complete.
