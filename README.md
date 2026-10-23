# AIZOYA Operator for Alexa+
It remembers the work, asks before consequential action, and shows the evidence.

A restaurant operator needs more than a plausible answer: what is missing for Saturday, which plan was approved, who owns the work, and what remains unverified? This project demonstrates that journey with synthetic La Bandera Kitchen data.

**Local Alexa+ simulation, not native Alexa+ integration. No real purchase, message or payment.**

## Run the guided demo — no AWS account or paid calls required
Requires Node.js 22+ and git. The verification reported below was run on Node v24.19.0.

```bash
git clone https://github.com/aizoya/aizoya-operator.git
cd aizoya-operator
npm run verify
npm start
```

Open http://127.0.0.1:8787/ on the same computer. Keep the server on loopback; this is not a remotely authenticated service. Do not expose it with a public tunnel.

1. Click **Prepare guided demo plan**. Review three synthetic shortages and the $66 plan.
2. Choose **Not now**: no handoff occurs.
3. Prepare a plan again. As the human operator, click **Approve this demo plan**.
4. The demo then performs a synthetic staff handoff, starts a new MCP session, reconstructs unresolved risk and automatically reconciles its synthetic fixture evidence. It displays the Verified Action Receipt.
5. Expand **View evidence and technical details** to inspect the record.

Approval is bound to the exact plan identity and monotonic revision. Model output cannot authorize it. **New demo session** resets the conversation, not persisted records. See [the runbook](docs/DEMO_RUNBOOK.md) for recovery and isolated-state runs.

## Optional Bedrock reader
The browser includes **Ask AIZOYA**, backed by POST /assistant. With ordinary `npm start`, Bedrock is deliberately disconnected; the reader returns 503 and the guided demo remains available.

The optional adapter uses Amazon Bedrock Runtime Converse with Nova Lite. It exposes only two reads—`get_shift_brief` and `get_action_receipt`—through the actual MCP handler, supplies tool results back to the model and builds the customer summary from verified tool data. It does not create plans conversationally, approve or execute writes.

An October 21 plugin-assisted test completed two actual Bedrock calls through the Node HTTP/MCP path. **Standalone AWS SDK authentication and a live SDK-to-browser journey have not been verified here.** [AWS evidence and reproduction boundaries](docs/AWS_INTEGRATION_EVIDENCE.md).

To run the optional SDK path in your own authorized AWS development environment, see [Bedrock setup](docs/BEDROCK_READER.md). It incurs provider charges and needs separate AWS credentials; this public repository supplies none.

## Implementation and verification
Node.js ES modules, built-in HTTP, MCP 2025-11-25 Streamable HTTP, exactly eight business-capability tools, single-process JSON persistence, SHA-256 integrity hashes and built-in node:test. Core guided mode has no runtime package dependencies. The Bedrock SDK is optional.

Fresh local verification: **preflight PASS; 40/40 tests PASS**, including ten consecutive isolated synthetic hero workflows. Coverage includes approval refusal/staleness, changed execution chains, missing evidence, idempotency, tenant partitions, session/origin checks, bounded reader calls and mocked-DOM UI behavior. These are not 40 live AWS scenarios or a production security certification.

- [Architecture and tool boundaries](docs/ARCHITECTURE.md)
- [Eight MCP tools](docs/MCP_TOOLS.md)
- [Current readiness and limitations](docs/READINESS.md)
- [Developer friction log](docs/FRICTION_LOG.md)
- [Source manifest](SOURCE_MANIFEST.sha256)

## Important limits
Demo headers are trusted local identity, not production authentication. JSON storage is not multi-process transaction-safe. Receipt hashes detect covered changes; they are not cryptographic signatures or proof of a real purchase. Fixture evidence retains historical dates separately from each run's synthetic closeout time. See [receipt timing](docs/VERIFIED_ACTION_RECEIPT.md). The current baseline video at https://vimeo.com/1226788601 predates the optional reader and later hardening; it is not evidence of those newer features. Current release browser/iPhone visual QA and revised recording remain outstanding.

No DynamoDB, Cognito, AgentCore, Strands, OpenSearch, production database, supplier, Toast or SMS integration is claimed. No hosting/deployment is included.

MIT — see [LICENSE](LICENSE). `private: true` in package.json prevents accidental npm publication, not access to this public GitHub source.
