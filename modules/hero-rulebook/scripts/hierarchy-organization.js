import {linkIndex, normalizeTitle} from './hierarchy-core.js';
export const emptyOrganization=()=>({parents:{},parentPaths:{},orders:{},excluded:[],houseRules:{},custom:{},edits:{}});
const owns=(o,k)=>Object.hasOwn(o||{},k);
export function safeArticleImage(value) {
 const s=String(value||'').trim();
 return s && !/[<>"\x00-\x1f\\]/.test(s) && !s.startsWith('//') && !s.split('/').includes('..') && (!/^[a-z][a-z\d+.-]*:/i.test(s)||/^https?:\/\//i.test(s)) ? s : '';
}
export function organizedIndex(source,state={}) {
 const all=source.rows.map(r=>({...r,sourceSection:r.section,children:[],parents:[],ancestors:[],ancestry:[],parent:null}));
 for(const [id,v] of Object.entries(state.custom||{})) if(/^[a-z\d-]+$/i.test(id)&&v.heading?.trim())all.push({route:`/rules/custom/${id}`,title:v.heading,section:{heading:v.heading,text:v.text||''},customId:id,children:[],parents:[],ancestors:[],ancestry:[],parent:null});
 const full=new Map(all.map(r=>[r.route,r])),parentLists=new Map();
 for(const r of all){
  const edit=state.edits?.[r.route]||{};
  r.section={...r.section,...(owns(edit,'heading')?{heading:edit.heading}:{}),...(owns(edit,'text')?{text:edit.text}:{})};r.title=r.section.heading;r.normalizedTitle=normalizeTitle(r.title);
  r.images=owns(edit,'images')?edit.images.map(im=>({...im})):(r.section.tables||[]).map((t,i)=>({id:`table:${t.path}`,src:t.path,caption:t.caption||`${r.title} — table ${i+1}`,table:true}));
  r.houseRule=state.houseRules?.[r.route]||'';
  const p=owns(state.parents,r.route)?state.parents[r.route]:source.byRoute.get(r.route)?.parent?.route;
  parentLists.set(r.route,[...new Set((Array.isArray(p)?p:p?[p]:[]).filter(Boolean))]);
 }
 const visited=new Set(),visiting=new Set();
 function validate(id){if(visiting.has(id))throw Error('An article cannot be its own ancestor.');if(visited.has(id))return;if(!full.has(id))throw Error('Parent article not found.');visiting.add(id);for(const p of parentLists.get(id))validate(p);visiting.delete(id);visited.add(id);}
 for(const r of all)validate(r.route);
 const excluded=new Set(state.excluded||[]),active=all.filter(r=>!excluded.has(r.route)),roots=[];
 function includedParents(id){return parentLists.get(id).flatMap(p=>excluded.has(p)?includedParents(p):[p]);}
 for(const r of active){r.parents=[...new Set(includedParents(r.route))].map(p=>full.get(p));r.parent=r.parents[0]||null;if(!r.parents.length)roots.push(r);else for(const p of r.parents)p.children.push(r);}
 function sort(children,key){const order=state.orders?.[key]||[],rank=new Map(order.map((id,i)=>[id,i]));children.sort((a,b)=>(rank.get(a.route)??Infinity)-(rank.get(b.route)??Infinity));}
 sort(roots,'$root');for(const r of active)sort(r.children,r.route);
 function primaryPath(r,seen=new Set()){
  if(seen.has(r.route))throw Error('Invalid primary path.');seen.add(r.route);
  const hint=state.parentPaths?.[r.route]?.[0];
  if(hint?.length&&hint.at(-1)===r.parent?.route&&hint.every((id,i)=>full.has(id)&&!excluded.has(id)&&(i===0?!full.get(id).parents.length:full.get(id).parents.some(p=>p.route===hint[i-1]))))return hint.map(id=>full.get(id));
  return r.parent?[...primaryPath(r.parent,seen),r.parent]:[];
 }
 for(const r of active){r.ancestors=primaryPath(r);r.ancestry=[...r.ancestors.map(a=>a.title),r.title];}
 const rows=[],seen=new Set();function walk(children){for(const r of children){if(seen.has(r.route))continue;seen.add(r.route);r.position=rows.length;rows.push(r);walk(r.children);}}walk(roots);
 return {...linkIndex(rows,roots),all,parentLists,parentRoutes:new Map([...parentLists].map(([id,p])=>[id,p[0]||null])),excluded};
}
export function changeOrganization(source,original,cmd){
 const state={...emptyOrganization(),...structuredClone(original||{})},before=organizedIndex(source,state),known=new Set(before.all.map(r=>r.route));
 function parents(route,values,paths){const ids=[...new Set((values||[]).filter(Boolean))];if(ids.some(p=>!known.has(p)))throw Error('Choose existing parent articles.');state.parents[route]=ids;if(paths)state.parentPaths[route]=paths;else delete state.parentPaths[route];}
 function edited(route){if(!String(cmd.heading||'').trim())throw Error('Enter an article title.');const edit={...state.edits[route],heading:cmd.heading.trim(),text:String(cmd.text||'')};if(cmd.images){edit.images=cmd.images.map(im=>{const src=safeArticleImage(im.src);if(!src)throw Error('Enter an image file path or HTTP(S) URL.');return{id:String(im.id),src,caption:String(im.caption||''),table:Boolean(im.table)};});if(new Set(edit.images.map(im=>im.id)).size!==edit.images.length)throw Error('Duplicate image ID.');}state.edits[route]=edit;}
 if(cmd.type==='create'){
  if(!/^[a-z\d-]+$/i.test(cmd.id||'')||owns(state.custom,cmd.id))throw Error('Invalid article ID.');
  const route=`/rules/custom/${cmd.id}`;edited(route);state.custom[cmd.id]={heading:cmd.heading.trim(),text:String(cmd.text||'')};parents(route,cmd.parents??(cmd.parent?[cmd.parent]:[]),cmd.paths);
 }else if(cmd.type==='reorder'){
  const children=cmd.parent?before.byRoute.get(cmd.parent)?.children:before.roots;
  if(!children||!Array.isArray(cmd.order)||new Set(cmd.order).size!==children.length||cmd.order.length!==children.length||children.some(r=>!cmd.order.includes(r.route)))throw Error('Order must include each child exactly once.');
  const key=cmd.parent||'$root';state.orders[key]=[...cmd.order,...(state.orders[key]||[]).filter(id=>!cmd.order.includes(id))];
 }else{
  if(!known.has(cmd.route))throw Error('Section not found.');
  if(cmd.type==='organize'){
   parents(cmd.route,cmd.parents??(cmd.parent?[cmd.parent]:[]),cmd.paths);
   if(cmd.children){const selected=new Set(cmd.children);for(const [id,p] of before.parentLists)if(p.includes(cmd.route)&&!selected.has(id))parents(id,p.filter(v=>v!==cmd.route));for(const id of selected){if(!known.has(id))throw Error('Child section not found.');parents(id,[cmd.route]);}}
  }else if(cmd.type==='edit'){edited(cmd.route);if(cmd.parents)parents(cmd.route,cmd.parents,cmd.paths);}
  else if(cmd.type==='exclude')state.excluded=[...new Set([...state.excluded,cmd.route])];
  else if(cmd.type==='restore')state.excluded=state.excluded.filter(id=>id!==cmd.route);
  else if(cmd.type==='house')state.houseRules[cmd.route]=String(cmd.text||'');
  else throw Error('Unknown action.');
 }
 organizedIndex(source,state);return state;
}
