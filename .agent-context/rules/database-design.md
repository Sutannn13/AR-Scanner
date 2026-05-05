# Data Design Boundary

Use the data store, ORM, migration tool, and query style already chosen by the project. If unresolved, the LLM must recommend a current fit from requirements, repo evidence, and official docs before implementation.

Reject these bad habits:
- schema changes without a migration, rollback or recovery note, and data-safety plan
- duplicated facts or derived values without a sync strategy and rationale
- unbounded reads or missing pagination on growable datasets
- missing indexes or access-path planning for frequent filters, joins, lookups, search, or ordering
- raw query construction that bypasses safe parameterization
- destructive data changes without backup, migration, or deployment sequencing notes

Backend data access rules:
- Relational reads must avoid N+1 query patterns. Use eager loading, joins, batching, or explicit query-shape rationale based on the project's ORM or database driver.
- List endpoints and exports must paginate, limit, stream, or otherwise bound growable datasets by default.
- Use cursor pagination for large or frequently changing datasets when the project contract allows it; offset pagination is acceptable for small, stable, explicitly bounded collections.
- Define maximum page size, payload size, and export limits so list responses cannot exhaust memory or connection pools.
- Mutations that write more than one table, aggregate, queue, or external consistency boundary must run inside a transaction or document the compensating recovery path.
- Repository and data-access layers own persistence mechanics. They must not hide business policy that belongs in application or domain logic.
- Cross-domain persistence must respect ownership boundaries. Independent services must not share database tables as an integration contract; modular monoliths may share one database only when module ownership and access paths stay explicit.

Docs must record entity ownership, relationships, constraints, data lifecycle, migration risk, and assumptions to validate.
