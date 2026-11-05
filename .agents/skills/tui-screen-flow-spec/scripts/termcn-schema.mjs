#!/usr/bin/env node
/** Import shadcn/termcn registry items and derive conservative, JSON-serializable prop schemas.
 * Offline with a local registry mirror; HTTPS termcn.dev with explicit --registry URL.
 * Unsupported TypeScript is reported, never silently assigned an unrestricted schema.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {featureDir,resolveRepoRoot,requireFeature,parseArgs} from './generate-html.mjs';

const sha = x => crypto.createHash('sha256').update(x).digest('hex');
const safeName = s => {if(!/^(ink|opentui)\/[a-z0-9][a-z0-9-]*$/.test(s))throw new Error('Unsafe or unsupported registry item: '+s);return s;};
const idFile = s => s.replace('/','--');
const sourceLabel = s => s.startsWith('https://')?s:'local:'+path.basename(s);
const slugPart = s => s.split('/')[1];
const allowedOrigin = 'https://termcn.dev';

async function readJSON(location){
  if(/^https?:\/\//.test(location)){
    const u=new URL(location);
    if(u.origin!==allowedOrigin)throw new Error('Remote registry must use '+allowedOrigin);
    const resp=await fetch(u,{redirect:'error',signal:AbortSignal.timeout(12000)});
    if(!resp.ok)throw new Error('Registry HTTP '+resp.status+' at '+u);
    const body=await resp.text();if(body.length>4_000_000)throw new Error('Registry item too large');
    return {value:JSON.parse(body),bytes:body,source:u.toString()};
  }
  if(fs.lstatSync(location).isSymbolicLink())throw new Error('Refusing symlinked registry source: '+location);
  const body=fs.readFileSync(location,'utf8');
  if(body.length>4_000_000)throw new Error('Registry item too large');
  return {value:JSON.parse(body),bytes:body,source:path.resolve(location)};
}
async function registryItem(name,source){
  if(source.startsWith('https://'))return readJSON(`${allowedOrigin}/r/${safeName(name)}.json`);
  const base=fs.statSync(source).isDirectory()?source:path.dirname(source);
  const candidate=path.join(base,...safeName(name).split('/'))+'.json';
  if(!fs.existsSync(candidate))throw new Error('Missing registry item '+name+' at '+candidate+'; supply a mirror with r/ink/*.json');
  return readJSON(candidate);
}
function stripComments(s){return s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');}
function extractBalanced(source,start,open='{',close='}'){
  let depth=0,quote=null,esc=false;
  for(let i=start;i<source.length;i++){
    const c=source[i];if(quote){if(esc){esc=false;continue;}if(c==='\\'){esc=true;continue;}if(c===quote)quote=null;continue;}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
    if(c===open)depth++;if(c===close){depth--;if(depth===0)return {body:source.slice(start+1,i),end:i+1};}
  }
  return null;
}
function splitTop(text,separator){
  const result=[];let last=0,round=0,curly=0,square=0,angle=0,quote=null;
  for(let i=0;i<text.length;i++){
    const c=text[i];if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote=null;continue;}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
    if(c==='(')round++;else if(c===')')round--;else if(c==='{')curly++;else if(c==='}')curly--;else if(c==='[')square++;else if(c===']')square--;else if(c==='<')angle++;else if(c==='>')angle=Math.max(0,angle-1);
    if(c===separator&&round===0&&curly===0&&square===0&&angle===0){result.push(text.slice(last,i).trim());last=i+1;}
  }result.push(text.slice(last).trim());return result.filter(Boolean);
}
function getTypeAliases(sources){
  const map=new Map();for(const source of sources){const clean=stripComments(source);
    const re=/\bexport\s+type\s+([A-Za-z][\w]*)\s*=\s*([\s\S]*?);/g;let m;
    while((m=re.exec(clean)))map.set(m[1],m[2].trim());
  }return map;
}
function inferType(input,aliases=new Map(),depth=0){
  const t=input.trim().replace(/\s+/g,' ');
  if(depth>5)return null;
  const u=aliases.get(t);if(u)return inferType(u,aliases,depth+1);
  if(/=>/.test(t))return {event:true};
  const parts=splitTop(t,'|');
  if(parts.length>1){const schemas=parts.map(p=>inferType(p,aliases,depth+1));if(schemas.some(x=>!x||x.event))return null;
    if(schemas.every(x=>Object.keys(x).length===1&&x.const!==undefined))return {enum:schemas.map(x=>x.const)};
    return {anyOf:schemas};}
  if(t==='string')return {type:'string'};if(t==='number')return {type:'number'};
  if(t==='boolean')return {type:'boolean'};if(t==='null')return {type:'null'};
  if(t==='true'||t==='false')return {const:t==='true'};
  if(/^['"].*['"]$/.test(t))return {const:t.slice(1,-1)};
  if(/^-?\d+(\.\d+)?$/.test(t))return {const:Number(t)};
  if(t.endsWith('[]')){const inner=inferType(t.slice(0,-2),aliases,depth+1);return inner&&!inner.event?{type:'array',items:inner}:null;}
  if(/^Array<.*>$/.test(t)){const inner=inferType(t.slice(6,-1),aliases,depth+1);return inner&&!inner.event?{type:'array',items:inner}:null;}
  if(t.startsWith('{')&&t.endsWith('}')){
    const block=parseFields(t.slice(1,-1),aliases);
    if(block.unresolved.length||block.events.length)return null;
    return {type:'object',properties:block.properties,additionalProperties:false,...(block.required.length?{required:block.required}:{})};
  }
  return null;
}
function parseFields(raw,aliases){
  const properties={},events=[],unresolved=[],required=[];
  for(const field of splitTop(stripComments(raw),';')){
    const match=/^(?:readonly\s+)?(?:(['"])(.*?)\1|([A-Za-z_$][\w$-]*))\s*(\?)?\s*:\s*([\s\S]+)$/.exec(field);
    if(!match){unresolved.push({name:'<syntax>',type:field.slice(0,200),reason:'unsupported field syntax'});continue;}
    const name=match[2]||match[3],type=match[5].trim(),optional=!!match[4];
    const inferred=inferType(type,aliases);
    if(inferred?.event){events.push({name,typescript:type});continue;}
    if(!inferred){unresolved.push({name,typescript:type,reason:'unresolved or nonserializable TypeScript type'});continue;}
    properties[name]=inferred;if(!optional)required.push(name);
  }
  return {properties,events,unresolved,required};
}
function extractProps(contents,extraSources=[]){
  const aliases=getTypeAliases([...contents,...extraSources]);
  const output=[];
  for(const source of contents){const clean=stripComments(source);
    const re=/\bexport\s+(?:interface\s+([A-Za-z_$][\w$]*)|type\s+([A-Za-z_$][\w$]*)\s*=)\s*([^{};]*)\{/g;let m;
    while((m=re.exec(clean))){const name=m[1]||m[2];if(!/Props$/.test(name))continue;
      const braceAt=re.lastIndex-1;const block=extractBalanced(clean,braceAt);if(!block)continue;
      const fields=parseFields(block.body,aliases);
      const inherited=m[3]?.match(/extends\s+([\w.,<>\s]+)/)?.[1]?.trim();
      if(inherited)fields.unresolved.push({name:'<extends>',typescript:inherited,reason:'inherited props not expanded'});
      output.push({interface:name,...fields});re.lastIndex=block.end;
    }
  }
  return output;
}
function ensureSafeWrite(dir,file){
  let current=path.join(dir,file);while(current.startsWith(dir+path.sep)){
    if(fs.existsSync(current)&&fs.lstatSync(current).isSymbolicLink())throw new Error('Refusing symlink output: '+current);
    current=path.dirname(current);
  }
}
function writeJson(dir,name,data){ensureSafeWrite(dir,name);fs.writeFileSync(path.join(dir,name),JSON.stringify(data,null,2)+'\n');}
export async function generateTermcnSchemas({repoRoot,feature,registry,components,limit=100,strict=false,extraTypes=[]}){
  const dir=featureDir(repoRoot,requireFeature(feature));
  if(!fs.existsSync(dir))throw new Error('Feature directory missing: '+dir);
  const source=registry||'https://termcn.dev/r/registry.json';
  const src=source.startsWith('https://')?source:path.resolve(source);
  const indexPath=!source.startsWith('https://')&&fs.existsSync(src)&&fs.statSync(src).isDirectory()?path.join(src,'registry.json'):src;
  const index=await readJSON(indexPath);
  const entries=Array.isArray(index.value.items)?index.value.items:[index.value];
  const available=new Map(entries.map(e=>[e.name,e]));
  const selected=components?.length?components:entries.filter(e=>e.type==='registry:ui'&&/^(ink|opentui)\//.test(e.name)).slice(0,limit).map(e=>e.name);
  if(!Number.isInteger(limit)||limit<1||limit>500)throw new Error('limit must be 1-500');
  if(selected.length>limit)throw new Error('Requested components exceed --limit '+limit);
  const candidates=[],typeSources=[];
  for(const name of selected){safeName(name);if(!available.has(name))throw new Error('Component absent from registry index: '+name);
    const item=await registryItem(name,indexPath);
    if(item.value.name!==name)throw new Error('Mismatched registry item: '+name);
    const sources=(item.value.files||[]).filter(f=>/\.[tj]sx?$/.test(f.path||'')&&typeof f.content==='string').map(f=>f.content);
    candidates.push({name,item:item.value,sha256:sha(item.bytes),source:item.source,sources});
  }
  for(const p of extraTypes){typeSources.push(fs.readFileSync(path.resolve(p),'utf8'));}
  // Include matching registry types when bundled locally; remote imports can supply --types.
  for(const target of new Set(selected.map(s=>s.split('/')[0]))){
    try{const item=await registryItem(target+'/types',indexPath);typeSources.push(...(item.value.files||[]).map(f=>f.content).filter(s=>typeof s==='string'));}catch{ /* optional */ }
  }
  const targetDir=path.join(dir,'components.schemas');
  if(fs.existsSync(targetDir)&&fs.lstatSync(targetDir).isSymbolicLink())throw new Error('Refusing symlink schema folder');
  fs.mkdirSync(targetDir,{recursive:true});
  const catalog={schema_version:'1.0.0',generator:'termcn-schema-v1',registry_source:sourceLabel(index.source),registry_sha256:sha(index.bytes),components:[],warnings:[]};
  for(const c of candidates){
    const props=extractProps(c.sources,typeSources);
    const candidate=props.find(p=>p.interface.toLowerCase()===slugPart(c.name).replace(/-([a-z])/g,(_,x)=>x.toUpperCase()).toLowerCase()+'props')||props[0];
    if(!candidate){catalog.warnings.push(c.name+': no exported Props interface found');if(strict)throw new Error('No exported Props interface for '+c.name);}
    if(candidate?.unresolved.length){catalog.warnings.push(c.name+': '+candidate.unresolved.length+' unresolved fields');if(strict)throw new Error('Unresolved TypeScript props in '+c.name+': '+candidate.unresolved.map(x=>x.name).join(', '));}
    const schema={$schema:'https://json-schema.org/draft/2020-12/schema',$id:'urn:tui:termcn:'+c.name.replace('/',':'),title:c.item.title||c.name,description:c.item.description||'',type:'object',additionalProperties:false,properties:candidate?.properties||{},...(candidate?.required.length?{required:candidate.required}:{}),'x-termcn':{registry_name:c.name,props_interface:candidate?.interface||null,callbacks:candidate?.events||[],unresolved_props:candidate?.unresolved||[],source_sha256:c.sha256,source:sourceLabel(c.source)}};
    const file=idFile(c.name)+'.schema.json';writeJson(targetDir,file,schema);
    catalog.components.push({name:c.name,title:c.item.title||c.name,description:c.item.description||'',target:c.name.split('/')[0],registry_type:c.item.type,schema:'components.schemas/'+file,props:Object.keys(schema.properties).length,events:candidate?.events.map(e=>e.name)||[],unresolved:candidate?.unresolved.map(e=>e.name)||[],dependencies:c.item.dependencies||[],registry_dependencies:c.item.registryDependencies||[],source_sha256:c.sha256});
  }
  writeJson(dir,'components.catalog.json',catalog);
  const manifestFile=path.join(dir,'manifest.json');if(fs.existsSync(manifestFile)){
    const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));if(!Array.isArray(manifest.files))throw new Error('Invalid manifest.files');
    manifest.files=[...new Set([...manifest.files,'components.catalog.json'])].sort();
    ensureSafeWrite(dir,'manifest.json');fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
  }
  return {path:path.join(dir,'components.catalog.json'),catalog};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const argv=parseArgs(process.argv.slice(2));const r=await generateTermcnSchemas({repoRoot:resolveRepoRoot(argv['repo-root']),feature:argv.feature,registry:argv.registry,components:argv.components?.split(',').map(s=>s.trim()),limit:argv.limit?Number(argv.limit):100,strict:!!argv.strict,extraTypes:argv.types?[argv.types]:[]});console.log('Generated '+r.catalog.components.length+' component schemas: '+r.path);for(const w of r.catalog.warnings)console.warn('WARN '+w);}catch(e){console.error('Error: '+e.message);process.exitCode=1;}
}
export {extractProps,inferType,parseFields};
