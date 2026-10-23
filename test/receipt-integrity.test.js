import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createOperations} from '../src/domain.js';
import {createMcp} from '../src/mcp.js';
import {createBedrockReader} from '../src/bedrock.js';

const ctx={tenantId:'receipt-demo',actorId:'owner-demo',role:'OWNER'};
function setup(){
 const tenants={};
 const store={readTenant:id=>structuredClone(tenants[id]??{workflows:{},receipts:{},idempotency:{},audit:[]}),writeTenant:(id,value)=>{tenants[id]=structuredClone(value);}};
 const operations=createOperations({store,fixturePath:new URL('../fixtures/lbk-saturday.json',import.meta.url)});
 const w=operations.captureCommitment(ctx,{goal:'Saturday',owner:'staff-demo',due_at:'2026-10-23',idempotency_key:'c'});
 operations.reconcileInventory(ctx,{workflow_id:w.workflow_id,idempotency_key:'i'});
 const p=operations.buildPurchasePlan(ctx,{workflow_id:w.workflow_id,idempotency_key:'p'});
 operations.approveAction(ctx,{workflow_id:w.workflow_id,plan_id:p.plan_id,plan_version:p.version,approval_phrase:'approve',idempotency_key:'a'});
 operations.handoffTask(ctx,{workflow_id:w.workflow_id,assignee:'staff-demo',due_at:'2026-10-23',idempotency_key:'h'});
 const closed=operations.verifyCloseout(ctx,{workflow_id:w.workflow_id,evidence_ref:'synthetic:receipt:lbk-sat-001',idempotency_key:'v'});
 return {operations,store,receiptId:closed.action_receipt_id};
}

test('synthetic closeout uses run time while retaining historical evidence time',()=>{
 const {operations,store,receiptId}=setup();
 const r=operations.getActionReceipt(ctx,{receipt_id:receiptId});
 const times=[r.requested_at,r.authorized_at,r.completed_at,r.created_at].map(Date.parse);
 assert.ok(times.every(Number.isFinite));
 assert.ok(times.every((v,i)=>i===0||v>=times[i-1]));
 assert.equal(r.evidence_completed_at,'2026-09-12T13:30:00-07:00');
 assert.equal(r.completion_basis,'synthetic_reconciliation');
 assert.equal(r.completed_at,r.created_at);
 assert.equal(operations.getShiftBrief(ctx).readiness,'READY');
 assert.equal(store.readTenant(ctx.tenantId).receipts[receiptId].evidence_completed_at,r.evidence_completed_at);
});

test('receipt with invalid chronology fails retrieval and readiness even with a matching hash',()=>{
 for(const change of [r=>{r.completed_at=r.evidence_completed_at??'2026-09-12T13:30:00-07:00';},r=>{r.authorized_at='invalid';},r=>{r.created_at='2000-01-01T00:00:00Z';}]){
  const {operations,store,receiptId}=setup();
  const state=store.readTenant(ctx.tenantId), r=state.receipts[receiptId];change(r);
  const body=Object.fromEntries(Object.entries(r).filter(([key])=>key!=='receipt_hash'));
  r.receipt_hash=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  store.writeTenant(ctx.tenantId,state);
  assert.equal(operations.getShiftBrief(ctx).readiness,'AT_RISK');
  assert.throws(()=>operations.getActionReceipt(ctx,{receipt_id:receiptId}),{code:'RECEIPT_INTEGRITY_FAILED'});
 }
});

test('receipt retrieval rejects modified evidence and mismatched identity',()=>{
 for(const corrupt of [r=>{r.owner='TAMPERED OWNER';},r=>{r.receipt_hash='invalid';},r=>{r.synthetic=false;},r=>{r.tenant_id='other-tenant';},r=>{r.receipt_id='other-receipt';}]){
  const {operations,store,receiptId}=setup();
  assert.equal(operations.getActionReceipt(ctx,{receipt_id:receiptId}).status,'VERIFIED');
  const state=store.readTenant(ctx.tenantId);corrupt(state.receipts[receiptId]);store.writeTenant(ctx.tenantId,state);
  assert.equal(operations.getShiftBrief(ctx).readiness,'AT_RISK');
  assert.throws(()=>operations.getActionReceipt(ctx,{receipt_id:receiptId}),{code:'RECEIPT_INTEGRITY_FAILED'});
 }
});

test('Bedrock read loop cannot summarize a tampered receipt as verified',async()=>{
 const {operations,store,receiptId}=setup();const state=store.readTenant(ctx.tenantId);state.receipts[receiptId].owner='TAMPERED OWNER';store.writeTenant(ctx.tenantId,state);
 const mcp=createMcp({operations});let modelCalls=0;
 const ask=createBedrockReader({converse:async()=>{modelCalls++;return modelCalls===1?{stopReason:'tool_use',output:{message:{role:'assistant',content:[{toolUse:{toolUseId:'receipt-read',name:'get_action_receipt',input:{receipt_id:receiptId}}}]}}}:{stopReason:'end_turn',output:{message:{role:'assistant',content:[]}}};},callTool:async(name,args)=>{
  const response=await mcp.handle({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}},ctx);
  if(response.error||response.result?.isError)throw Error(response.result?._meta?.error_code??'MCP_TOOL_FAILED');
  return response.result.structuredContent;
 }});
 await assert.rejects(ask('Check this receipt'),/RECEIPT_INTEGRITY_FAILED/);assert.equal(modelCalls,1);
});
