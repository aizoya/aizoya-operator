import test from 'node:test';
import assert from 'node:assert/strict';
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
