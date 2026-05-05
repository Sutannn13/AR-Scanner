# Architecture Map

Use this file as repo-local agent context. It records the current governance architecture and the boundaries agents must protect.

## Boundary Classification

| Surface | Criticality | Change Policy | Required Checks |
| --- | --- | --- | --- |
| `.instructions.md`, `AGENTS.md`, generated adapters | critical | Keep `.instructions.md` canonical and adapters thin/hash-synced | `npm run sync:adapters`, `npm run check:adapters`, `npm run validate` |
| `.agent-context/rules/**`, `.agent-context/prompts/**`, `.agent-context/review-checklists/**` | critical | Keep rules imperative, compact, scope-resolved, and non-duplicative | adapter sync, validation, targeted smoke tests |
| `.agent-context/state/**` | high | Track only seed/config and current operational state; keep generated reports local-only | `npm pack --dry-run`, state README review |
| `lib/cli/compiler.mjs`, `scripts/sync-thin-adapters.mjs` | critical | Preserve generated surface compatibility across Codex, Cursor, Windsurf, Copilot, Claude, and Gemini | adapter tests, smoke tests, validation |
| `lib/cli/commands/init.mjs`, `lib/cli/commands/upgrade.mjs` | high | Preserve fresh-project and existing-project behavior without silent stack/style decisions | CLI smoke tests, onboarding report checks |
| `lib/cli/project-scaffolder/**` | high | Preserve docs-first and design-contract behavior without hardcoded house style | design/detection smoke tests, validation |
| `scripts/validate*.mjs`, `scripts/validate/**` | high | Keep validation mechanical and aligned with current shipped surfaces | `node ./scripts/validate.mjs`, targeted script checks |
| `tests/**` | high | Test behavior and contracts, not private implementation trivia | `npm test` |
| `package.json`, `package-lock.json`, package allowlist | high | Keep release metadata and tarball contents synchronized | `npm pack --dry-run`, release gate |

## Frontend Governance Context

- Frontend guidance is efficient enough for the current architecture because it is scope-resolved: UI tasks load `bootstrap-design.md` and `frontend-architecture.md`; backend-only tasks do not.
- Keep the current design contract. It does not prescribe a palette or layout; it requires product evidence, anchor-derived tokens, motion/spatial fit decisions, and accessibility.
- Do not reduce motion, 3D, canvas, WebGL, or animation guidance. These are capability unlocks, not mandatory decoration.
- Treat product categories as heuristics only. They must not become style presets.
- Treat grid, line, glow, blob, and abstract-logo backgrounds as review findings unless they serve a named product function.

## Backend Governance Context

- Backend guidance is efficient enough for the current architecture because backend/API rules are lazy-loaded by scope.
- Keep global backend principles stack-agnostic: architecture boundaries, validation, safe errors, security, testing, event boundaries, and data design.
- Do not add framework-specific governance adapters unless real repo evidence proves a repeated project need.
- New dependencies are allowed when they improve efficiency, delivery time, correctness, or maintainability, and current official docs support the choice.

## Agent Behavior

1. Load the smallest relevant rule set.
2. Use README only for overview/install/user context when governance files conflict.
3. Preserve generated adapter sync before release.
4. Treat stale generated state, dual lockfiles, and obsolete V2/V3 transition files as cleanup findings.
5. Before claiming done, run the relevant validation gate and report any skipped checks.
