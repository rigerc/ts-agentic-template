/** Semantic component adapters. No third-party component runtime is loaded. */
import {safeText} from './canvas.mjs';
const printers=new Map();
const str=v=>v==null?'':typeof v==='object'?Array.isArray(v)?v.map(str).join(', '):JSON.stringify(v):String(v);
function stateData(ctx,node){return ctx.fixture.data?.[node.data_ref];}
function details(ctx,node){
 const label=node.label||node.id||node.kind;
 const override=ctx.fixture.components?.[node.id]||{};
 const props=ctx.design.componentProps?.[`${ctx.screen.id}/${node.id}`]||{};
 const style=ctx.preview.styles?.[`${ctx.screen.id}/${node.id}`]||{};
 return {label,override,props,style,focused:ctx.fixture.focus===node.id};
}
function linesFor(node,ctx){
 const {label,override,props,style,focused}=details(ctx,node),data=stateData(ctx,node),kind=node.kind;
 const rows=[];const add=(text,role='fg')=>rows.push({text:safeText(text),role});
 if(kind==='text'){
  const value=override.text??(node.data_ref?data:undefined);
  add(value===undefined?label:label+': '+str(value),style.role||'fg');
 }else if(kind==='list'){
  const items=override.items??data??[];const arr=Array.isArray(items)?items:[];
  add(label,'accent');
  if(!arr.length)add('  (no sample items)','muted');
  for(const [i,item] of arr.slice(0,style.maxItems??7).entries())add((i===(ctx.fixture.selectedIndex??0)?'  ▸ ':'    ')+(typeof item==='object'?(item.title||item.label||str(item)):str(item)),i===(ctx.fixture.selectedIndex??0)?'accent':'fg');
 }else if(kind==='input'){
  const value=override.value??ctx.fixture.state?.draft_title??props.defaultValue??'';
  const disabled=override.disabled??ctx.fixture.disabled??props.disabled??ctx.state.id.endsWith('.saving');
  const shown=str(value)||(props.placeholder?'‹'+str(props.placeholder)+'›':'');
  add(label+': '+(disabled?'[ '+shown+' ] (disabled)':focused?'⟦'+shown+'▌⟧':'[ '+shown+' ]'),focused?'accent':disabled?'muted':'fg');
 }else if(kind==='button'){
  const disabled=override.disabled??props.disabled??false;
  add((disabled?'( '+label+' )':'[ '+label+' ]')+(focused?' ◀':''),disabled?'muted':focused?'accent':'fg');
 }else if(kind==='status'){
  const error=ctx.fixture.presentation?.statusType!==undefined?ctx.fixture.presentation.statusType==='error':ctx.state.id.endsWith('.error')||ctx.state.id.endsWith('.invalid');
  const message=override.text??ctx.fixture.presentation?.statusText??(node.id.toLowerCase().includes('error')?ctx.fixture.state?.error_message:undefined)??(node.id.toLowerCase().includes('detail')?ctx.fixture.status:undefined);
  const meaningful=message||(!ctx.fixture.suppressDefaultStatus?ctx.state.description:null);
  if(meaningful)add((error?'! ':'· ')+str(meaningful),error?'error':'muted');
 }else if(kind==='checkbox'){
  const checked=override.checked??override.value??data??props.checked??false;
  add('['+(checked?'x':' ')+'] '+label,focused?'accent':'fg');
 }else if(kind==='select'){
  const value=override.value??data??props.value??props.placeholder??'Choose…';
  add(label+': [ '+str(value)+' ▾ ]',focused?'accent':'fg');
 }else if(kind==='table'){
  const arr=override.items??data??[];const items=Array.isArray(arr)?arr:[];
  const keys=(style.columns||props.columns||Object.keys(items.find(x=>x&&typeof x==='object'&&!Array.isArray(x))||{})).filter(x=>typeof x==='string');
  add(label,'accent');
  if(keys.length){add(keys.join(' │ '),'accent');add(keys.map(k=>'─'.repeat(Math.max(2,Math.min(12,k.length)))).join('─┼─'),'border');}
  if(!items.length)add('(no rows)','muted');
  for(const item of items.slice(0,style.maxItems??6))add(keys.length?keys.map(k=>str(item?.[k])).join(' │ '):str(item));
 }else if(kind==='dialog'){
  add('◆ '+label,'accent');
  add(override.text??str(data)??'','fg');
 }else{
  add('['+kind+': '+label+' — unsupported preview]','muted');
 }
 return rows;
}
for(const kind of ['text','list','input','button','status','checkbox','select','table','dialog'])printers.set(kind,linesFor);
/** Adapter signature: (node, context) => [{text, role}] */
export function registerMockupRenderer(kind,renderer){
 if(typeof kind!=='string'||!/^([a-z][a-z0-9-]*|(?:ink|opentui)\/[a-z0-9][a-z0-9-]*)$/.test(kind)||typeof renderer!=='function')throw new Error('Invalid mockup renderer');
 const before=printers.get(kind);printers.set(kind,renderer);
 return ()=>{if(before)printers.set(kind,before);else printers.delete(kind);};
}
export function renderComponent(node,ctx){
 const mapped=ctx.design?.componentMappings?.[node.kind];
 const fn=(mapped&&printers.get(mapped))||printers.get(node.kind)||linesFor;
 const rows=fn(node,ctx);
 if(!Array.isArray(rows)||rows.some(r=>typeof r?.text!=='string'||typeof r?.role!=='string'))throw new Error('Invalid mockup renderer result: '+node.kind);
 return rows;
}
