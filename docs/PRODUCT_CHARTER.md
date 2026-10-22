# Product Charter

## Mission

Build a voice-first operations agent that turns a spoken operational goal into approved, owned, deadline-aware, and verified work.

## First controlled tenant

La Bandera Kitchen.

## Judge-facing promise

AIZOYA Operator remembers the outcome, asks before it spends, and proves the job got done.

## Hero workflow acceptance criteria

| Stage | Required outcome | Evidence |
|---|---|---|
| Inventory gap | Current requirement and shortage are identified | Inventory reconciliation record |
| Purchase plan | Required items, quantities, assumptions, and estimated cost are prepared | Versioned plan |
| Approval | No consequential purchase action proceeds without authorized approval | Approval event with actor, scope, and timestamp |
| Staff handoff | Owner, deadline, instructions, and acknowledgment are captured | Commitment record |
| Later-session brief | A separate session reconstructs current state and unresolved risk | State-continuity test |
| Receipt reconciliation | Receipt evidence is matched to the approved plan and discrepancies are surfaced | Reconciliation record |
| Verified closeout | Completion is supported by evidence and unresolved exceptions remain visible | Verified Action Receipt |

## MVP boundaries

- One product, one tenant, one hero workflow.
- Eight or fewer MCP tools.
- Synthetic fixtures only.
- Safe simulation is acceptable when labeled.
- No autonomous spending, contacting, publishing, or production mutation.

## Demonstration scope
The table above describes product acceptance goals. Current handoff/ownership and receipt evidence are synthetic. No real staff acknowledgment, external purchasing or spoken-input/native Alexa integration is demonstrated by this source release. See READINESS.md for the verified implementation boundary.
