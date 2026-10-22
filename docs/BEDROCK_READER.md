# Optional Amazon Bedrock reader
## What is verified
The local suite exercises the real HTTP/MCP path with mocked model transport. A separate two-call authenticated AWS-plugin bridge probe exercised actual Bedrock through the Node /assistant route. Neither establishes that the standalone SDK credential path works in this workspace.

## Authorized development setup
The guided demo needs no AWS credentials. For optional live calls, use your own authorized AWS credential provider, appropriate Bedrock model access, region and budget. Never paste credentials into chat, source or logs. The AWS plugin connection is not transferable to this Node process.

Install the official optional SDK in your development checkout:
```bash
npm install --no-save --package-lock=false @aws-sdk/client-bedrock-runtime
```

This unpinned install uses the registry version at installation time. Record that version in your own run evidence; this release did not install or verify a specific SDK build.

Stop any existing `npm start` process first; both launchers use port 8787. Then:
```bash
AWS_REGION=us-west-2 AIZOYA_BEDROCK_MODEL=amazon.nova-lite-v1:0 AIZOYA_BEDROCK_TEST_APPROVED=true node scripts/start-bedrock.mjs
```
Open http://127.0.0.1:8787/ locally and ask about readiness. This launcher does not invoke the model until a question is submitted. Missing credentials/model access must fail, not be silently replaced.

Alternatively, leave ordinary `npm start` running and use the standalone CLI in another terminal:
```bash
AWS_REGION=us-west-2 AIZOYA_BEDROCK_MODEL=amazon.nova-lite-v1:0 AIZOYA_BEDROCK_TEST_APPROVED=true node scripts/bedrock-read.mjs "Are we ready for Saturday?"
```

Do not run the browser launcher and ordinary server simultaneously on the same port. Do not run paid tests without checking current model/region pricing and budget. Each CLI invocation has its own three-call loop; it does not share the browser server's six-call cap. Restarting either process resets its counters.

## Safety and costs
Only readiness/receipt reads are offered to the model. No approval or write tool can be dispatched by the reader. The opt-in flag is not spending authorization from another person or a billing guard. One SDK attempt per call, twenty-second timeout, output/prompt/tool-result bounds and per-process call caps limit traffic but do not guarantee a dollar ceiling. Provider billing can occur even after an ambiguous timeout; do not automatically retry.

No application credential, provider endpoint secret or paid entitlement is distributed. Read [the dated integration evidence](AWS_INTEGRATION_EVIDENCE.md) before describing the live integration.
