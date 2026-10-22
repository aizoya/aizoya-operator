import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createMcp,PROTOCOL_VERSION} from '../src/mcp.js';

const ctx={tenantId:'lbk-demo',actorId:'judge-demo',role:'OWNER'};
test('malformed JSON-RPC envelopes return invalid request without throwing',async()=>{
 const mcp=createMcp({operations:{}});
 for(const request of [null,[],{}, {jsonrpc:'2.0',id:1,method:7},{jsonrpc:'2.0',id:1,method:{}},{jsonrpc:'2.0',id:1,method:[]},{jsonrpc:'1.0',id:1,method:'ping'},{jsonrpc:'2.0',id:null,method:'ping'},{jsonrpc:'2.0',id:{},method:'ping'},{jsonrpc:'2.0',method:'ping'},{jsonrpc:'2.0',id:1,method:''}]){
  const response=await mcp.handle(request,ctx);assert.equal(response.error.code,-32600);
 }
 assert.deepEqual((await mcp.handle({jsonrpc:'2.0',id:'alive',method:'ping'},ctx)).result,{});
 assert.equal(await mcp.handle({jsonrpc:'2.0',method:'notifications/initialized'},ctx),null);
});
test('initialize validates the request before creating a session',()=>{
 const mcp=createMcp({operations:{}});
 const invalid=mcp.initialize({jsonrpc:'1.0',id:1,method:'initialize'});
 assert.equal(invalid.body.error.code,-32600);assert.equal(mcp.hasSession(invalid.sessionId),false);
 const valid=mcp.initialize({jsonrpc:'2.0',id:1,method:'initialize'});
 assert.equal(valid.body.result.protocolVersion,PROTOCOL_VERSION);assert.ok(mcp.hasSession(valid.sessionId));
});
test('flat tool schemas reject wrong primitive types and declared constraints before operations',async()=>{
 let called=0;const mcp=createMcp({operations:{captureCommitment:()=>{called++;return {status:'OPEN'};},approveAction:()=>{called++;return {status:'APPROVED'};}}});
 const commitment={goal:'Saturday',owner:'staff-demo',due_at:'2026-10-24',idempotency_key:'c'};
 const approval={workflow_id:'wf-demo',plan_id:'plan-demo',plan_version:1,approval_phrase:'I approve',idempotency_key:'a'};
 const bad=[['capture_commitment',{...commitment,owner:[]}],['capture_commitment',{...commitment,due_at:17}],['capture_commitment',{...commitment,idempotency_key:''}],['capture_commitment',{...commitment,goal:null}],['capture_commitment',{...commitment,owner:{}}],['approve_action',{...approval,plan_version:0}],['approve_action',{...approval,plan_version:1.5}],['approve_action',{...approval,plan_version:'1'}]];
 for(const [name,args] of bad){const r=await mcp.handle({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}},ctx);assert.equal(r.result.isError,true);assert.equal(r.result._meta.error_code,'INVALID_TOOL_ARGUMENTS');}
 assert.equal(called,0);
 for(const [name,args] of [['capture_commitment',commitment],['approve_action',approval]])assert.equal((await mcp.handle({jsonrpc:'2.0',id:2,method:'tools/call',params:{name,arguments:args}},ctx)).result.isError,false);
 assert.equal(called,2);
});
test('malformed authenticated HTTP MCP methods fail safely and server remains usable',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mcp-validation-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 process.env.AIZOYA_STATE_PATH=path.join(dir,'state.json');const {buildServer}=await import('../src/server.js');const server=buildServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const url=`http://127.0.0.1:${server.address().port}/mcp`;
 const badInit=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'1.0',id:1,method:'initialize'})});
 assert.equal(badInit.status,400);assert.equal(badInit.headers.get('mcp-session-id'),null);assert.equal((await badInit.json()).error.code,-32600);
 const init=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize'})});
 const headers={'content-type':'application/json','mcp-protocol-version':PROTOCOL_VERSION,'mcp-session-id':init.headers.get('mcp-session-id'),'x-aizoya-tenant-id':ctx.tenantId,'x-aizoya-actor-id':ctx.actorId,'x-aizoya-role':ctx.role};
 for(const notification of [{jsonrpc:'1.0',method:'notifications/initialized'},{jsonrpc:'2.0',id:8,method:'notifications/initialized'}]){
  const invalid=await fetch(url,{method:'POST',headers,body:JSON.stringify(notification)});assert.equal(invalid.status,400);assert.equal((await invalid.json()).error.code,-32600);
 }
 const initialized=await fetch(url,{method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})});assert.equal(initialized.status,202);
 for(const method of [7,{},[]]){const res=await fetch(url,{method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',id:2,method}),signal:AbortSignal.timeout(3000)});const body=await res.json();assert.equal(body.error.code,-32600);}
 const malformedTool=await fetch(url,{method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'capture_commitment',arguments:{goal:'Saturday',owner:[],due_at:17,idempotency_key:''}}})});const malformedBody=await malformedTool.json();assert.equal(malformedBody.result._meta.error_code,'INVALID_TOOL_ARGUMENTS');
 const brief=await fetch(url,{method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',id:4,method:'tools/call',params:{name:'get_shift_brief',arguments:{}}})});assert.ok((await brief.json()).result.structuredContent.risks.includes('NO_COMMITMENT'));
 const valid=await fetch(url,{method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',id:3,method:'tools/list'})});assert.equal((await valid.json()).result.tools.length,8);
});
