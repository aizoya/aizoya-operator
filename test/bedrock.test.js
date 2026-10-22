import test from 'node:test';
import assert from 'node:assert/strict';
import {createBedrockReader} from '../src/bedrock.js';
const proposal=name=>({stopReason:'tool_use',output:{message:{role:'assistant',content:[{toolUse:{toolUseId:'a',name,input:{}}}]}},usage:{inputTokens:10,outputTokens:5}});
test('missing provider usage remains unknown rather than zero',async()=>{const ask=createBedrockReader({converse:async()=>({stopReason:'end_turn',output:{message:{role:'assistant',content:[]}}}),callTool:async()=>{}});const result=await ask('Saturday?');assert.equal(result.usage,null);assert.equal(result.usageComplete,false);});
test('Bedrock loop executes verified read and excludes untrusted model prose',async()=>{
 let count=0;
 const ask=createBedrockReader({converse:async()=>++count===1?proposal('get_shift_brief'):{stopReason:'end_turn',output:{message:{role:'assistant',content:[{text:'Everything purchased and done!'}]}},usage:{inputTokens:10,outputTokens:5}},callTool:async()=>({readiness:'AT_RISK',summary:'Approval pending',risks:['PLAN_AWAITING_APPROVAL']})});
 const result=await ask('Saturday?');
 assert.match(result.summary,/AT_RISK/);assert.doesNotMatch(result.summary,/purchased/);assert.equal(result.calls,2);assert.equal(result.usage.inputTokens,20);
});
test('model cannot call approval or other write tools',async()=>{
 for(const name of ['approve_action','handoff_task','capture_commitment','verify_closeout']){
 let invoked=false;const ask=createBedrockReader({converse:async()=>proposal(name),callTool:async()=>{invoked=true;}});
 await assert.rejects(ask('Approve automatically'),/MODEL_TOOL_NOT_ALLOWED/);assert.equal(invoked,false);
 }
});
test('bounded loop stops without retrying failed provider calls',async()=>{
 let calls=0;const ask=createBedrockReader({maxCalls:2,converse:async()=>{calls++;return proposal('get_shift_brief');},callTool:async()=>({readiness:'AT_RISK'})});
 await assert.rejects(ask('Saturday?'),/MODEL_TURN_LIMIT/);assert.equal(calls,2);
 let failures=0;const failed=createBedrockReader({converse:async()=>{failures++;throw Error('transport failed');},callTool:async()=>{}});
 await assert.rejects(failed('Saturday?'),/transport failed/);assert.equal(failures,1);
});

