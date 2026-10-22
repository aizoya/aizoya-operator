const object = (properties, required = []) => ({
  type: 'object', additionalProperties: false, properties, required
});

export const TOOL_DEFINITIONS = [
  {
    name: 'get_shift_brief', title: 'Get Shift Brief',
    description: 'Return current Saturday preorder readiness, open commitments, risks, and next actions for the authenticated tenant.',
    inputSchema: object({ operational_date: { type: 'string' } }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: 'capture_commitment', title: 'Capture Commitment',
    description: 'Create an owned, deadline-aware operational commitment from a spoken goal.',
    inputSchema: object({ goal: { type: 'string', minLength: 1 }, owner: { type: 'string', minLength: 1 }, due_at: { type: 'string' }, idempotency_key: { type: 'string', minLength: 1 } }, ['goal','owner','due_at','idempotency_key']),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: 'reconcile_inventory', title: 'Reconcile Inventory',
    description: 'Compare synthetic preorder demand with synthetic on-hand inventory and record gaps.',
    inputSchema: object({ workflow_id: { type: 'string' }, idempotency_key: { type: 'string', minLength: 1 } }, ['workflow_id','idempotency_key']),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: 'build_purchase_plan', title: 'Build Purchase Plan',
    description: 'Build a versioned synthetic purchase plan from recorded inventory gaps. Does not execute a purchase.',
    inputSchema: object({ workflow_id: { type: 'string' }, idempotency_key: { type: 'string', minLength: 1 } }, ['workflow_id','idempotency_key']),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: 'approve_action', title: 'Approve Action',
    description: 'Record explicit human approval for the exact current purchase-plan version. Never executes a purchase.',
    inputSchema: object({ workflow_id: { type: 'string' }, plan_id: { type: 'string', minLength: 1 }, plan_version: { type: 'integer', minimum: 1 }, approval_phrase: { type: 'string', minLength: 1 }, idempotency_key: { type: 'string', minLength: 1 } }, ['workflow_id','plan_id','plan_version','approval_phrase','idempotency_key']),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: 'handoff_task', title: 'Handoff Task',
    description: 'Assign the approved plan to a staff owner. Fails unless persisted approval matches the current plan version.',
    inputSchema: object({ workflow_id: { type: 'string' }, assignee: { type: 'string', minLength: 1 }, due_at: { type: 'string' }, idempotency_key: { type: 'string', minLength: 1 } }, ['workflow_id','assignee','due_at','idempotency_key']),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: 'verify_closeout', title: 'Verify Closeout',
    description: 'Reconcile synthetic receipt evidence against the approved plan and issue a Verified Action Receipt only when deterministic verification passes.',
    inputSchema: object({ workflow_id: { type: 'string' }, evidence_ref: { type: 'string', minLength: 1 }, idempotency_key: { type: 'string', minLength: 1 } }, ['workflow_id','evidence_ref','idempotency_key']),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: 'get_action_receipt', title: 'Get Verified Action Receipt',
    description: 'Retrieve a previously issued Verified Action Receipt for the authenticated tenant.',
    inputSchema: object({ receipt_id: { type: 'string', minLength: 1 } }, ['receipt_id']),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }
];

