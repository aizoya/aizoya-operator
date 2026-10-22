# Architecture — public source snapshot
## Guided synthetic path
Browser -> /mcp -> MCP session and demo identity checks -> deterministic domain engine -> tenant-partitioned JSON store -> evidence reconciliation -> Verified Action Receipt.

Exactly eight business tools are exposed (MCP 2025-11-25 Streamable HTTP). POST uses JSON-RPC; GET /mcp returns 405 because server-initiated SSE is not implemented. Static web assets are served locally. The core demo has no cloud dependency.

## Optional reader path
Browser -> /assistant -> bounded Converse loop -> read-only tools through the actual MCP handler -> toolResult back to Bedrock -> deterministic summary of tool data.
Only get_shift_brief and get_action_receipt are available to the model. No model proposal authorizes approval, handoff or writes. Guided plan creation is separate from the reader.

## Controls and limits
Loopback default; origin allowlist; MCP protocol/session enforcement; explicit local demo identity; request-size/prompt bounds; one concurrent reader request; six provider requests per server process in the optional launcher, counted before dispatch. Reader loop maximum three calls, two tools per response, 256 output tokens per call; SDK one attempt and twenty-second timeout. There is no durable cross-process aggregate dollar cap.

Exact plan ID and monotonic revision bind human approval. Plan/inventory changes invalidate downstream authorization and current closeout. Replacement approval requires a new handoff. Evidence/receipt linkage and integrity are checked before current readiness can be VERIFIED; historical receipts remain historical.

Trusted headers are not production auth. Tenant partitions demonstrate application isolation but do not authenticate a remote caller. JSON atomic replacement supports a local single-process demo, not multi-writer transactions. SHA-256 records are not signed attestations. Keep synthetic state out of source.

The UI's approval continuation automatically performs synthetic handoff and fixture reconciliation. It has no separate live evidence-upload feature. No real supplier execution occurs.

## Input and receipt validation
The MCP boundary validates JSON-RPC envelopes and the eight flat tool schemas before execution. Invalid initialize/initialized-notification envelopes return HTTP400 with a protocol error. Receipt lookup rechecks hash, receipt identity, tenant identity, synthetic flag and verified status. A corrupted stored receipt cannot be returned to the reader as verified. Hashes do not defend against an operating-system user rewriting both data and hashes.
