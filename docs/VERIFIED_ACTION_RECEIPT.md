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

## Receipt chronology correction — October 23, 2026
The browser rehearsal exposed a defect: `completed_at` copied September 12 fixture evidence time into an October 23 workflow, preceding approval. Two new regression tests reproduced the defect before correction; preflight and all 40 tests pass after correction.

`completed_at` now records when this run completes synthetic reconciliation, equal to `created_at`. `evidence_completed_at` preserves the fixture's original historical timestamp, covered by the receipt hash; `completion_basis: synthetic_reconciliation` makes the distinction explicit. This does not assert that a real purchase or fulfillment occurred at either time. Fixture evidence is unchanged.

Issuance checks request → approval → handoff → reconciliation timestamp order. Both readiness and receipt retrieval reject invalid or out-of-order receipt timestamps, even if their hash matches. Clock rollback fails safely. Old receipts are not rewritten; older records with invalid chronology no longer establish READY under the corrected code. Use a fresh synthetic state path for rehearsal.

Owner-supplied Mac screenshots show the earlier build's refreshed brief changing from AWAITING_CLOSEOUT_EVIDENCE to READY after closeout, and the reader indicator reporting two model calls. These screenshots establish observed browser behavior, not independent AWS request logs or acceptance of this corrected build. No paid call or native Alexa test was performed for this patch. Updated Mac rehearsal and recording remain open.
