import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JsonStateStore } from './store.js';
import { createOperations } from './domain.js';
import { createMcp, PROTOCOL_VERSION } from './mcp.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const statePath=process.env.AIZOYA_STATE_PATH??path.join(here,'..','.data','state.json');
const fixturePath=process.env.AIZOYA_FIXTURE_PATH??path.join(here,'..','fixtures','lbk-saturday.json');
const allowedOrigins=(process.env.AIZOYA_ALLOWED_ORIGINS??'http://127.0.0.1:8787,http://localhost:8787,http://127.0.0.1:3000,http://localhost:3000').split(',');
const mcp=createMcp({operations:createOperations({store:new JsonStateStore(statePath),fixturePath})});
const json=(res,status,body,headers={})=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8',...headers});res.end(body===null?'':JSON.stringify(body));};
const contextFrom=(req)=>{
  const tenantId=req.headers['x-aizoya-tenant-id']; const actorId=req.headers['x-aizoya-actor-id']; const role=req.headers['x-aizoya-role'];
  if(!tenantId||!actorId||!role) return null;
  if(!['OWNER','MANAGER','STAFF','SYSTEM'].includes(role)) return null;
  return {tenantId:String(tenantId),actorId:String(actorId),role:String(role)};
};

export function buildServer(){ return http.createServer(async(req,res)=>{
  const staticFiles={'/':'index.html','/app.js':'app.js','/styles.css':'styles.css'};
  if(req.method==='GET' && req.url==='/health') return json(res,200,{status:'ok',protocol:PROTOCOL_VERSION,mode:'synthetic'});
  if(req.method==='GET' && staticFiles[req.url]) { const file=path.join(here,'..','web',staticFiles[req.url]); const type=req.url.endsWith('.js')?'text/javascript; charset=utf-8':req.url.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8'; res.writeHead(200,{'content-type':type,'cache-control':'no-store'}); return res.end(fs.readFileSync(file)); }
  if(req.url!=='/mcp') return json(res,404,{error:'NOT_FOUND'});
  const origin=req.headers.origin;
  if(origin && !allowedOrigins.includes(origin)) return json(res,403,{error:'ORIGIN_DENIED'});
  if(req.method==='GET'){ res.writeHead(405,{'allow':'POST','content-type':'application/json'}); return res.end(JSON.stringify({error:'SSE_NOT_ENABLED'})); }
  if(req.method!=='POST') return json(res,405,{error:'METHOD_NOT_ALLOWED'},{allow:'POST, GET'});
  let raw=''; for await(const chunk of req) raw+=chunk; let body; try{body=JSON.parse(raw);}catch{return json(res,400,{error:'INVALID_JSON'});}
  if(body.method==='initialize'){
    const init=mcp.initialize(body); return json(res,200,init.body,{'mcp-protocol-version':PROTOCOL_VERSION,'mcp-session-id':init.sessionId});
  }
  const protocol=req.headers['mcp-protocol-version']; if(protocol!==PROTOCOL_VERSION) return json(res,400,{error:'UNSUPPORTED_PROTOCOL_VERSION'});
  const session=req.headers['mcp-session-id']; if(!session||!mcp.hasSession(String(session))) return json(res,404,{error:'MCP_SESSION_NOT_FOUND'});
  if(body.method==='notifications/initialized'){ res.writeHead(202); return res.end(); }
  const ctx=contextFrom(req); if(!ctx) return json(res,401,{error:'AUTH_CONTEXT_REQUIRED'});
  const response=await mcp.handle(body,ctx); if(response===null){res.writeHead(202);return res.end();}
  return json(res,200,response,{'mcp-protocol-version':PROTOCOL_VERSION,'mcp-session-id':String(session)});
}); }

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const host=process.env.HOST??'127.0.0.1'; const port=Number(process.env.PORT??8787); buildServer().listen(port,host,()=>console.log(`AIZOYA Operator MCP listening on http://${host}:${port}/mcp (synthetic MVP)`));
}
