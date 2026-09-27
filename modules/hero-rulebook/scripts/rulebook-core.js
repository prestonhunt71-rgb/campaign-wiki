export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const refKey=ref=>`${ref.pageId}:${ref.sectionId||''}`;
export function effectivePage(page,overrides={}) {
 const result=structuredClone(page);
 for(const section of result.sections){const edit=overrides[section.id];if(!edit)continue;for(const key of ['title','text','images','houseRule','continuesFrom'])if(Object.hasOwn(edit,key))section[key]=structuredClone(edit[key]);}
 return result;
}
const normalize=s=>String(s??'').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim();
export function searchRules(index,query,{overrides={},includeHouseRules=true}={}){
 const terms=normalize(query).split(' ').filter(Boolean);if(!terms.length)return[];
 index=index.map(row=>Object.hasOwn(overrides[row.sectionId]||{},'continuesFrom')?{...row,continuesFrom:overrides[row.sectionId].continuesFrom}:row);const groups=[],seen=new Set();for(const row of index){if(seen.has(refKey(row)))continue;const chain=continuationChain(index,row);chain.forEach(r=>seen.add(refKey(r)));groups.push(chain);}
 return groups.flatMap(chain=>{const row=chain[0],title=overrides[row.sectionId]?.title??row.title;let body='';for(const part of chain){const edit=overrides[part.sectionId]||{},text=edit.text??part.text;if(body.endsWith('-')&&/[a-z]/.test(text[0]||''))body=body.slice(0,-1)+text;else body+=(body?' ':'')+text;if(includeHouseRules&&edit.houseRule)body+='\nHouse rule: '+edit.houseRule;}
 const imageText=chain.map(part=>{const edit=overrides[part.sectionId]||{};return Object.hasOwn(edit,'images')?(edit.images||[]).map(im=>im.searchText||'').join(' '):(part.imageText||'');}).join(' ');const searchableBody=body+(imageText?'\n'+imageText:'');
 const hay=normalize(chain.map(part=>overrides[part.sectionId]?.title??part.title).join(' ')+' '+searchableBody);if(!terms.every(t=>hay.includes(t)))return[];const pos=normalize(searchableBody).indexOf(terms[0]);return[{...row,title,text:body,label:chain.length>1?`${row.label}–${chain.at(-1).label}`:row.label,continued:chain.length>1,snippet:searchableBody.replace(/\s+/g,' ').slice(Math.max(0,pos-65),Math.max(0,pos-65)+240),score:terms.filter(t=>normalize(title).includes(t)).length}];}).sort((a,b)=>b.score-a.score);
}
export function safeImagePath(path){const s=String(path??'').trim();return s&&!/[<>"\x00-\x1f]/.test(s)&&!s.startsWith('//')&&!/^(?:javascript|data|vbscript|file):/i.test(s)&&(!/^[a-z][a-z\d+.-]*:/i.test(s)||/^https?:\/\//i.test(s))?s:'';}
export function validateBook(book){if(book?.schemaVersion!==1||!/^[-a-z0-9]+$/i.test(book.id||'')||['constructor','prototype','__proto__'].includes(book.id)||!Array.isArray(book.pages)||!book.pages.length)throw new Error('Invalid rulebook manifest.');const ids=new Set();for(const p of book.pages){if(!/^[a-z0-9-]+$/i.test(p.id)||ids.has(p.id))throw new Error('Invalid or duplicate page ID.');ids.add(p.id);}return book;}
export function collectSections(pages,refs,overrides={}){return refs.map(ref=>{const page=pages.find(p=>p.id===ref.pageId);if(!page)return null;const section=effectivePage(page,overrides).sections.find(s=>s.id===ref.sectionId);if(!section)return null;const {houseRule,...source}=section;return {pageId:page.id,label:page.label,...source,...(ref.includeHouseRule&&houseRule?{houseRule}:{})};}).filter(Boolean);}
function ruleTextHtml(text,linkText){
 const blocks=[],lines=[];
 const flush=()=>{if(lines.length){blocks.push(linkText(lines.join('\n')));lines.length=0;}};
 for(const line of String(text??'').replace(/\r\n?/g,'\n').split('\n')){
  const heading=line.match(/^(#{3,4})[ \t]+(\S.*)$/);
  if(heading){flush();const level=heading[1].length;blocks.push(`<h${level}>${linkText(heading[2].trim())}</h${level}>`);}else lines.push(line);
 }
 flush();return blocks.join('');
}
export function sectionHtml(section,{linkText=text=>escapeHtml(text).replace(/\n/g,'<br>'),imageURL=src=>src,controls=''}={}){
 const images=(section.images||[]).filter(im=>safeImagePath(im.src));const figures=position=>images.filter(im=>(im.position||'after')===position).map(im=>`<figure><a href="${escapeHtml(imageURL(im.src))}" target="_blank" rel="noopener"><img loading="lazy" src="${escapeHtml(imageURL(im.src))}" alt="${escapeHtml(im.caption||section.title)}"></a>${im.caption?`<figcaption>${escapeHtml(im.caption)}</figcaption>`:''}${im.searchText?`<details class="rb-image-ocr"><summary>Searchable image text (OCR)</summary><div class="rb-text">${linkText(im.searchText)}</div></details>`:''}</figure>`).join('');
 return `<section class="rb-section" id="rb-${escapeHtml(section.id)}"><header><h2>${escapeHtml(section.title)}</h2><div class="rb-actions">${controls}</div></header>${figures('before')}<div class="rb-text">${ruleTextHtml(section.text,linkText)}</div>${figures('after')}${section.houseRule?.trim()?`<aside class="rb-house"><strong>House rule</strong><div>${linkText(section.houseRule)}</div></aside>`:''}</section>`;
}
export function continuationChain(rows,ref){
 const key=r=>`${r.pageId}:${r.sectionId}`,byKey=new Map(rows.map(r=>[key(r),r]));let current=byKey.get(key(ref));if(!current)return[];const seen=new Set();
 while(current.continuesFrom&&byKey.has(key(current.continuesFrom))&&!seen.has(key(current))){seen.add(key(current));current=byKey.get(key(current.continuesFrom));}
 const result=[];seen.clear();while(current&&!seen.has(key(current))){result.push(current);seen.add(key(current));current=rows.find(r=>r.continuesFrom&&key(r.continuesFrom)===key(current));}return result;
}
