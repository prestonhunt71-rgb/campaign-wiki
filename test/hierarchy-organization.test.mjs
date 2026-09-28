import test from 'node:test';
import assert from 'node:assert/strict';
import {buildIndex, searchIndex, matchTerms} from '../modules/hero-rulebook/scripts/hierarchy-core.js';
import {changeOrganization, organizedIndex, emptyOrganization} from '../modules/hero-rulebook/scripts/hierarchy-organization.js';
const source=()=>buildIndex({sections:[{heading:'Powers',text:'Powers prose',sections:[{heading:'Zulu',text:'Zulu prose'},{heading:'Alpha',text:'Alpha prose',sections:[{heading:'Subsection',text:'Retained'}]}]},{heading:'Other',text:'Zulu Alpha'}]});
test('initial view keeps every section and uses source order until manually changed without changing source',()=>{
 const base=source(), original=JSON.stringify(base.rows.map(r=>r.section));const i=organizedIndex(base);
 assert.equal(i.rows.length,5);assert.deepEqual(i.byRoute.get('/rules/powers').children.map(r=>r.title),['Zulu','Alpha']);
 assert.equal(JSON.stringify(base.rows.map(r=>r.section)),original);
});
test('create a custom organizer and move source sections without changing stable URLs or prose',()=>{
 const base=source();let state=changeOrganization(base,{}, {type:'create',id:'new',heading:'My Powers',text:'Intro'});
 state=changeOrganization(base,state,{type:'organize',route:'/rules/custom/new',children:['/rules/powers/zulu','/rules/powers/alpha']});
 const i=organizedIndex(base,state);assert.deepEqual(i.byRoute.get('/rules/custom/new').children.map(r=>r.title),['Zulu','Alpha']);
 assert.equal(i.byRoute.get('/rules/powers/alpha').section.text,'Alpha prose');assert.equal(i.rows.length,6);
 assert.deepEqual(i.byRoute.get('/rules/powers/alpha').ancestry,['My Powers','Alpha']);
 assert.ok(searchIndex(i,'My Powers').some(x=>x.row.route==='/rules/powers/alpha'));
});
test('reject cycles, self-parenting and invalid children atomically',()=>{
 const base=source(),state=emptyOrganization();
 assert.throws(()=>changeOrganization(base,state,{type:'organize',route:'/rules/powers',parent:'/rules/powers/alpha'}),/ancestor/);
 assert.throws(()=>changeOrganization(base,state,{type:'organize',route:'/rules/powers',children:['/rules/powers']}),/ancestor/);
 assert.throws(()=>changeOrganization(base,state,{type:'organize',route:'/rules/powers',children:['missing']}));assert.deepEqual(state,emptyOrganization());
});
test('exclude only the selected section across reading, search, links, and backlinks; preserve and restore children',()=>{
 const base=source();let state=changeOrganization(base,{}, {type:'exclude',route:'/rules/powers/alpha'});
 let i=organizedIndex(base,state);assert.equal(i.rows.length,4);assert.equal(i.byRoute.get('/rules/powers/alpha/subsection').parent.route,'/rules/powers');
 assert.equal(searchIndex(i,'Alpha').some(r=>r.row.route==='/rules/powers/alpha'),false);
 assert.equal(matchTerms(i,'Alpha',i.byRoute.get('/rules/other')).length,0);
 state=changeOrganization(base,state,{type:'restore',route:'/rules/powers/alpha'});i=organizedIndex(base,state);
 assert.equal(i.rows.length,5);assert.equal(i.byRoute.get('/rules/powers/alpha/subsection').parent.route,'/rules/powers/alpha');
});
test('House Rules and exclusion persist separately and never rewrite the source',()=>{
 const base=source();let state=changeOrganization(base,{}, {type:'house',route:'/rules/powers/zulu',text:'Custom ruling'});
 state=changeOrganization(base,state,{type:'exclude',route:'/rules/powers/zulu'});
 state=changeOrganization(base,JSON.parse(JSON.stringify(state)),{type:'restore',route:'/rules/powers/zulu'});
 const i=organizedIndex(base,state);assert.equal(i.byRoute.get('/rules/powers/zulu').houseRule,'Custom ruling');assert.equal(base.byRoute.get('/rules/powers/zulu').section.text,'Zulu prose');
});
test('an article has multiple parents but remains one record with stable routes',()=>{
 const base=source();const state=changeOrganization(base,{}, {type:'edit',route:'/rules/powers/alpha',heading:'Alpha',text:'Alpha prose',parents:['/rules/powers','/rules/other']});
 const i=organizedIndex(base,state);assert.equal(i.rows.length,5);assert.ok(i.byRoute.get('/rules/other').children.includes(i.byRoute.get('/rules/powers/alpha')));assert.equal(i.byRoute.get('/rules/powers/alpha').parents.length,2);
 assert.throws(()=>changeOrganization(base,state,{type:'organize',route:'/rules/powers',parents:['/rules/other','/rules/powers/alpha/subsection']}),/ancestor/);
});
test('manual order is independently saved for each parent and Home across reloads',()=>{
 const base=source();let state=changeOrganization(base,{}, {type:'reorder',parent:'/rules/powers',order:['/rules/powers/alpha','/rules/powers/zulu']});
 state=changeOrganization(base,state,{type:'reorder',parent:null,order:['/rules/other','/rules/powers']});
 const i=organizedIndex(base,JSON.parse(JSON.stringify(state)));assert.deepEqual(i.roots.map(r=>r.title),['Other','Powers']);assert.deepEqual(i.byRoute.get('/rules/powers').children.map(r=>r.title),['Alpha','Zulu']);
 assert.throws(()=>changeOrganization(base,state,{type:'reorder',parent:'/rules/powers',order:['/rules/powers/alpha','/rules/powers/alpha']}));
});
test('a selected primary parent path survives a multi-parent ancestor',()=>{
 const base=source();let state=changeOrganization(base,{}, {type:'organize',route:'/rules/powers/alpha',parents:['/rules/powers','/rules/other']});
 state=changeOrganization(base,state,{type:'organize',route:'/rules/powers/alpha/subsection',parents:['/rules/powers/alpha'],paths:[['/rules/other','/rules/powers/alpha']]});
 const i=organizedIndex(base,state);assert.deepEqual(i.byRoute.get('/rules/powers/alpha/subsection').ancestry,['Other','Alpha','Subsection']);
});
test('multiple image edits preserve source tables and survive reordering and removal',()=>{
 const base=buildIndex({sections:[{heading:'Table',text:'Original',tables:[{path:'images/p018-table01.webp'}]}]});
 const initial=organizedIndex(base).rows[0];assert.equal(initial.images.length,1);
 const images=[{id:'added',src:'https://example.org/extra.webp',caption:'Extra'},...initial.images];
 let state=changeOrganization(base,{}, {type:'edit',route:initial.route,heading:'Edited',text:'Overlay',images});
 let i=organizedIndex(base,state);assert.equal(i.rows[0].images.length,2);assert.equal(i.rows[0].images[0].id,'added');assert.equal(base.rows[0].section.text,'Original');assert.equal(base.rows[0].section.tables.length,1);
 state=changeOrganization(base,state,{type:'edit',route:initial.route,heading:'Edited',text:'Overlay',images:[initial.images[0]]});assert.equal(organizedIndex(base,state).rows[0].images.length,1);
 assert.throws(()=>changeOrganization(base,state,{type:'edit',route:initial.route,heading:'Bad',images:[{id:'x',src:'javascript:alert(1)'}]}));
});
test('existing single-parent saved worlds upgrade without losing House Rules or exclusions',()=>{
 const base=source();const state={parents:{'/rules/powers/zulu':'/rules/other'},custom:{},excluded:['/rules/powers/alpha'],houseRules:{'/rules/powers/zulu':'Keep this'}};
 const i=organizedIndex(base,state);assert.equal(i.byRoute.get('/rules/powers/zulu').parent.route,'/rules/other');assert.equal(i.byRoute.get('/rules/powers/zulu').houseRule,'Keep this');assert.ok(!i.byRoute.has('/rules/powers/alpha'));
});
