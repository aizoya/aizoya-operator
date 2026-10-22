# Final published-code Bedrock check

The published executable at fd858a52c74b6856eea63542685b2bbeb0d3a33c was tested after MCP and receipt-integrity fixes on October 22, 2026 UTC. A fresh private bridge directory and fresh state path were set before Node started. Synthetic data only.

The actual application constructed both Converse requests, executed get_shift_brief through its MCP handler, supplied the tool result to the model and returned HTTP 200 from /assistant. Both authenticated AWS Bedrock Runtime Converse API calls succeeded using amazon.nova-lite-v1:0 in us-west-2. Stop reasons: tool_use, then end_turn. Usage: 551 input/70 output and 694 input/116 output; total 1245 input + 186 output = 1431 tokens. usageComplete=true, calls=2. Result: AT_RISK, NO_COMMITMENT. No state-changing model tools were offered.

This confirms the corrected plugin-assisted application path. The bridge requires a separate authenticated AWS plugin; it does not provide standalone AWS credentials. Standalone SDK authentication, native Alexa deployment and actual browser/mobile acceptance remain unverified. The release passed all 38 local tests and independent regression review. This live check is narrow synthetic evidence, not a production certification or an invoice.
