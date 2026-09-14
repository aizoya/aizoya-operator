# Architecture Decision Record — Judge-ready MVP

## Selected implementation stack

- Runtime: Node.js 22 LTS-compatible runtime.
- Language: modern JavaScript ES modules with strict JSON contracts and zero runtime dependencies for the MVP.
- MCP: revision `2025-11-25`, Streamable HTTP endpoint at `/mcp`.
- Transport: Node built-in HTTP server; JSON-RPC 2.0; POST request/response. GET is explicitly rejected with `405` because server-initiated SSE is not required by the synthetic MVP.
- Persistence: atomic JSON-file state adapter for synthetic local/demo state only. It persists across process sessions and has a narrow adapter boundary for later DynamoDB replacement.
- Authentication (demo): server-derived identity from trusted test headers (`x-aizoya-tenant-id`, actor, role). Requests without server-side identity context fail. This is not represented as production authentication; JWT/IAM integration is a post-authorization adapter change.
- Testing: Node built-in `node:test`; no cloud or paid test services.
- Evidence integrity: SHA-256 hashes over deterministic state/evidence records.

## Why this stack

The competition critical path values reliability, auditability, and a repeatable three-minute demo over infrastructure breadth. Zero runtime dependencies reduce install/cold-start risk and avoid paid resources. The domain and persistence boundaries allow AWS/Bedrock/DynamoDB adapters later without changing the eight business tools.

## Security decisions

1. Validate `Origin` before MCP processing.
2. Bind local runtime to `127.0.0.1` by default.
3. Require MCP session ID and exact protocol revision after initialization.
4. Require server-derived tenant/actor/role context for non-initialize calls.
5. Never use model output as approval authority.
6. Store only synthetic fixture/evidence data in this phase.
7. Persist approval against the exact plan ID/version and re-check it at handoff.
8. Issue a Verified Action Receipt only after deterministic evidence reconciliation.
