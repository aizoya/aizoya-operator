# Judge Demo Runbook — Local Synthetic MVP

This runbook demonstrates AIZOYA Operator for Alexa+ locally using synthetic data only. It does not require deployment, cloud spend, production data, or live external integrations.

## Preconditions

- Node.js 22 or newer.
- No `.env`, credentials, production data, customer information, or live supplier/payment integrations are required.
- `.data/` contains synthetic local runtime state only and is gitignored.

## Clean verification

Run:

```bash
npm run verify
```

Required result:

- preflight exits 0;
- exact eight-tool MCP inventory is confirmed;
- all automated tests pass;
- the 10-consecutive-run reliability test passes.

If any check fails, stop and fix the specific failing invariant before using the demo.

## Start the local simulation

```bash
npm start
```

Default bind target: `127.0.0.1:8787`.

Open:

```text
http://127.0.0.1:8787/
```

The interface is intentionally labeled as a synthetic Alexa+ simulation.

## Three-minute demo path

1. Click **Run to approval gate**.
2. Show the synthetic inventory gaps.
3. Show the versioned purchase plan and estimated total.
4. Pause on the visible **Human approval required** card and note that no purchase has been made and no handoff can occur yet.
5. Select **Not now** to demonstrate that no handoff occurs.
6. Run to the approval gate again.
7. As the human operator, click **Approve current plan**.
8. Show the governed staff handoff.
9. Show the later-session brief with preserved operational state and unresolved risk.
10. Show deterministic synthetic receipt reconciliation and the final Verified Action Receipt.

## Mandatory scope disclosures

- This is a synthetic local Alexa+ simulation.
- No real purchase is executed.
- No Toast, supplier, SMS, payment, or production write is live.
- AWS/Bedrock integration is architecture-only in the current verified MVP.
- The human approval interaction is real within the simulation and is not generated automatically by the agent.

## Expected safe failures

### Approval declined or negated

The workflow remains unapproved and no handoff occurs. Phrases such as `I do not approve` must not satisfy the approval gate.

### Stale approval

Handoff is rejected until the current plan version is explicitly approved.

### Missing evidence

Verified Action Receipt issuance is refused until required evidence reconciles.

### Tenant mismatch

No cross-tenant workflow or receipt information is returned.

### Local server restart

Restart with `npm start`. Synthetic state persists in `.data/state.json` unless a fresh `AIZOYA_STATE_PATH` is deliberately used.

## What not to claim

Do not describe any of these as implemented or live in this MVP:

- production Alexa+ deployment;
- live Bedrock orchestration;
- production AWS infrastructure;
- real purchasing or supplier outreach;
- Toast or SMS production integration;
- production authentication or production database persistence; or
- autonomous spending.
