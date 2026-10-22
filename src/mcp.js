import crypto from 'node:crypto';
import { TOOL_DEFINITIONS } from './tools.js';

export const PROTOCOL_VERSION = '2025-11-25';
const sessions = new Set();
const ok=(id,result)=>({jsonrpc:'2.0',id,result});
const err=(id,code,message,data)=>({jsonrpc:'2.0',id,error:{code,message,...(data?{data}: {})}});
const validId=id=>typeof id==='string'||(typeof id==='number'&&Number.isFinite(id)&&Number.isInteger(id));
const responseId=request=>request&&validId(request.id)?request.id:null;
function validEnvelope(request){
  if(!request||typeof request!=='object'||Array.isArray(request)||request.jsonrpc!=='2.0'||typeof request.method!=='string'||!request.method.length)return false;
  const hasId=Object.hasOwn(request,'id');
  if(hasId?!validId(request.id):!request.method.startsWith('notifications/'))return false;
  if(request.method.startsWith('notifications/')&&hasId)return false;
  if(Object.hasOwn(request,'params')&&(!request.params||typeof request.params!=='object'||Array.isArray(request.params)))return false;
  return true;
}

function validateArgs(def,args){
  if(!args || typeof args!=='object' || Array.isArray(args)) throw Object.assign(new Error('INVALID_TOOL_ARGUMENTS'),{code:'INVALID_TOOL_ARGUMENTS'});
  for(const name of def.inputSchema.required??[]) if(!Object.hasOwn(args,name)) throw Object.assign(new Error(`MISSING_ARGUMENT:${name}`),{code:'INVALID_TOOL_ARGUMENTS'});
  for(const key of Object.keys(args)){
    if(!Object.hasOwn(def.inputSchema.properties,key)){
      if(def.inputSchema.additionalProperties===false)throw Object.assign(new Error(`UNKNOWN_ARGUMENT:${key}`),{code:'INVALID_TOOL_ARGUMENTS'});
      continue;
    }
    const schema=def.inputSchema.properties[key],value=args[key];
    const validType=schema.type==='integer'?Number.isInteger(value):schema.type==='number'?typeof value==='number'&&Number.isFinite(value):typeof value===schema.type;
    if(!validType||(schema.minLength!==undefined&&[...value].length<schema.minLength)||(schema.minimum!==undefined&&value<schema.minimum))throw Object.assign(new Error(`INVALID_ARGUMENT:${key}`),{code:'INVALID_TOOL_ARGUMENTS'});
  }
}

export function createMcp({operations}){
  return {
    initialize(request){ if(!validEnvelope(request)||request.method!=='initialize')return {sessionId:'',body:err(responseId(request),-32600,'Invalid Request')};const sessionId=crypto.randomUUID(); sessions.add(sessionId); return { sessionId, body:ok(request.id,{protocolVersion:PROTOCOL_VERSION,capabilities:{tools:{listChanged:false}},serverInfo:{name:'aizoya-operator-alexa',version:'0.1.0'}}) }; },
    hasSession(id){ return sessions.has(id); },
    async handle(request,ctx){
      if(!validEnvelope(request)) return err(responseId(request),-32600,'Invalid Request');
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

