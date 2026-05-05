# Realtime Boundary

Use realtime only when the user experience needs live state, collaboration, streaming progress, notifications, or low-latency feedback. Do not add sockets by habit.

Hard rules:
- choose the transport from product needs and current official docs: polling, server-sent events, WebSockets, WebRTC, managed realtime, or queue-backed push
- authenticate every connection or subscription at a trusted boundary
- validate every inbound message and keep message contracts typed
- keep business logic out of transport callbacks
- define reconnect, heartbeat, backpressure, rate-limit, and abuse behavior
- plan horizontal scaling before relying on in-memory connection state
- document ordering, delivery guarantees, offline behavior, and failure recovery

If realtime infrastructure is unresolved, the LLM must recommend the smallest current project-fit option instead of assuming WebSockets.
