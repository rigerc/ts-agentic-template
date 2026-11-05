import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {extractProps,inferType,generateTermcnSchemas} from '../scripts/termcn-schema.mjs';
import {generateMockups,renderSnapshot} from '../scripts/mockup.mjs';
import {validateVisual} from '../scripts/validate-visual.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixtures=path.join(root,'assets','termcn-fixtures','registry.json');
function project(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tui-termcn-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const out=path.join(dir,'docs/plans/generated/tui/example-task-tracker');fs.mkdirSync(out,{recursive:true});fs.cpSync(path.join(root,'examples/example-task-tracker'),out,{recursive:true});return {dir,out};}
test('termcn prop parser extracts serializable props and callbacks without inventing unknown schemas',()=>{
 const props=extractProps(['export interface FancyProps { title: string; optional?: boolean; action?: (s: string) => void; choices?: "a" | "b"; foreign?: React.ReactNode; position?: {x: number; y: number}; }']);
 assert.equal(props[0].properties.title.type,'string');assert.deepEqual(props[0].properties.choices.enum,['a','b']);
 assert.deepEqual(props[0].events.map(x=>x.name),['action']);assert.deepEqual(props[0].unresolved.map(x=>x.name),['foreign']);
 assert.deepEqual(props[0].properties.position.required,['x','y']);assert.deepEqual(props[0].required,['title']);
 assert.equal(inferType('totallyUnknownType'),null);
});
test('termcn registry fixture produces Ink and OpenTUI JSON Schemas and provenance hashes',async t=>{
 const {dir,out}=project(t);
 const result=await generateTermcnSchemas({repoRoot:dir,feature:'example-task-tracker',registry:fixtures,components:['ink/text-input','ink/checkbox','opentui/text-input'],strict:true});
 assert.equal(result.catalog.components.length,3);assert.deepEqual(result.catalog.warnings,[]);
 const ink=JSON.parse(fs.readFileSync(path.join(out,'components.schemas/ink--text-input.schema.json')));
 assert.equal(ink.properties.disabled.type,'boolean');assert.equal(ink.properties.borderStyle.enum.includes('singleDouble'),true);
 assert.equal(ink.properties.cursorOrigin.required.includes('x'),true);
 assert.equal(ink['x-termcn'].callbacks.some(x=>x.name==='onSubmit'),true);
 assert.equal(ink.properties.onSubmit,undefined);
 assert.match(result.catalog.components[0].source_sha256,/^[a-f0-9]{64}$/);
 assert.deepEqual(validateVisual(dir,'example-task-tracker'),{errors:[],warnings:[]});
 const second=await generateTermcnSchemas({repoRoot:dir,feature:'example-task-tracker',registry:fixtures,components:['ink/text-input','ink/checkbox','opentui/text-input'],strict:true});
 assert.equal(JSON.stringify(second.catalog),JSON.stringify(result.catalog));
});
test('mockup generator renders all states, transitions, SVG/TXT files, and offline interactive HTML',async t=>{
 const {dir,out}=project(t);
 await generateTermcnSchemas({repoRoot:dir,feature:'example-task-tracker',registry:fixtures,components:['ink/text-input']});
 const result=generateMockups({repoRoot:dir,feature:'example-task-tracker',cols:80,rows:24,theme:'ocean'});
 assert.equal(result.state_count,9);assert.equal(result.transition_count,21);assert.equal(result.items.length,9);
 const invalid=fs.readFileSync(path.join(out,'mockups/create.invalid.txt'),'utf8');
 const saving=fs.readFileSync(path.join(out,'mockups/create.saving.txt'),'utf8');
 assert.match(invalid,/Title is required/);assert.match(saving,/disabled/);assert.match(saving,/Saving task/);
 assert.match(saving,/\[ Cancel \]/);assert.doesNotMatch(saving,/\( Cancel \)/);
 const svg=fs.readFileSync(path.join(out,'mockups/create.invalid.svg'),'utf8');assert.match(svg,/^<svg /);assert.match(svg,/Title is required/);
 const html=fs.readFileSync(result.html,'utf8');assert.match(html,/Screen-flow storyboard/);assert.match(html,/data-transition="start-create"/);
 assert.match(html,/data-state="exit.done"/);assert.match(html,/const MODEL=/);
 assert.equal(result.mapping_warnings.length,0);
 const again=generateMockups({repoRoot:dir,feature:'example-task-tracker',cols:80,rows:24,theme:'ocean'});
 assert.equal(fs.readFileSync(again.html,'utf8'),html);
 assert.deepEqual(validateVisual(dir,'example-task-tracker'),{errors:[],warnings:[]});
});
test('unsupported viewport is reported, rather than being presented as compatible',t=>{
 const screen={title:'Demo',id:'demo',min_size:{cols:60,rows:20},regions:[],keybindings:[]};const state={id:'demo.edit',screen:'demo',description:'Edit',terminal:false};
 const mock=renderSnapshot(screen,state,{}, {cols:40,rows:12});
 assert.equal(mock.lines.length,12);assert.equal(mock.warnings.some(w=>w.includes('Below declared minimum')),true);
});
test('unknown state fixture and component mappings are detected',t=>{
 const {dir,out}=project(t);
 const scenarios=JSON.parse(fs.readFileSync(path.join(out,'scenarios.json')));scenarios.states['missing.state']={focus:'x'};
 scenarios.states['create.edit'].components['missing-component']={text:'x'};
 fs.writeFileSync(path.join(out,'scenarios.json'),JSON.stringify(scenarios));
 const result=validateVisual(dir,'example-task-tracker');assert.ok(result.errors.length>=2);
 assert.ok(result.errors.some(e=>e.includes('missing.state')));
 assert.ok(result.errors.some(e=>e.includes('missing-component')));
});
test('string input is escaped in generated HTML and SVG',t=>{
 const {dir,out}=project(t);
 const scenarios=JSON.parse(fs.readFileSync(path.join(out,'scenarios.json')));
 scenarios.states['create.invalid'].state.error_message='</script><img src=x onerror=alert(1)>';
 fs.writeFileSync(path.join(out,'scenarios.json'),JSON.stringify(scenarios));
 generateMockups({repoRoot:dir,feature:'example-task-tracker'});
 const html=fs.readFileSync(path.join(out,'storyboard.html'),'utf8');
 assert.equal(html.includes('</script><img src=x onerror=alert(1)>'),false);
 assert.match(html,/&lt;\/script&gt;/);
 const svg=fs.readFileSync(path.join(out,'mockups/create.invalid.svg'),'utf8');assert.match(svg,/&lt;\/script&gt;/);
});
test('CLI build integrates storyboard generation without changing the existing feature validation',t=>{
 const {dir,out}=project(t);
 const output=execFileSync(process.execPath,[path.join(root,'scripts/tui.mjs'),'build','--repo-root',dir,'--feature','example-task-tracker','--strict'],{encoding:'utf8'});
 assert.match(output,/STORYBOARD:/);assert.ok(fs.existsSync(path.join(out,'contracts-viewer.html')));
 assert.ok(fs.existsSync(path.join(out,'storyboard.html')));
});
