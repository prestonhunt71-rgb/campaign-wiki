import test from 'node:test';
import assert from 'node:assert/strict';
import {buildIndex, searchIndex, matchTerms} from '../modules/hero-rulebook/scripts/hierarchy-core.js';
import {changeOrganization, organizedIndex, emptyOrganization} from '../modules/hero-rulebook/scripts/hierarchy-organization.js';
const source=()=>buildIndex({sections:[{heading:'Powers',text:'Powers prose',sections:[{heading:'Zulu',text:'Zulu prose'},{heading:'Alpha',text:'Alpha prose',sections:[{heading:'Subsection',text:'Retained'}]}]},{heading:'Other',text:'Zulu Alpha'}]});
test('initial view keeps every section and sorts children alphabetically without changing source',()=>{
 const base=source(), original=JSON.stringify(base.rows.map(r=>r.section));const i=organizedIndex(base);
 assert.equal(i.rows.length,5);assert.deepEqual(i.byRoute.get('/rules/powers').children.map(r=>r.title),['Alpha','Zulu']);
 assert.equal(JSON.stringify(base.rows.map(r=>r.section)),original);
});
test('create a custom organizer and move source sections without changing stable URLs or prose',()=>{
 const base=source();let state=changeOrganization(base,{}, {type:'create',id:'new',heading:'My Powers',text:'Intro'});
 state=changeOrganization(base,state,{type:'organize',route:'/rules/custom/new',children:['/rules/powers/zulu','/rules/powers/alpha']});
 const i=organizedIndex(base,state);assert.deepEqual(i.byRoute.get('/rules/custom/new').children.map(r=>r.title),['Alpha','Zulu']);
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
