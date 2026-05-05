# State Artifacts

Use this directory as a typed governance state surface, not as a dump folder.

Tracked seed/config artifacts:
- `architecture-map.md`
- `dependency-map.md`
- `benchmark-comparison-schema.json`
- `benchmark-reproducibility.json`
- `benchmark-thresholds.json`
- `benchmark-writer-judge-config.json`
- `memory-adapter-contract.json`
- `memory-schema-v1.json`

Tracked operational artifact:
- `onboarding-report.json` stays tracked in this repository because internal audits read it as the current repository onboarding state. In installed projects, `init` and `upgrade` regenerate this file.

Local-only/generated artifacts:
- `active-memory.json`
- `v3-purge-audit.json`
- `llm-judge-report.json`
- benchmark, trend, weekly governance, and quality report outputs

Do not treat generated reports or archived research as current project truth. Rerun the matching `npm run benchmark:*`, `npm run report:*`, or `npm run audit:*` command when fresh evidence is needed.
