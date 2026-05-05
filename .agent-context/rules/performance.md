# Performance Boundary

Do not over-optimize by habit. Do reject obvious scale and runtime failures.

Hard rejections:
- repeated network, database, filesystem, or model calls inside loops without batching, limits, or caching rationale
- unbounded reads, renders, exports, or searches when the data can grow
- shipping large client/runtime payloads without a reason, split point, or loading strategy
- synchronous blocking work in request, UI, worker, or async paths where it can stall the product
- caches without invalidation, expiry, ownership, and staleness trade-offs

When performance matters, measure the real bottleneck, change the smallest useful thing, and verify the result.
