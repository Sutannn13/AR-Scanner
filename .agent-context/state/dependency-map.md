# Dependency Map

Use this map to keep Agentic-Senior-Core's CLI, governance, and validation layers from collapsing into circular or over-coupled code.

## Allowed Dependency Direction

1. `bin/` may call command modules only.
2. `lib/cli/commands/**` may orchestrate detector, compiler, scaffolder, memory, token, backup, rollback, preflight, and utility modules.
3. `lib/cli/compiler.mjs` may read constants and utilities, but must not import command modules.
4. `lib/cli/project-scaffolder/**` may use utilities and local scaffolder submodules; validation logic stays below the scaffolder entrypoint.
5. `scripts/**` may call CLI library modules for audits and reports, but release/validation scripts must avoid mutating generated state unless that is their explicit job.
6. `tests/**` may exercise public CLI commands, public module exports, scripts, and generated artifacts.
7. `.agent-context/**` stores governance data and must not depend on generated adapter content as its authority.

## Module Constraints

| Source | Allowed Dependencies | Forbidden Dependencies |
| --- | --- | --- |
| `bin/agentic-senior-core.js` | `lib/cli/commands/*` | direct compiler, scaffolder, or validation internals |
| `lib/cli/commands/init.mjs` | detector, compiler, scaffolder, token/memory continuity, setup helpers | UI style presets, backend framework defaults, generated adapters as source |
| `lib/cli/commands/upgrade.mjs` | detector, compiler, scaffolder seeds, backup/rollback, shared setup helpers | duplicated setup-policy helpers, silent stack migration |
| `lib/cli/project-scaffolder.mjs` | stable public scaffolder exports | private validation helpers that do not need public API exposure |
| `lib/cli/project-scaffolder/design-contract.mjs` | validation submodule, constants, utilities | hardcoded final palettes, fixed layouts, external design memory |
| `scripts/sync-thin-adapters.mjs` | canonical instructions and adapter targets | hand-maintained duplicate policy blocks |
| `scripts/validate*.mjs` | config, coverage checks, file evidence | stale V2 skill-marketplace artifacts |
| `.agent-context/prompts/bootstrap-design.md` | current repo evidence and frontend rule | prior-chat visuals, unrelated screenshots, template style presets |

## Circular Dependency Guardrail

- Reject `commands -> project-scaffolder -> commands`.
- Reject `compiler -> commands`.
- Reject `scripts/validate -> tests`.
- Reject generated adapters becoming inputs for `.instructions.md` or `.agent-context/`.
- Move repeated command setup policy into shared helper modules instead of copying local functions.

## Package Hygiene

- Keep one npm lockfile: `package-lock.json`.
- Ignore Bun lockfiles unless the package manager strategy changes explicitly.
- Keep generated reports out of the shipped package.
- Keep `onboarding-report.json` tracked only as current repo operational state; installed projects regenerate it.
