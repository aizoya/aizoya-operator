import crypto from 'node:crypto';
import { TOOL_DEFINITIONS } from './tools.js';

export const PROTOCOL_VERSION = '2025-11-25';
const sessions = new Set();
const ok=(id,result)=>({jsonrpc:'2.0',id,result});
const err=(id,code,message,data)=>({jsonrpc:'2.0',id,error:{code,message,...(data?{data}: {})}});

function validateArgs(def,args){
  if(!args || typeof args!=='object' || Array.isArray(args)) throw Object.assign(new Error('INVALID_TOOL_ARGUMENTS'),{code:'INVALID_TOOL_ARGUMENTS'});
  for(const name of def.inputSchema.required??[]) if(!(name in args)) throw Object.assign(new Error(`MISSING_ARGUMENT:${name}`),{code:'INVALID_TOOL_ARGUMENTS'});
  if(def.inputSchema.additionalProperties===false) for(const key of Object.keys(args)) if(!(key in def.inputSchema.properties)) throw Object.assign(new Error(`UNKNOWN_ARGUMENT:${key}`),{code:'INVALID_TOOL_ARGUMENTS'});
}

export function createMcp({operations}){
  return {
    initialize(request){ const sessionId=crypto.randomUUID(); sessions.add(sessionId); return { sessionId, body:ok(request.id,{protocolVersion:PROTOCOL_VERSION,capabilities:{tools:{listChanged:false}},serverInfo:{name:'aizoya-operator-alexa',version:'0.1.0'}}) }; },
    hasSession(id){ return sessions.has(id); },
    async handle(request,ctx){
      if(request.jsonrpc!=='2.0') return err(request.id??null,-32600,'Invalid Request');
      if(request.method==='ping') return ok(request.id,{});
      if(request.method==='tools/list') return ok(request.id,{tools:TOOL_DEFINITIONS});
      if(request.method==='tools/call'){
        const {name,arguments:args={}}=request.params??{}; const def=TOOL_DEFINITIONS.find(t=>t.name===name);
        if(!def) return err(request.id,-32602,'Unknown tool');
        try{
          validateArgs(def,args);
          const map={get_shift_brief:'getShiftBrief',capture_commitment:'captureCommitment',reconcile_inventory:'reconcileInventory',build_purchase_plan:'buildPurchasePlan',approve_action:'approveAction',handoff_task:'handoffTask',verify_closeout:'verifyCloseout',get_action_receipt:'getActionReceipt'};
          const result=operations[map[name]](ctx,args);
          return ok(request.id,{content:[{type:'text',text:JSON.stringify(result)}],structuredContent:result,isError:false});
        }catch(e){ return ok(request.id,{content:[{type:'text',text:e.code??e.message??'TOOL_ERROR'}],isError:true,_meta:{error_code:e.code??'TOOL_ERROR'}}); }
      }
      if(request.method?.startsWith('notifications/')) return null;
      return err(request.id??null,-32601,'Method not found');
    }
  };
}
