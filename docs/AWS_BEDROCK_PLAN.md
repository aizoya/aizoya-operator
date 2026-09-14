# AWS / Bedrock Integration Plan — Not Executed

This document defines the authorized-next architecture without creating cloud resources or incurring cost.

## Proposed adapter architecture

`Alexa+ simulated/real client → AIZOYA orchestrator → Amazon Bedrock Converse/ConverseStream → MCP client → AIZOYA MCP /mcp → deterministic policy/domain layer → persistence/connectors`

## Bedrock responsibility

Bedrock may interpret natural language, choose among the eight MCP tools, and summarize structured results. It is **not** an authority source for tenant identity, approval, evidence truth, or state transitions.

## Deterministic application responsibility

- validate authenticated tenant/actor context;
- enforce idempotency and current plan version;
- require explicit authorized approval;
- block handoff when approval is absent/stale;
- reconcile evidence;
- issue Verified Action Receipts only on deterministic success.

## Future AWS adapters after explicit authorization

- Bedrock Converse/ConverseStream for orchestration;
- DynamoDB for durable tenant-partitioned state and conditional writes;
- KMS for encryption controls;
- CloudWatch for redacted telemetry;
- Secrets Manager for credentials;
- AgentCore Gateway only if it materially improves the judge path and cost is approved.

## Current status

Architecture only. No AWS resource, Bedrock invocation, deployment, production data, or paid service was used in this implementation slice.
