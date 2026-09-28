import {organizedIndex} from './hierarchy-organization.js';
import {buildIndex, matchTerms, searchIndex, sourceLabel, tablePath} from './hierarchy-core.js';

const PREFIX = '#hero-rulebook';
export function currentLocation() {
  if (!location.hash.startsWith(`${PREFIX}/rules/`)) return null;
  const [path, query = ''] = location.hash.slice(PREFIX.length).split('?');
  try {return {route: decodeURI(path), readThrough: new URLSearchParams(query).get('mode') !== 'article'};}
  catch {return {route: path, readThrough: false};}
}
export const routeHash = (route, readThrough = true) => `${PREFIX}${encodeURI(route)}${readThrough ? '' : '?mode=article'}`;
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}
function button(text, action) {
  const node = element('button', '', text); node.type = 'button'; node.addEventListener('click', action); return node;
}
function ruleLink(row, text = row.title) {
  const link = element('a', '', text);
  link.href = routeHash(row.route); link.dataset.ruleRoute = row.route;
  link.title = `${row.ancestry.join(' › ')}\n${sourceLabel(row.section)}\n${(row.section.text || '').slice(0, 200)}`;
  return link;
}

export function linkifyProse(container, index, current, onAmbiguous) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    if (!walker.currentNode.parentElement.closest('a,button,code,pre,script,style,[data-no-link]')) nodes.push(walker.currentNode);
  }
  for (const node of nodes) {
    const matches = matchTerms(index, node.nodeValue, current);
    if (!matches.length) continue;
    const fragment = document.createDocumentFragment(); let offset = 0;
    for (const match of matches) {
      fragment.append(document.createTextNode(node.nodeValue.slice(offset, match.start)));
      const link = match.target ? ruleLink(match.target, match.text) : button(match.text, () => onAmbiguous(match));
      link.classList.add(match.target ? 'hr-crosslink' : 'hr-ambiguous');
      if (!match.target) {link.title = 'Multiple matching rules — choose a section'; link.setAttribute('aria-label', `${match.text}: choose a matching rule`);}
      fragment.append(link); offset = match.end;
    }
    fragment.append(document.createTextNode(node.nodeValue.slice(offset))); node.replaceWith(fragment);
  }
}

let dataPromise;
export async function loadRules() {
  dataPromise ??= fetch(new URL('../data/hero-rulebook-rules.organized-v7.json', import.meta.url))
    .then(response => {if (!response.ok) throw new Error(`Rules data unavailable (${response.status}).`); return response.json();})
    .then(buildIndex).catch(error => {dataPromise = null; throw error;});
  return dataPromise;
}

