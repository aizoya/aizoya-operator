# AIZOYA Operator for Alexa+

**Alexa+ provides the intelligence. AIZOYA adds the accountability layer.**

AIZOYA Operator is a governed operations layer designed to carry real-world work safely from intent to evidence.

> It remembers the work, asks before consequential action, and proves the job got done.

## What this project demonstrates

The current submission uses a **synthetic local Alexa+ simulation** for a La Bandera Kitchen Saturday preorder-readiness workflow:

`inventory gap → purchase plan → human approval → staff handoff → later-session risk brief → receipt reconciliation → Verified Action Receipt`

The demo shows that AIZOYA can:

- identify synthetic inventory gaps;
- build a versioned synthetic purchase plan;
- stop at a visible human approval gate;
- prove that **Not now** results in no handoff;
- reject missing, negated, and stale approval;
- hand approved work to a staff owner;
- preserve structured operational state across later sessions;
- reconcile synthetic receipt evidence; and
- issue a Verified Action Receipt only after deterministic verification.

In plain language: **AIZOYA remembers the work, not just the conversation.**

## MCP tool surface

Exactly eight business-capability tools are exposed:

1. `get_shift_brief`
2. `capture_commitment`
3. `reconcile_inventory`
4. `build_purchase_plan`
5. `approve_action`
6. `handoff_task`
7. `verify_closeout`
8. `get_action_receipt`

## Technical foundation

- Node.js 22+
- ES modules
- zero runtime dependencies for the MVP
- MCP `2025-11-25` Streamable HTTP at `/mcp`
- atomic JSON-file persistence for synthetic local state
- tenant-partitioned state
- idempotency protection
- version-bound human approval
- SHA-256 evidence and state hashes
- built-in `node:test`

## Run locally

```bash
git clone https://github.com/aizoya/aizoya-operator-alexa.git
cd aizoya-operator-alexa

node --version
npm run verify
npm start
```

Then open:

```text
http://127.0.0.1:8787/
```

The MCP endpoint is available at:

```text
http://127.0.0.1:8787/mcp
```

### Suggested demo path

1. Click **Run to approval gate**.
2. Review the synthetic inventory gaps and versioned purchase plan.
3. Choose **Not now** to verify that no handoff occurs.
4. Run to the approval gate again.
5. Click **Approve current plan** as the human operator.
6. Observe the governed staff handoff.
7. Review the later-session risk brief and preserved operational state.
8. Observe deterministic synthetic receipt reconciliation.
9. Review the final Verified Action Receipt.

## Verification

The verified development build passed:

- **13/13 automated tests**
- **10/10 consecutive isolated hero workflows**

The suite covers the local judge UI origin, invalid-origin rejection, protocol/session requirements, approval gating, negated approval, stale approval, idempotency conflicts, tenant isolation, cross-session continuity, complete synthetic workflow persistence, and Verified Action Receipt generation.

Run the same verification locally with:

```bash
npm run verify
```

## Safety model

- Model output is never treated as authorization.
- Consequential handoff requires explicit approval of the exact current plan version.
- Rebuilding/changing the plan invalidates prior approval.
- `Not now` leaves the plan unapproved and performs no handoff.
- Tenant state is partitioned and negative cross-tenant access is tested.
- Receipt issuance requires deterministic evidence reconciliation.
- Idempotency keys protect writes from duplicate execution.
- Browser origins are validated.

## Current scope and limitations

This repository demonstrates a **synthetic local Alexa+ simulation**.

It does **not** claim or implement:

- production Alexa+ deployment;
- live Amazon Bedrock orchestration;
- production AWS infrastructure;
- real purchasing;
- real supplier messaging;
- Toast production integration;
- SMS execution;
- production authentication;
- production database persistence; or
- autonomous spending.

AWS/Bedrock integration is documented as architecture-only in the current verified MVP. See [`docs/AWS_BEDROCK_PLAN.md`](docs/AWS_BEDROCK_PLAN.md).

## Documentation

- [`docs/PRODUCT_CHARTER.md`](docs/PRODUCT_CHARTER.md) — product scope and positioning
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — implementation architecture
- [`docs/MCP_TOOLS.md`](docs/MCP_TOOLS.md) — locked eight-tool inventory
- [`docs/VERIFIED_ACTION_RECEIPT.md`](docs/VERIFIED_ACTION_RECEIPT.md) — verification/receipt model
- [`docs/AWS_BEDROCK_PLAN.md`](docs/AWS_BEDROCK_PLAN.md) — future AWS/Bedrock adapter plan, not executed
- [`docs/DEMO_RUNBOOK.md`](docs/DEMO_RUNBOOK.md) — local synthetic demo procedure

## License

MIT — see [`LICENSE`](LICENSE).
