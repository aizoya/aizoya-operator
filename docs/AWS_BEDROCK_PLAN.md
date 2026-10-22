# AWS integration status
This supersedes the earlier architecture-only summary for the public source snapshot.
Amazon Bedrock Runtime's optional bounded reader is implemented, and a two-call plugin-assisted HTTP/MCP probe ran against Nova Lite. See [dated evidence](AWS_INTEGRATION_EVIDENCE.md) for exact limits and [SDK setup](BEDROCK_READER.md) for the live-unverified standalone path.

DynamoDB, AgentCore, Strands, KMS, CloudWatch, Secrets Manager and other cloud adapters remain future design possibilities, not executed integrations in this release. No production infrastructure or deployment is provided. Future additions require a measured need, least-privilege identity, tests and separate authorization.
