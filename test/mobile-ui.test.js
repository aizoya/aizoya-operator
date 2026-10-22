import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

async function setup(){
 const nodes=new Map(),calls=[];
 const node=()=>({textContent:'',disabled:false,hidden:false,children:[],listeners:{},appendChild(x){this.children.push(x);},scrollIntoView(){},addEventListener(type,fn){this.listeners[type]=fn;}});
 const document={querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},createElement:node};
 let wait=null;
 const fetch=async(_,opts)=>{const req=JSON.parse(opts.body);if(req.method==='initialize')return {ok:true,headers:{get:()=> 'demo-session'},json:async()=>({result:{}})};
  const name=req.params.name;calls.push(name);if(wait)await wait;
  const values={capture_commitment:{workflow_id:'wf-demo'},reconcile_inventory:{gaps:[1,2,3]},build_purchase_plan:{plan_id:'plan-demo',version:1,estimated_total:66,items:[{name:'Chicken thighs',quantity:12,unit:'lb',line_total:39},{name:'Plantains',quantity:24,unit:'each',line_total:18},{name:'Meal containers',quantity:20,unit:'each',line_total:9}]},approve_action:{status:'APPROVED'},handoff_task:{status:'HANDED_OFF'},get_shift_brief:{readiness:'AT_RISK',summary:'Evidence pending',risks:['AWAITING_CLOSEOUT_EVIDENCE']},verify_closeout:{verification_result:'VERIFIED',action_receipt_id:'var-demo'},get_action_receipt:{status:'VERIFIED',owner:'LBK staff demo',synthetic:true}};
  return {ok:true,json:async()=>({result:{structuredContent:values[name]}})};
 };
 await vm.runInNewContext(fs.readFileSync(new URL('../web/app.js',import.meta.url),'utf8'),{document,fetch,crypto,Intl});
 return {nodes,calls,click:id=>nodes.get(`#${id}`).listeners.click(),pause:()=>{let release;wait=new Promise(r=>release=r);return ()=>{wait=null;release();};}};
}
test('mobile demo shows line items, keeps decline safe, and summarizes evidence',async()=>{
 const ui=await setup();await ui.click('run');assert.equal(ui.nodes.get('#plan-items').children.length,3);assert.match(ui.nodes.get('#approval-summary').textContent,/66.00/);
 await ui.click('decline');assert.ok(!ui.calls.includes('approve_action'));assert.ok(!ui.calls.includes('handoff_task'));
 await ui.click('run');await ui.click('approve');assert.match(ui.nodes.get('#receipt-summary').textContent,/VERIFIED/);assert.match(ui.nodes.get('#receipt-summary').textContent,/No real purchase/);
 await ui.click('reset');assert.doesNotMatch(ui.nodes.get('#receipt-summary').textContent,/VERIFIED/);
});
test('rapid taps and reset cannot overlap active approval',async()=>{
 const ui=await setup();await ui.click('run');const release=ui.pause();const active=ui.click('approve');
 assert.equal(ui.nodes.get('#reset').disabled,true);assert.equal(ui.nodes.get('#run').disabled,true);
 await ui.click('approve');await ui.click('reset');assert.equal(ui.calls.filter(n=>n==='approve_action').length,1);
 release();await active;assert.equal(ui.nodes.get('#run').disabled,false);
});

