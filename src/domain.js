import crypto from 'node:crypto';
import fs from 'node:fs';

const iso = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;
const sha256 = (value) => crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const fail = (code, message = code) => Object.assign(new Error(message), { code });
const isExplicitApproval = (phrase) => {
  const text = String(phrase ?? '').trim().toLowerCase();
  if (!/\bapprove(d)?\b/.test(text)) return false;
  if (/\b(?:not|never)\s+approve(?:d)?\b/.test(text)) return false;
  if (/\b(?:do|does|did)\s+not\s+approve(?:d)?\b/.test(text)) return false;
  if (/\b(?:don't|doesn't|didn't)\s+approve(?:d)?\b/.test(text)) return false;
  return true;
};

function tenant(store, tenantId) { return store.readTenant(tenantId); }
function audit(t, actor, event, data = {}) { t.audit.push({ at: iso(), actor, event, ...data }); }
function idem(t, key, args, fn) {
  const h = sha256(JSON.stringify(args));
  const prior = t.idempotency[key];
  if (prior) {
    if (prior.request_hash !== h) throw fail('IDEMPOTENCY_CONFLICT');
    return structuredClone(prior.result);
  }
  const result = fn();
  t.idempotency[key] = { request_hash: h, result: structuredClone(result), created_at: iso() };
  return result;
}
function workflow(t, workflowId) {
  const w = t.workflows[workflowId];
  if (!w) throw fail('WORKFLOW_NOT_FOUND');
  return w;
}

export function createOperations({ store, fixturePath }) {
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  return {
    getShiftBrief(ctx) {
      const t = tenant(store, ctx.tenantId);
      const latest = Object.values(t.workflows).at(-1);
      if (!latest) return { readiness: 'AT_RISK', synthetic: true, summary: 'No Saturday readiness commitment exists yet.', risks: ['NO_COMMITMENT'], next_actions: ['capture_commitment'] };
      const risks = [];
      if (!latest.inventory_reconciliation) risks.push('INVENTORY_NOT_RECONCILED');
      if (latest.purchase_plan && !latest.approval) risks.push('PLAN_AWAITING_APPROVAL');
      if (latest.approval && !latest.handoff) risks.push('APPROVED_WORK_NOT_HANDED_OFF');
      if (latest.handoff && !latest.verified_action_receipt_id) risks.push('AWAITING_CLOSEOUT_EVIDENCE');
      return { readiness: risks.length ? 'AT_RISK' : 'READY', synthetic: true, workflow_id: latest.workflow_id, status: latest.status, summary: risks.length ? `Saturday readiness has ${risks.length} unresolved risk(s).` : 'Saturday preorder workflow is verified closed.', risks, next_actions: risks };
    },
    captureCommitment(ctx, args) {
      const t = tenant(store, ctx.tenantId);
      const result = idem(t, args.idempotency_key, args, () => {
        const workflowId = id('wf');
        const w = { workflow_id: workflowId, tenant_id: ctx.tenantId, synthetic: true, goal: args.goal, requested_by: ctx.actorId, owner: args.owner, due_at: args.due_at, status: 'OPEN', created_at: iso(), updated_at: iso(), version: 1 };
        t.workflows[workflowId] = w;
        audit(t, ctx.actorId, 'commitment.captured', { workflow_id: workflowId });
        return { workflow_id: workflowId, status: w.status, owner: w.owner, due_at: w.due_at, synthetic: true };
      });
      store.writeTenant(ctx.tenantId, t); return result;
    },
    reconcileInventory(ctx, args) {
      const t = tenant(store, ctx.tenantId); const w = workflow(t, args.workflow_id);
      const result = idem(t, args.idempotency_key, args, () => {
        const onHand = new Map(fixture.inventory.map(x => [x.sku, x]));
        const gaps = fixture.preorders.map(r => ({ sku: r.sku, name: r.name, required: r.required, available: onHand.get(r.sku)?.available ?? 0, shortage: Math.max(0, r.required - (onHand.get(r.sku)?.available ?? 0)), unit: r.unit })).filter(x => x.shortage > 0);
        w.inventory_reconciliation = { reconciliation_id: id('inv'), synthetic: true, gaps, recorded_at: iso(), source: 'fixture:lbk-saturday.json' };
        w.status = gaps.length ? 'GAPS_IDENTIFIED' : 'INVENTORY_READY'; w.updated_at = iso(); w.version++;
        audit(t, ctx.actorId, 'inventory.reconciled', { workflow_id: w.workflow_id, gap_count: gaps.length });
        return { reconciliation_id: w.inventory_reconciliation.reconciliation_id, gaps, risk_level: gaps.length ? 'HIGH' : 'LOW', synthetic: true };
      });
      store.writeTenant(ctx.tenantId, t); return result;
    },
    buildPurchasePlan(ctx, args) {
      const t = tenant(store, ctx.tenantId); const w = workflow(t, args.workflow_id);
      if (!w.inventory_reconciliation) throw fail('INVENTORY_RECONCILIATION_REQUIRED');
      const result = idem(t, args.idempotency_key, args, () => {
        const prices = new Map(fixture.catalog.map(x => [x.sku, x]));
        const items = w.inventory_reconciliation.gaps.map(g => { const p = prices.get(g.sku); return { sku:g.sku, name:g.name, quantity:g.shortage, unit:g.unit, unit_price:p.unit_price, line_total:Number((g.shortage*p.unit_price).toFixed(2)) }; });
        const version = (w.purchase_plan?.version ?? 0) + 1;
        w.purchase_plan = { plan_id: id('plan'), version, synthetic: true, items, estimated_total:Number(items.reduce((s,x)=>s+x.line_total,0).toFixed(2)), currency:'USD', status:'AWAITING_APPROVAL', created_at:iso() };
        w.approval = null; w.handoff = null; w.status='AWAITING_APPROVAL'; w.updated_at=iso(); w.version++;
        audit(t, ctx.actorId, 'purchase_plan.built', { workflow_id:w.workflow_id, plan_id:w.purchase_plan.plan_id, plan_version:version });
        return { ...w.purchase_plan, approval_required:true };
      });
      store.writeTenant(ctx.tenantId, t); return result;
    },
    approveAction(ctx, args) {
      if (!['OWNER','MANAGER'].includes(ctx.role)) throw fail('APPROVER_UNAUTHORIZED');
      const t = tenant(store, ctx.tenantId); const w = workflow(t, args.workflow_id); const p = w.purchase_plan;
      if (!p) throw fail('PURCHASE_PLAN_REQUIRED');
      if (p.version !== args.plan_version) throw fail('APPROVAL_STALE');
      if (!isExplicitApproval(args.approval_phrase)) throw fail('EXPLICIT_APPROVAL_REQUIRED');
      const result = idem(t, args.idempotency_key, args, () => {
        w.approval = { approval_id:id('ap'), plan_id:p.plan_id, plan_version:p.version, authorized_by:ctx.actorId, authorized_at:iso(), phrase_hash:sha256(args.approval_phrase), synthetic:true };
        w.status='APPROVED'; w.updated_at=iso(); w.version++;
        audit(t, ctx.actorId, 'action.approved', { workflow_id:w.workflow_id, plan_id:p.plan_id, plan_version:p.version });
        return { approval_id:w.approval.approval_id, status:'APPROVED', plan_id:p.plan_id, plan_version:p.version, authorized_by:ctx.actorId, authorized_at:w.approval.authorized_at, synthetic:true };
      });
      store.writeTenant(ctx.tenantId, t); return result;
    },
    handoffTask(ctx, args) {
      const t = tenant(store, ctx.tenantId); const w = workflow(t, args.workflow_id); const p=w.purchase_plan; const a=w.approval;
      if (!p || !a) throw fail('APPROVAL_REQUIRED');
      if (a.plan_id!==p.plan_id || a.plan_version!==p.version) throw fail('APPROVAL_STALE');
      const result = idem(t, args.idempotency_key, args, () => {
        w.handoff={ handoff_id:id('handoff'), assignee:args.assignee, due_at:args.due_at, plan_id:p.plan_id, plan_version:p.version, approval_id:a.approval_id, acknowledged:true, synthetic:true, created_at:iso() };
        w.status='HANDED_OFF'; w.updated_at=iso(); w.version++;
        audit(t, ctx.actorId, 'task.handed_off', { workflow_id:w.workflow_id, handoff_id:w.handoff.handoff_id });
        return { ...w.handoff, status:w.status };
      });
      store.writeTenant(ctx.tenantId, t); return result;
    },
    verifyCloseout(ctx, args) {
      const t = tenant(store, ctx.tenantId); const w=workflow(t,args.workflow_id);
      if (!w.handoff || !w.approval || !w.purchase_plan) throw fail('EXECUTION_CHAIN_INCOMPLETE');
      const evidence = fixture.receipts.find(r => r.evidence_ref === args.evidence_ref);
      if (!evidence) throw fail('EVIDENCE_NOT_FOUND');
      if (!evidence.synthetic) throw fail('NON_SYNTHETIC_EVIDENCE_PROHIBITED');
      const result = idem(t,args.idempotency_key,args,()=>{
        const expected = new Map(w.purchase_plan.items.map(x=>[x.sku,x.quantity]));
        const actual = new Map(evidence.items.map(x=>[x.sku,x.quantity]));
        const exceptions=[];
        for (const [sku,qty] of expected) if ((actual.get(sku)??0) < qty) exceptions.push(`SHORT:${sku}:${qty-(actual.get(sku)??0)}`);
        if (exceptions.length) {
          audit(t,ctx.actorId,'closeout.verification_failed',{workflow_id:w.workflow_id,exceptions});
          return { verification_result:'FAILED_VERIFICATION', exceptions, action_receipt_id:null, synthetic:true };
        }
        const inputState={ workflow_id:w.workflow_id, plan_id:w.purchase_plan.plan_id, plan_version:w.purchase_plan.version, approval_id:w.approval.approval_id, handoff_id:w.handoff.handoff_id };
        const resultState={ evidence_ref:evidence.evidence_ref, evidence_hash:sha256(JSON.stringify(evidence)), exceptions };
        const receipt={ receipt_id:id('var'), tenant_id:ctx.tenantId, workflow_id:w.workflow_id, action_type:'synthetic_purchase_readiness_closeout', requested_by:w.requested_by, authorized_by:w.approval.authorized_by, owner:w.handoff.assignee, status:'VERIFIED', requested_at:w.created_at, authorized_at:w.approval.authorized_at, completed_at:evidence.completed_at, evidence_refs:[evidence.evidence_ref], input_state_hash:sha256(JSON.stringify(inputState)), result_state_hash:sha256(JSON.stringify(resultState)), exceptions, verification_method:'deterministic_line_item_quantity_match', verifier:'aizoya-operator-deterministic-verifier-v1', created_at:iso(), schema_version:'var-v1', synthetic:true };
        receipt.receipt_hash=sha256(JSON.stringify(receipt));
        t.receipts[receipt.receipt_id]=receipt; w.verified_action_receipt_id=receipt.receipt_id; w.status='CLOSED'; w.updated_at=iso(); w.version++;
        audit(t,ctx.actorId,'closeout.verified',{workflow_id:w.workflow_id,receipt_id:receipt.receipt_id});
        return { verification_result:'VERIFIED', exceptions:[], action_receipt_id:receipt.receipt_id, receipt_hash:receipt.receipt_hash, synthetic:true };
      });
      store.writeTenant(ctx.tenantId,t); return result;
    },
    getActionReceipt(ctx,args){ const t=tenant(store,ctx.tenantId); const r=t.receipts[args.receipt_id]; if(!r) throw fail('RECEIPT_NOT_FOUND'); return structuredClone(r); }
  };
}
