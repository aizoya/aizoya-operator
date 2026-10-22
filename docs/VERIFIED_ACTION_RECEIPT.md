# Verified Action Receipt — Initial Specification

A Verified Action Receipt (VAR) is evidence that an authorized operational outcome occurred. It is not a generic model summary and must never claim verification from untrusted narrative alone.

## Required fields

- `receipt_id`
- `tenant_id`
- `workflow_id`
- `action_type`
- `requested_by`
- `authorized_by` when consequential
- `owner`
- `status`
- `requested_at`
- `authorized_at`
- `completed_at`
- `evidence_refs[]`
- `input_state_hash`
- `result_state_hash`
- `exceptions[]`
- `verification_method`
- `verifier`
- `created_at`
- `schema_version`

## Verification rules

1. No VAR is issued while required evidence is absent or conflicting.
2. Approval evidence must precede consequential execution.
3. Tenant and authorization context must be validated server-side.
4. Evidence references must be immutable or content-addressed.
5. Corrections create a new version; they do not erase prior history.
6. Simulated evidence must be visibly labeled and cannot be promoted as live proof.
7. Open exceptions remain attached to the closeout record.

The implementation schema and signing strategy require Product and Security review before being treated as final.

## Current release scope
This is a design specification, not a promise of finalized schema or real-world proof. The local synthetic implementation verifies fixture evidence against current approval/handoff linkage and hashes. It does not sign receipts, provide immutable storage, prove supplier fulfillment or authenticate remote users. The runtime schema in src/domain.js is authoritative for this snapshot.
