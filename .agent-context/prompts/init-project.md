# Project Initialization Prompts

This prompt boots a repository with strict AI coding guidance context.

## System Directives (Auto Execution)

When a new project is created or initialized, the agent must automatically:
1. Read [AGENTS.md](../../AGENTS.md) to understand the canonical bootstrap chain and active entrypoints.
2. Resolve the smallest relevant rule set from [.agent-context/rules/](../rules/) instead of scanning the whole directory by default.
3. Review dynamic runtime signals from [.agent-context/state/onboarding-report.json](../state/onboarding-report.json), repository evidence, task constraints, and live official documentation when runtime or ecosystem facts matter.
4. If Docker or Compose is in scope, load [docker-runtime.md](../rules/docker-runtime.md) and verify the latest official Docker guidance before authoring container assets.
5. For unresolved framework or package setup, recommend the latest stable compatible dependency set and official framework setup flow from live official documentation before coding unless a documented compatibility constraint blocks it.

## Required Planning Mode

If the user describes a project or feature, the agent must:
1. Clarify the delivery goals, runtime assumptions, constraints, and must-have capabilities before choosing implementation shape.
2. If the user already named a stack or framework, treat it as an explicit constraint. If not, produce a short evidence-backed recommendation from the brief, repo evidence, and live official documentation before coding.
3. For existing projects, inspect real files first. Do not derive product name, description, runtime, architecture, or design direction from the folder name alone.
4. Draft a high-level structure plan plus the docs/bootstrap artifacts that must exist before coding.
5. Wait for user approval before scaffolding the project.

## Documentation-First Requests

If the user asks to create, complete, fix, or review project docs, documentation, dokumen, `docs/*`, architecture docs, flow docs, API docs, or "lengkapkan docs", treat the request as documentation-first.

The agent must:
1. Materialize or refine required project docs before implementation: `docs/project-brief.md`, `docs/architecture-decision-record.md`, `docs/flow-overview.md`, `docs/api-contract.md` when APIs, firmware endpoints, CLI commands, or web application flows exist, `docs/database-schema.md` when persistent data exists, and `docs/DESIGN.md` plus `docs/design-intent.json` for UI scope.
2. Write formal project docs in English by default unless the user explicitly asks for another documentation language.
3. Stop after docs when the user only asked for docs. Do not write application, firmware, or UI code until the user explicitly asks for implementation or approves the implementation plan.

## Direct Constraint Mode

If the user specifies a framework, runtime, or architecture constraint, the agent must:
1. Read [AGENTS.md](../../AGENTS.md) for role context.
2. Resolve only the rules required by the explicit constraint and scope. Do not read unrelated backend, frontend, or DevOps rules by habit.
3. Reference [.agent-context/state/onboarding-report.json](../state/onboarding-report.json), [.cursorrules](../../.cursorrules), and [.windsurfrules](../../.windsurfrules) for runtime evidence and any explicit constraints already applied to this project.
4. Scaffold the initial project structure only after runtime and architecture decisions are explicit:
   - Create only the directories and files justified by the approved structure.
   - Set up configuration, validation, error handling, observability, health checks, and persistence only when they fit the approved runtime and project scope.
   - Every file must follow [naming conventions](../rules/naming-conv.md).
   - Every module must follow [architecture.md](../rules/architecture.md).
   - Every dependency must be justified per [efficiency-vs-hype.md](../rules/efficiency-vs-hype.md).
   - Use official framework setup commands or canonical starter flows when they produce newer, better-supported dependency defaults than manual package assembly.
   - If containerization is selected, Docker assets must follow [docker-runtime.md](../rules/docker-runtime.md) and the latest official Docker docs instead of stale blog-era patterns.

## Runtime and Architecture Reference

See [.agent-context/state/onboarding-report.json](../state/onboarding-report.json), [.cursorrules](../../.cursorrules), and [.windsurfrules](../../.windsurfrules) for the latest shipped runtime evidence, explicit constraints, and agent-decision status.

## UI/UX Bootstrap

When a user requests frontend or UI/UX design, the agent must automatically execute the [bootstrap-design.md](./bootstrap-design.md) prompt to synthesize a dynamic design contract (`docs/DESIGN.md` + `docs/design-intent.json`).
Keep UI-only requests context-isolated: load [bootstrap-design.md](./bootstrap-design.md) and [frontend-architecture.md](../rules/frontend-architecture.md) first, and do not eagerly load backend-only rules unless the task explicitly crosses backend boundaries.
