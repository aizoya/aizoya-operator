# Local synthetic demo runbook
Run npm run verify, then npm start. Open http://127.0.0.1:8787/ locally. No package installation, AWS account or inference charge is needed for guided mode. Do not expose the service publicly.

1. Confirm the synthetic Alexa+ simulation label.
2. Click Prepare guided demo plan. Inspect three shortages and the $66 plan.
3. Click Not now. Confirm no handoff.
4. Prepare a plan again; inspect items. The human operator—not the model—clicks Approve this demo plan.
5. This triggers synthetic handoff, a later MCP session/risk brief and automatic fixture evidence reconciliation. Inspect the final synthetic receipt.
6. Expand technical details. No actual purchase or independently uploaded customer receipt is involved.
7. New demo session resets the conversation, not the persisted records. Refresh risk brief restores a pending approval plan after a page reload.

For an isolated local run, choose a new synthetic-state filename outside source:
```bash
AIZOYA_STATE_PATH=/tmp/aizoya-operator-demo-unique-state.json npm start
```
Choose a genuinely unused path; the server preserves an existing state file. Do not delete another user's state. Stop the process before restarting. The default store is .data/state.json.

The optional Ask AIZOYA path returns a clear disconnected response under npm start. Follow BEDROCK_READER.md only in an authorized paid development environment. No native Alexa entitlement is provided.

Automated negative cases (refusal, stale plan/reapproval, mismatched or missing evidence, stale closeout, duplicate keys and cross-tenant partitions) are in test/. Automated mocked-DOM UI tests are not real-browser or iPhone QA. Current release visual QA/revised recording remain open; the existing Vimeo video shows an earlier baseline.
