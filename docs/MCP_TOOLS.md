# Locked MCP Tool Inventory

Judge-ready surface: **8 tools exactly**.

1. `get_shift_brief` — read current readiness, risks, continuity state, and next actions.
2. `capture_commitment` — persist owner/deadline-aware operational commitment.
3. `reconcile_inventory` — compare synthetic demand to synthetic on-hand inventory.
4. `build_purchase_plan` — produce a versioned approval-ready plan; never purchases.
5. `approve_action` — record explicit approval for the exact current plan version.
6. `handoff_task` — assign approved work; fails without current persisted approval.
7. `verify_closeout` — reconcile synthetic receipt evidence and issue a VAR only on deterministic success.
8. `get_action_receipt` — retrieve the immutable/tamper-evident VAR record.

No vendor-specific tools are exposed. Toast, supplier, Bedrock, DynamoDB, SMS, or other adapters must remain underneath these business-capability contracts.

## Current release boundary
Bedrock sees only the two read-only tools, not the entire eight-tool inventory. Approval binds exact plan ID and monotonic revision. These controls run under trusted local demo identity, not production authentication. Receipt storage is local and mutable by the operating-system user; hashes are integrity checks, not immutable storage or digital signatures.
