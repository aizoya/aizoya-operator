# Correctness verification — October22,2026 UTC
The suite expanded from32to38 Node tests after independent review reproduced three material defects. Before fixes, malformed JSON-RPC method values threw TypeError, declared tool-argument types were not enforced, and a tampered stored receipt could be retrieved with VERIFIED status.

## Fixes
- Validate MCP method/JSON-RPC version/IDs/params before processing. Invalid initialization creates no session. Invalid initialized notifications no longer bypass validation.
- Enforce required own properties, declared primitive types, minLength/minimum and unknown-property constraints on the existing eight flat schemas.
- Share receipt hash/identity/tenant/synthetic/status validation between readiness and retrieval. A changed receipt returns RECEIPT_INTEGRITY_FAILED; the Bedrock loop cannot summarize it as verified.
- Valid historical receipts remain readable after replanning, while current readiness remains AT_RISK.

## Evidence
New receipt tests failed2/2before the fix. MCP implementer reproduced three new failing focused cases before correction; the HTTP initialization test demonstrated200where400was expected before server correction. Primary and independent reviewer both ran preflight+38/38PASS. Reviewer reran the three original probes and found no material regression in changed paths.

Five executable/test files changed:src/domain.js,src/mcp.js,src/server.js,test/mcp-validation.test.js,test/receipt-integrity.test.js. Private executable patch09dbd1f559ee3a2688abc0663bc5c29969f38dcc. The release retains the separate public preflight adaptation. SOURCE_MANIFEST.sha256 describes exported bytes.

Finite tests cover the local synthetic scope. Standalone AWS credentials and a live SDK/browser journey remain unverified. Current real browser/mobile acceptance, production authentication, concurrent database persistence and a replacement video remain open.