export async function mountReader(root,{route,adapter,readThrough:initialReadThrough=true}={}) {
 root.classList.add('hr-reader');root.textContent='Loading Champions 4e rules…';
 let source;try{source=await loadRules();}catch(e){root.replaceChildren(element('h2','','Rules unavailable'),element('p','',e.message),button('Retry',()=>mountReader(root,{route,adapter,readThrough:initialReadThrough})));return{destroy(){}};}let index=organizedIndex(source,adapter?.getState?.()||{}),current=null,disposed=false,preview=false,editing=false;
 if(!root.isConnected)return{destroy(){}};
 root.replaceChildren();
 const layout=element('div','hr-layout'),nav=element('nav','hr-tree'),workspace=element('div','hr-workspace'),toolbar=element('header','hr-toolbar'),main=element('main','hr-main');
 main.tabIndex=-1;nav.setAttribute('aria-label','Rulebook menu');
 const search=element('form','hr-search'),input=element('input');input.type='search';input.placeholder='Search Rulebook';input.setAttribute('aria-label','Search Rulebook');
 const submit=element('button','','Search');submit.type='submit';search.append(input,submit);
 const contents=button('☰ Contents',()=>root.classList.toggle('hr-nav-open'));contents.className='hr-nav-toggle';
 const newButton=button('+ New Article',()=>editArticle()),editButton=button('Edit Article',()=>current&&editArticle(current));
 toolbar.append(contents,search);if(adapter?.isGM)toolbar.append(newButton,editButton);
 workspace.append(toolbar,main);layout.append(nav,workspace);root.append(layout);
 let links=new Map(),branches=new Map();
 function refreshTree(){
  const expanded=new Set([...branches].filter(([,nodes])=>nodes.some(n=>n.open)).map(([id])=>id));links=new Map();branches=new Map();nav.replaceChildren();
  const home=button('Home',()=>navigate('/rules/home')),homeIcon=element('i','fas fa-home');home.prepend(homeIcon,document.createTextNode(' '));home.className='hr-home-button';nav.append(home);
  const add=(map,id,node)=>{if(!map.has(id))map.set(id,[]);map.get(id).push(node);};
  function tree(rows,container){for(const row of rows){const link=ruleLink(row);add(links,row.route,link);
   if(row.children.length){const d=element('details'),s=element('summary'),children=element('div','hr-tree-children');s.append(link);d.append(s,children);d.open=expanded.has(row.route);add(branches,row.route,d);tree(row.children,children);container.append(d);}
   else{const leaf=element('div','hr-tree-leaf');leaf.append(link);container.append(leaf);}
  }}tree(index.roots,nav);
 }
 function error(error,where=main){where.querySelector('.hr-action-error')?.remove();const p=element('p','hr-action-error',error.message);p.setAttribute('role','alert');where.append(p);}
 async function run(action,after){try{await action();after?.();}catch(e){error(e);}}
 function panel(title){editing=true;main.replaceChildren(element('h1','',title));main.scrollTop=0;return main;}
 function backBar(){const bar=element('div','hr-editor-footer');bar.append(button('Back to article',()=>renderRoute()));main.append(bar);}
 function field(form,label,control){control.setAttribute('aria-label',label);const l=element('label','hr-editor-field',label);l.append(control);form.append(l);return control;}
 function textField(form,label,value='',rows=0){const c=element(rows?'textarea':'input');if(rows)c.rows=rows;c.value=value;return field(form,label,c);}
 function saveForm(form,getCommand){const footer=element('div','hr-editor-footer'),save=element('button','','Save');save.type='submit';footer.append(save,button('Cancel',()=>renderRoute()));form.append(footer);
  form.addEventListener('submit',async event=>{event.preventDefault();save.disabled=true;try{const command=getCommand();await adapter.save(command);editing=false;if(command.type==='create')navigate(`/rules/custom/${command.id}`);else renderRoute();}catch(e){error(e,form);}finally{save.disabled=false;}});
 }
 const imageURL=im=>im.table?new URL(`../${im.src}`,import.meta.url).href:new URL(im.src,location.href).href;
 function imageElement(im,caption){const image=element('img');image.alt=caption||im.caption||'Article image';image.loading='lazy';if(im.src)image.src=imageURL(im);else image.hidden=true;return image;}
 function tiles(rows){const grid=element('div','hr-tiles');for(const row of rows){const tile=ruleLink(row),copy=element('span','hr-tile-copy');tile.className='hr-tile';copy.append(element('strong','',row.title),element('small','',row.customId?'Custom article':sourceLabel(row.section)));const cover=row.images[0];const icon=cover?imageElement(cover,row.title):element('span','hr-tile-icon','§');if(cover){icon.className='hr-tile-thumbnail';icon.addEventListener('error',()=>icon.replaceWith(element('span','hr-tile-icon','§')),{once:true});}tile.replaceChildren(icon,copy);grid.append(tile);}return grid;}
 function parentPicker(form,row,initialParent){
  const area=element('fieldset','hr-parent-picker');area.append(element('legend','','Parent Article Paths'));
  const paths=(row?.parents.length?row.parents.map((p,i)=>{
   const hint=adapter?.getState?.().parentPaths?.[row.route]?.[i];return hint?.at(-1)===p.route?[...hint]:[...p.ancestors.map(a=>a.route),p.route];
  }):initialParent?[[...initialParent.ancestors.map(a=>a.route),initialParent.route]]:[[]]);
  const blocked=new Set();if(row){const visit=r=>{if(blocked.has(r.route))return;blocked.add(r.route);r.children.forEach(visit);};visit(row);}
  const rows=element('div');
  function render(){rows.replaceChildren();paths.forEach((path,i)=>{const line=element('div','hr-parent-path');
   const rootSelect=element('select');rootSelect.setAttribute('aria-label',`Parent path ${i+1} root`);const top=element('option','','Home (top level)');top.value='';rootSelect.append(top);
   for(const r of index.roots)if(!blocked.has(r.route)){const o=element('option','',r.title);o.value=r.route;rootSelect.append(o);}rootSelect.value=path[0]||'';
   rootSelect.addEventListener('change',()=>{paths[i]=rootSelect.value?[rootSelect.value]:[];render();});line.append(rootSelect);
   for(let depth=0;depth<path.length;depth++){
    const p=index.byRoute.get(path[depth]);if(!p)break;const select=element('select');select.setAttribute('aria-label',`Parent path ${i+1} level ${depth+1}`);const use=element('option','',`Use ${p.title} as parent`);use.value='';select.append(use);
    for(const child of p.children)if(!blocked.has(child.route)){const o=element('option','',child.title);o.value=child.route;select.append(o);}select.value=path[depth+1]||'';
    select.addEventListener('change',()=>{paths[i]=path.slice(0,depth+1);if(select.value)paths[i].push(select.value);render();});line.append(select);
   }
   line.append(button('Remove path',()=>{paths.splice(i,1);if(!paths.length)paths.push([]);render();}));rows.append(line);
  });}
  area.append(rows,button('+ Add Parent Path',()=>{paths.push([]);render();}),element('p','hr-meta','Each path selects one immediate parent. The first path is the primary breadcrumb. An article may appear beneath several parents. Choose Home alone for a top-level article.'));form.append(area);render();
  return()=>{const selected=paths.filter(p=>p.length),parents=[...new Set(selected.map(p=>p.at(-1)))];return{parents,paths:parents.map(p=>selected.find(path=>path.at(-1)===p))};};
 }
 function imagesEditor(form,initial){
  const images=initial.map(im=>({...im})),area=element('fieldset','hr-images-editor'),list=element('div');area.append(element('legend','','Article Images'),list);
  const browse=async(target,selectFile,host)=>{host.replaceChildren(element('p','','Loading images…'));try{const result=await adapter.browse(target);host.replaceChildren();
   const pathInput=textField(host,'Folder',result.target||target);host.append(button('Open folder',()=>browse(pathInput.value,selectFile,host)));
   const up=(result.target||target).replace(/\/?[^/]+\/?$/,'');host.append(button('Parent folder',()=>browse(up,selectFile,host)));
   for(const folder of result.dirs||[])host.append(button(`📁 ${folder.split('/').at(-1)}`,()=>browse(folder,selectFile,host)));
   for(const file of result.files||[])if(/\.(webp|png|jpe?g|gif|svg)(?:\?|$)/i.test(file))host.append(button(file.split('/').at(-1),()=>{selectFile(file);host.replaceChildren();render();}));
  }catch(e){host.replaceChildren();error(e,host);}};
  function render(){list.replaceChildren();images.forEach((im,i)=>{const row=element('div','hr-image-editor-row'),previewImage=imageElement(im,im.caption);previewImage.className='hr-edit-image-preview';previewImage.addEventListener('error',()=>{previewImage.hidden=true;});row.append(previewImage);
   const fields=element('div');const path=textField(fields,`Image ${i+1} path or URL`,im.src),caption=textField(fields,`Image ${i+1} caption`,im.caption);path.addEventListener('input',()=>{im.src=path.value;im.table=false;});caption.addEventListener('input',()=>{im.caption=caption.value;});row.append(fields);
   const actions=element('div','hr-image-actions');const up=button('Move image up',()=>{[images[i-1],images[i]]=[images[i],images[i-1]];render();});up.disabled=i===0;const down=button('Move image down',()=>{[images[i+1],images[i]]=[images[i],images[i+1]];render();});down.disabled=i===images.length-1;
   actions.append(up,down,button('Remove image',()=>{images.splice(i,1);render();}));
   if(adapter?.browse){const browser=element('div','hr-inline-file-browser');actions.append(button('Browse images',()=>browse('',file=>{im.src=file;im.table=false;},browser)));row.append(browser);}
   row.append(actions);list.append(row);
  });}
  area.append(button('+ Add Image',()=>{images.push({id:crypto.randomUUID(),src:'',caption:'',table:false});render();}));form.append(area);render();return()=>images;
 }
 function editArticle(row=null,parent=null){
  if(!adapter?.isGM)return;panel(row?'Edit Article':'New Article');const form=element('form','hr-editor hr-wiki-editor');
  const heading=textField(form,'Article Title',row?.title||'');heading.required=true;heading.classList.add('hr-title-input');
  const getParents=parentPicker(form,row,parent),getImages=imagesEditor(form,row?.images||[]);
  const text=textField(form,'Article Text',row?.section.text||'',16);if(row?.sourceSection)form.append(element('p','hr-meta','Edits are saved separately. The supplied v7 source is retained unchanged.'));
  main.append(form);saveForm(form,()=>({type:row?'edit':'create',...(row?{route:row.route}:{id:crypto.randomUUID()}),heading:heading.value,text:text.value,images:getImages(),...getParents()}));
 }
 function reorder(parent=null){if(!adapter?.isGM)return;panel(parent?`Order Children — ${parent.title}`:'Order Home Articles');
  const rows=[...(parent?parent.children:index.roots)],form=element('form','hr-editor'),list=element('ol','hr-order-list');let dragged;
  function render(){list.replaceChildren();rows.forEach((row,i)=>{const item=element('li');item.draggable=true;item.append(element('span','',row.title));const up=button('Move up',()=>{[rows[i-1],rows[i]]=[rows[i],rows[i-1]];render();}),down=button('Move down',()=>{[rows[i+1],rows[i]]=[rows[i],rows[i+1]];render();});up.disabled=i===0;down.disabled=i===rows.length-1;item.append(up,down);
   item.addEventListener('dragstart',()=>{dragged=i;});item.addEventListener('dragover',e=>e.preventDefault());item.addEventListener('drop',e=>{e.preventDefault();if(dragged==null)return;rows.splice(i,0,rows.splice(dragged,1)[0]);dragged=null;render();});list.append(item);});}
  form.append(element('p','','Drag articles or use the arrows. This order is used in the sidebar, tiles, and child content.'),list);main.append(form);render();saveForm(form,()=>({type:'reorder',parent:parent?.route||null,order:rows.map(r=>r.route)}));
 }
 function houseRules(row){panel(`House Rules — ${row.title}`);const form=element('form','hr-editor'),text=textField(form,'House Rules',row.houseRule,12);main.append(form);saveForm(form,()=>({type:'house',route:row.route,text:text.value}));}
 function exclude(row){panel(`Delete — ${row.title}`);main.append(element('p','','This excludes this section from the rulebook. Its children remain available, and the section can be restored from Home.'),button('Delete this section',()=>run(()=>adapter.save({type:'exclude',route:row.route}),()=>navigate('/rules/home'))));backBar();}
 function excluded(){panel('Excluded Sections');const removed=index.all.filter(r=>index.excluded.has(r.route));if(!removed.length)main.append(element('p','','No sections are excluded.'));for(const row of removed){const item=element('p','',`${row.title} `);item.append(button('Restore',()=>run(()=>adapter.save({type:'restore',route:row.route}),()=>excluded())));main.append(item);}backBar();}
 function relationships(row){panel(`Explain Relationships — ${row.title}`);main.append(element('h2','','Parent Article Paths'));for(const p of row.parents){const line=element('p');for(const a of [...p.ancestors,p])line.append(ruleLink(a),document.createTextNode(' › '));line.append(document.createTextNode(row.title));main.append(line);}if(!row.parents.length)main.append(element('p','','Home → '+row.title));main.append(element('h2','','Direct Children'),tiles(row.children),element('p','hr-meta','Each article is stored once. Multiple parent paths add sidebar placements; descendants are displayed once when reading a parent.'));backBar();}
 function choose(match){panel(`Choose a rule — ${match.text}`);main.append(tiles(match.candidates));backBar();}
 function article(row,nested=false){const a=element('article','hr-article');a.dataset.route=row.route;a.id=`section-${encodeURIComponent(row.route)}`;
  a.append(element(nested?'h2':'h1','',row.title),element('p','hr-meta',row.customId?'Custom article':sourceLabel(row.section)));
  if(row.section.text){const prose=element('div','hr-prose',row.section.text);linkifyProse(prose,index,row,choose);a.append(prose);}
  for(const im of row.images){const figure=element('figure'),image=imageElement(im,im.caption||row.title),enlarge=button('',()=>{panel(im.caption||row.title);const full=imageElement(im,im.caption||row.title);full.className='hr-enlarged';main.append(full);backBar();});enlarge.className='hr-table';enlarge.setAttribute('aria-label',`Enlarge ${im.caption||row.title}`);image.addEventListener('error',()=>figure.replaceChildren(element('p','hr-missing',`Image unavailable: ${im.src}`)),{once:true});enlarge.append(image);figure.append(enlarge,element('figcaption','hr-meta',im.caption));a.append(figure);}
  if(row.houseRule){const house=element('aside','hr-house-rule');house.append(element('strong','','House Rules'),element('div','hr-prose',row.houseRule));a.append(house);}
  if(row.children.length){const section=element('section','hr-local-contents');section.append(element('h2','','Child Articles'),tiles(row.children));a.append(section);}
  const footer=element('footer','hr-section-actions');
  if(adapter?.isGM&&!preview)footer.append(button('+ New Child Article',()=>editArticle(null,row)),button('Edit Article',()=>editArticle(row)),button('Order Children',()=>reorder(row)),button('House Rules',()=>houseRules(row)),button('Show to Players',()=>run(()=>adapter.show(row.route))),button('Player Preview',()=>{preview=true;renderRoute();}),button('Explain Relationships',()=>relationships(row)),button('Delete',()=>exclude(row)));
  else footer.append(button('Explain Relationships',()=>relationships(row)));
  if(nested)footer.append(ruleLink(row,'Open article'));a.append(footer);return a;
 }
 function renderRoute(){
  if(disposed)return;editing=false;const state=currentLocation(),selected=state?.route||route||'/rules/home';current=index.byRoute.get(selected)||null;main.replaceChildren();editButton.disabled=!current;newButton.hidden=preview;editButton.hidden=preview;
  for(const nodes of links.values())for(const link of nodes)link.removeAttribute('aria-current');
  if(preview){const banner=element('div','hr-preview-banner','Player Preview ');banner.append(button('Return to GM view',()=>{preview=false;renderRoute();}));main.append(banner);}
  if(selected==='/rules/home'){
   main.append(element('h1','','Champions 4e Rulebook'),element('p','hr-meta',`${index.rows.length} articles · Your rulebook, organized your way`));
   if(adapter?.isGM&&!preview){const tools=element('div','hr-section-actions');tools.append(button('Order Home Articles',()=>reorder()),button('Excluded Sections',excluded));main.append(tools);}
   main.append(tiles(index.roots));main.scrollTop=0;return;
  }
  if(!current){main.append(element('h1','',index.excluded.has(selected)?'Section excluded':'Article not found'),button('Home',()=>navigate('/rules/home')));return;}
  for(const l of links.get(current.route)||[])l.setAttribute('aria-current','page');
  for(const a of [...current.ancestors,current])for(const d of branches.get(a.route)||[])d.open=true;
  const crumbs=element('nav','hr-breadcrumbs');crumbs.setAttribute('aria-label','Breadcrumbs');const home=element('a','','Home');home.href=routeHash('/rules/home');home.dataset.ruleRoute='/rules/home';crumbs.append(home);
  for(const a of current.ancestors)crumbs.append(document.createTextNode(' › '),ruleLink(a));crumbs.append(document.createTextNode(' › '+current.title),element('span','hr-visibility','Public'));
  const tools=element('div','hr-reading-tools');tools.append(button(state?.readThrough===false?'Show children':'Show section only',()=>navigate(current.route,state?.readThrough===false)),button('Copy link',()=>run(async()=>{const url=location.href;try{await navigator.clipboard.writeText(url);tools.querySelector('[role=status]').textContent='Copied';}catch{panel('Copy Article Link');const field=textField(main,'Article link',url);field.readOnly=true;backBar();field.select();}})));const status=element('span','hr-meta');status.setAttribute('role','status');tools.append(status);
  main.append(crumbs,tools,article(current));
  if(state?.readThrough!==false){const seen=new Set([current.route]);function descend(rows){for(const row of rows){if(seen.has(row.route))continue;seen.add(row.route);main.append(article(row,true));descend(row.children);}}descend(current.children);}
  const sequence=element('nav','hr-sequence');if(current.previous)sequence.append(ruleLink(current.previous,'← '+current.previous.title));if(current.next)sequence.append(ruleLink(current.next,current.next.title+' →'));main.append(sequence);main.scrollTop=0;if(nav.offsetWidth)links.get(current.route)?.[0]?.scrollIntoView({block:'nearest'});
 }
 function navigate(target,mode=true){history.pushState(null,'',routeHash(target,mode));renderRoute();root.classList.remove('hr-nav-open');main.focus({preventScroll:true});}
 const click=event=>{const link=event.target.closest('a[data-rule-route]');if(!link||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;event.preventDefault();navigate(link.dataset.ruleRoute);};root.addEventListener('click',click);
 search.addEventListener('submit',e=>{e.preventDefault();editing=false;main.replaceChildren(element('h1','','Search Results'));const results=searchIndex(index,input.value);main.append(element('p','hr-meta',`${results.length} matching articles`));for(const {row,excerpt} of results){const result=element('article','hr-result');result.append(ruleLink(row),element('p','hr-meta',row.ancestry.join(' › ')),element('p','',excerpt));main.append(result);}root.classList.remove('hr-nav-open');main.scrollTop=0;});
 const key=e=>{if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();input.focus();}};root.addEventListener('keydown',key);
 window.addEventListener('popstate',renderRoute);window.addEventListener('hashchange',renderRoute);
 if(route)history.replaceState(null,'',routeHash(route,initialReadThrough));else if(!currentLocation())history.replaceState(null,'',routeHash('/rules/home'));
 refreshTree();renderRoute();
 return{get index(){return index;},navigate,refresh(state){index=organizedIndex(source,state);refreshTree();if(!editing)renderRoute();},destroy(){disposed=true;window.removeEventListener('popstate',renderRoute);window.removeEventListener('hashchange',renderRoute);root.removeEventListener('click',click);root.removeEventListener('keydown',key);}};
}
