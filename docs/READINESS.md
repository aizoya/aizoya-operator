# Source release readiness — October 22, 2026 UTC
This is a public source release for a local synthetic demo, not a claim of completed competition enrollment or production readiness.

- Runtime/tests/web/fixtures: baseline39c1894c8b43f55f23e5d9179608b34798083054 plus validation/receipt integrity patch09dbd1f559ee3a2688abc0663bc5c29969f38dcc; web/fixtures retain the baseline.
- Export changes: current public docs, source-release metadata and matching preflight; no intended business-runtime change.
- Primary verification before release: preflight and38/38tests PASS on Nodev24.19.0, including ten isolated domain workflows.
- Independent executable review: bounded local synthetic candidate accepted; native Alexa, production and customer release held.
- Guided mode: no AWS credentials or paid model calls.
- Bedrock: actual two-call plugin-assisted HTTP/MCP probe; standalone SDK credentials/browser live flow unverified.
- Actual current-release browser/iPhone visual acceptance: outstanding, not established by mocked-DOM tests.
- Recording: existing Vimeo shows earlier baseline; upgraded footage not yet recorded.
- Source is MIT licensed; publication does not expose the private development repository or its history.

## Limitations
Local trusted demo headers, not production authentication. Single-process JSON state, not concurrent database transactions. Synthetic/historical fixture dates, not real orders. No real purchase, staff message, supplier fulfillment or payment. SHA-256 integrity is not a digital signature. Approval continuation reconciles fixture evidence automatically, not an evidence-upload flow. Reader cannot create plans or approve/write.

The test count is38 Node tests, not38 live cloud journeys. Cost invoices, native Alexa device access, hosted service availability and customer adoption are not established. Neither repository publication nor a saved Devpost status is an organizer eligibility ruling.

## Latest corrections
Malformed JSON-RPC envelopes return protocol errors without throwing. Tool arguments must satisfy declared primitive types and constraints before domain calls. Receipt retrieval shares integrity checks with readiness, preventing a changed record from being summarized as VERIFIED. Six new regression tests expanded the suite from32to38. Independent review reproduced the original defects and confirmed safe rejection after correction.
