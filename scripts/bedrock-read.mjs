import {createAwsConverse,createBedrockReader} from '../src/bedrock.js';
import {PROTOCOL_VERSION} from '../src/mcp.js';

// Local synthetic demo only. Identity is demo context, never production auth.
const endpoint='http://127.0.0.1:8787/mcp';
const prompt=process.argv.slice(2).join(' ');
if(!prompt) throw new Error('Usage: node scripts/bedrock-read.mjs "Are we ready for Saturday?"');
if(process.env.AIZOYA_BEDROCK_TEST_APPROVED!=='true') throw new Error('LIVE_TEST_APPROVAL_REQUIRED');
const converse=await createAwsConverse({region:process.env.AWS_REGION,modelId:process.env.AIZOYA_BEDROCK_MODEL});
let id=1;
const init=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:id++,method:'initialize',params:{protocolVersion:PROTOCOL_VERSION,capabilities:{},clientInfo:{name:'bedrock-reader',version:'0.1'}}}),signal:AbortSignal.timeout(10000)});
const initialized=await init.json();
const session=init.headers.get('mcp-session-id');
if(!init.ok||initialized.error||!session) throw new Error('MCP_INITIALIZATION_FAILED');
const ask=createBedrockReader({converse,callTool:async(name,args)=>{
 const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','mcp-protocol-version':PROTOCOL_VERSION,'mcp-session-id':session,'x-aizoya-tenant-id':'lbk-demo','x-aizoya-actor-id':'bedrock-reader-demo','x-aizoya-role':'OWNER'},body:JSON.stringify({jsonrpc:'2.0',id:id++,method:'tools/call',params:{name,arguments:args}}),signal:AbortSignal.timeout(10000)});
 const body=await response.json();
 if(!response.ok||body.error||body.result?.isError||!body.result?.structuredContent) throw new Error('MCP_TOOL_FAILED');
 return body.result.structuredContent;
}});
console.log(JSON.stringify(await ask(prompt),null,2));
