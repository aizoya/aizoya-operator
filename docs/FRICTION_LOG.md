# Dated scope note — October 22, 2026
Entries1–4 below document the earlier baseline. The13-test count is historical; current source verification is32 tests. They are developer observations/suggestions, not proof of native Alexa+ execution or an assertion that the platform lacks those features. See AWS_INTEGRATION_EVIDENCE.md for the later bounded Bedrock experiment.

# AIZOYA Operator for Alexa+ — Friction Log

## 1. Local Alexa+ / MCP browser origin mismatch

**Task attempted:** Run the complete AIZOYA Operator synthetic Alexa+ experience locally through the browser and MCP Streamable HTTP server.

**Steps taken:**
1. Started the Node.js MCP server locally on `127.0.0.1:8787`.
2. Opened the local Alexa+ simulated web interface.
3. Started the Saturday preorder-readiness workflow.
4. The browser attempted to initialize an MCP session through `/mcp`.

**Expected result:** The browser should initialize the MCP session and continue into inventory reconciliation and the human-approval workflow.

**Actual result:** The UI produced a safe failure and surfaced an error equivalent to `Cannot read properties of undefined (reading 'structuredContent')`. Investigation showed that the server Origin allowlist permitted local port 3000 while the actual judge interface was running at `127.0.0.1:8787`, so the MCP request was rejected before the application received the expected structured result.

**Severity:** Critical

**Workaround / resolution:** Added the actual local judge UI origin to the allowlist, added an automated regression test proving `http://127.0.0.1:8787` is accepted, retained invalid-origin rejection coverage, and hardened the web client so MCP/HTTP errors are surfaced directly instead of causing a secondary JavaScript exception. After the fix, the browser workflow passed and the automated suite reached 13/13 passing tests.

**Actionable suggestion:** Provide clearer MCP development guidance and tooling around local Origin configuration. A development helper that reports the received Origin and configured allowlist would significantly reduce debugging time.

## 2. Distinguishing Alexa+ native capabilities from extension-layer responsibilities

**Task attempted:** Define which capabilities belong to Alexa+ versus which responsibilities should be implemented by AIZOYA Operator.

**Steps taken:**
1. Designed the workflow around conversational intent, persistent work, approval, execution, and verification.
2. Reviewed Alexa+ capabilities and MCP integration patterns.
3. Reworked the product boundary to avoid claiming Alexa+ lacks capabilities it already provides.
4. Moved the AIZOYA differentiation toward operational accountability: authorization, ownership, persistent workflow state, evidence reconciliation, and Verified Action Receipts.

**Expected result:** Platform guidance would make it immediately clear which workflow responsibilities are native Alexa+ capabilities and which should be implemented by an MCP-based extension.

**Actual result:** Additional research and architectural interpretation were required to establish a precise boundary between Alexa+ orchestration and application-specific operational governance.

**Severity:** Important

**Workaround / resolution:** Adopted a clear architecture: **Alexa+ provides intelligence and orchestration. AIZOYA provides the accountability layer.** AIZOYA therefore handles deterministic approval enforcement, operational ownership, persistent workflow state, evidence reconciliation, and verified closeout rather than duplicating Alexa+'s conversational intelligence.

**Actionable suggestion:** Add more end-to-end reference architectures showing responsibility boundaries between Alexa+, MCP servers, application state, authorization, and external systems, especially for consequential workflows.

## 3. Human approval needs stronger first-class workflow semantics

**Task attempted:** Guarantee that an AI agent cannot authorize its own consequential action.

**Steps taken:**
1. Created a versioned purchase plan.
2. Bound approval to the exact persisted plan ID/version.
3. Required a separate explicit human approval event.
4. Added negative tests for missing approval, negated approval, and stale approval.
5. Prevented staff handoff when authorization was absent or no longer current.

**Expected result:** A clear platform pattern for differentiating model intent from authoritative human approval.

**Actual result:** The approval boundary had to be implemented entirely at the application/domain layer. Natural-language interpretation alone is not sufficient for consequential authorization because phrases such as `I do not approve` must never satisfy the approval gate.

**Severity:** Important

**Workaround / resolution:** AIZOYA uses deterministic server-side authorization. Model output is never considered approval authority. Approval is a separate persisted state transition tied to the exact current plan version.

**Actionable suggestion:** Consider first-class Alexa+/MCP patterns for consequential-action approval, including structured human-confirmation events, scope/version binding, expiration or invalidation semantics, and explicit separation between model-generated intent and authoritative user consent.

## 4. Cross-session operational continuity requires application-managed state

**Task attempted:** Allow a later Alexa+ interaction to know that previously approved work was still incomplete.

**Steps taken:**
1. Created the workflow and purchase plan.
2. Captured explicit human approval.
3. Assigned the approved work to a staff owner.
4. Ended the interaction.
5. Started a later session and reconstructed the workflow.
6. Verified that the system still reported `AT_RISK` with `AWAITING_CLOSEOUT_EVIDENCE`.

**Expected result:** A straightforward pattern for preserving long-running operational commitments across conversational sessions.

**Actual result:** Operational continuity needed to be modeled and persisted independently from conversational context. The application must remember the state of the work — approval, ownership, unresolved risks, and evidence requirements — rather than relying on conversation history alone.

**Severity:** Important

**Workaround / resolution:** Implemented a tenant-partitioned persistent state adapter and reconstructed the current operational state on later requests. This led to a central product principle: **AIZOYA remembers the work, not just the conversation.**

**Actionable suggestion:** Provide reference patterns or first-class primitives for durable multi-session agent workflows: commitments, owners, deadlines, approval state, unresolved conditions, and completion evidence.

## Overall takeaway

Reliable real-world agent workflows require a clear separation between:

**conversation → intent → authority → execution → evidence → verified outcome**

Alexa+ and MCP provide a strong foundation for intelligence and orchestration. Additional examples and primitives around durable state, consequential-action approval, and evidence-backed completion would make trustworthy operational agents substantially easier to build.

## 5. Nova Lite token pre-count unsupported in this experiment
Task: pre-count a bounded Converse request before a live probe. Expected: CountTokens returns a supported token count. Actual: ValidationException for this selected model. Severity: Important. Workaround: retained fixed model/region, request-byte and output/call bounds, checked pricing separately and kept invoice status unknown; did not claim successful pre-count. Suggestion: make per-model CountTokens support and bounded-cost alternatives easier to identify before dispatch.
