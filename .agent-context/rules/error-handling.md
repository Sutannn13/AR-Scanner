# Error Handling Boundary

Use the target language and framework's normal error model. Do not invent a custom exception architecture from this repo.

Reject these failure patterns:
- swallowed errors
- generic errors that erase the domain cause
- client-facing leaks of stack traces, secrets, SQL, infrastructure details, or provider internals
- retries without transient-failure evidence, limits, backoff, and a clear final outcome
- logs that say only "something failed" without action, target, actor, or trace context

Backend API error rules:
- Use the framework's normal centralized error boundary or middleware for HTTP/API responses.
- Do not return raw exception messages, stack traces, SQL, provider payloads, file paths, secrets, or infrastructure details to callers.
- Public API errors must use a stable JSON shape with at least `code` and `message`; include `details` only when the data is safe, documented, and useful to the caller. HTTP APIs may use an RFC 9457 Problem Details-style shape when it fits the project contract.
- Domain and validation errors should keep machine-readable codes so tests, clients, and operators can distinguish expected failures from defects.
- API boundary errors should include a safe correlation or trace identifier when observability exists, while protected logs keep the internal exception, actor, target, and trace context.
- Distributed systems should preserve trace context across ingress and egress using the project's tracing standard, such as W3C Trace Context or OpenTelemetry propagation.

At boundaries, validate early, return safe user-facing errors, and keep machine-readable error context for operators and callers.
