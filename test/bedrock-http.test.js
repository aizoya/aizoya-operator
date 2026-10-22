import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createBedrockReader} from '../src/bedrock.js';

test('reader round trip uses actual Streamable HTTP server with fixed demo identity',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bedrock-http-'));
 process.env.AIZOYA_STATE_PATH=path.join(dir,'state.json');
 const {buildServer}=await import('../src/server.js');
 const server=buildServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try {
  const endpoint=`http://127.0.0.1:${server.address().port}/mcp`;
  const init=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-11-25'}})});
  const session=init.headers.get('mcp-session-id');assert.ok(session);
  let modelCalls=0;
  const reader=createBedrockReader({converse:async request=>{
   assert.deepEqual(request.toolConfig.tools.map(t=>t.toolSpec.name),['get_shift_brief','get_action_receipt']);
   if(++modelCalls===1)return {stopReason:'tool_use',output:{message:{role:'assistant',content:[{toolUse:{toolUseId:'read',name:'get_shift_brief',input:{}}}]}}};
   assert.equal(request.messages.at(-1).content[0].toolResult.status,'success');
   return {stopReason:'end_turn',output:{message:{role:'assistant',content:[{text:'untrusted prose'}]}}};
  },callTool:async(name,args)=>{
   const res=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','mcp-session-id':session,'mcp-protocol-version':'2025-11-25','x-aizoya-tenant-id':'lbk-demo','x-aizoya-actor-id':'reader-demo','x-aizoya-role':'OWNER'},body:JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/call',params:{name,arguments:args}})});
   const body=await res.json();assert.equal(res.status,200);assert.equal(body.result.isError,false);return body.result.structuredContent;
  }});
  const result=await reader('Are we ready for Saturday?');
  assert.equal(result.calls,2);assert.equal(result.results.length,1);assert.doesNotMatch(result.summary,/untrusted prose/);
  const unauth=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','mcp-session-id':session,'mcp-protocol-version':'2025-11-25'},body:JSON.stringify({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'get_shift_brief',arguments:{}}})});
  assert.equal(unauth.status,401);
 }finally{await new Promise(resolve=>server.close(resolve));fs.rmSync(dir,{recursive:true,force:true});}
});
