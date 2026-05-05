# Security Boundary

Use the security model and libraries already present in the project. If security tooling is unresolved, the LLM must recommend current, maintained options from official docs and OWASP-aligned guidance before implementation.

Hard rules:
- validate and normalize all data crossing a trust boundary
- never interpolate untrusted input into queries, shell commands, file paths, templates, logs, or HTML
- never commit secrets, tokens, credentials, private keys, or production identifiers
- never invent custom crypto, session, token, or password handling when maintained standards exist
- enforce authorization at the server or trusted boundary, not only in UI state
- return safe client-facing errors and keep sensitive detail in protected logs
- document auth, permission, data exposure, rate-limit, and abuse assumptions before changing sensitive flows
- apply least privilege to service accounts, API tokens, database users, background jobs, and operator/admin actions
- retrieve secrets through environment, runtime secret injection, or the project's secret manager; do not store static secrets in source or plaintext config
- keep `.env` and local secret files covered by `.gitignore`; commit only safe examples such as `.env.example`
- treat transport encryption, secure cookies, and trusted proxy boundaries as deployment assumptions that must be documented when sensitive traffic is involved

Zero-trust API input rules:
- Treat body, query, params, headers, cookies, uploaded files, webhook payloads, and background job payloads as untrusted until validated.
- Validate and normalize input at the outer boundary before it reaches service, use-case, repository, or domain logic.
- Services should receive typed, already-validated values and still enforce domain invariants for security-sensitive rules.
- Sanitization must match the sink: SQL, shell, file path, log, HTML, template, and URL contexts need different protections.
- Authorization must be resource-aware when data ownership matters. Prefer row, tenant, account, organization, or resource-level checks over role-only checks for sensitive records.

For high-risk changes, check current framework security docs and record the relevant source or assumption in the implementation notes.
