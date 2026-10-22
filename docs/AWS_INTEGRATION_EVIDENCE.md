# AWS integration evidence — October 21, 2026 test; October 22 source release
## Actual run
An authenticated AWS plugin bridge supplied two real Bedrock Runtime Converse responses to a fresh local test transport. The Node process constructed the request, accepted model tool_use for get_shift_brief, executed the read through the actual MCP handler, returned toolResult to Bedrock and completed POST /assistant with HTTP 200 and AT_RISK / NO_COMMITMENT.

Model amazon.nova-lite-v1:0, region us-west-2. Call1 usage551 input/70 output; call2 usage694 input/114 output. Total1245 input+184 output=1429 tokens. First stopReason tool_use; second end_turn. Serialized request cap10000 bytes, output cap256 per call, bridge cap3 calls; actual2. No application automatic retry.

CountTokens was attempted first and returned an unsupported-model ValidationException; no successful pre-count is claimed. Missing provider usage is unknown, never zero. No invoice is included and token usage is not a billing receipt.

## Scope
This is a plugin-assisted live application/MCP probe, not a native Alexa deployment, full natural-language planning, standalone SDK credential test, rendered browser test or full paid hero-workflow evaluation. Synthetic data only. Model text is not approval or evidence of task completion.

Relevant source: src/bedrock.js; src/server.js; scripts/plugin-live-probe.mjs; scripts/start-bedrock.mjs; test/assistant.test.js; test/bedrock-http.test.js. Runtime/tests/assets originate from executable revision39c1894c8b43f55f23e5d9179608b34798083054, with release-specific documentation, metadata and preflight adaptation. SOURCE_MANIFEST.sha256 identifies the exact exported files.

## Reproduction
Free/model-mocked reproduction: npm run verify, including the real HTTP/MCP reader tests. Optional standalone paid path: follow BEDROCK_READER.md with your own authorized AWS connection. It is implemented but remains live-unverified here.

The plugin bridge script is a developer test harness, not a credential connector. Use a fresh private temporary directory via AIZOYA_BRIDGE_DIR, outside the repository. Its request/response files contain prompts and synthetic tool results; never commit them. A separate authenticated AWS tool must manually service each request file and provide the corresponding actual response. The public source does not grant that plugin access. Nonempty bridge directories are rejected to prevent stale response reuse.

No additional AWS services are claimed as integrated. Public source availability does not guarantee that every judge has an AWS account or paid model access. Guided mode and mocked model tests are available without AWS.

## Fresh connectivity check — October22,2026 UTC
Before the MCP/receipt hardening patch, published baseline fab1bd3 was tested again with both a fresh bridge directory and fresh AIZOYA_STATE_PATH set before Node started. Two actual Nova Lite Converse calls succeeded:551input/70output,then694input/116output; total1245input+186output=1431tokens. /assistant returned HTTP200,AT_RISK/NO_COMMITMENT,usageComplete=true. This confirms the plugin-assisted live path on that baseline; the later hardening patch is separately covered by38local tests and independent regression review. No paid post-patch replay, standalone SDK credential verification or browser/iPhone acceptance is claimed.
