import {validateBook,safeImagePath} from './rulebook-core.js';
const id=value=>typeof value==='string'&&/^[a-z0-9][a-z0-9-]{0,100}$/i.test(value);
export function validateBatch(input){
 if(input?.format!=='hero-rulebook-batch-v1')throw new Error('Choose a HERO rulebook batch JSON file.');
 const batch=structuredClone(input);validateBook(batch.book);
 if(!Array.isArray(batch.pages)||batch.pages.length!==batch.book.pages.length)throw new Error('Every listed page must be present in the batch.');
 const pageIds=new Set(),sectionIds=new Set(),assets=new Set();
 for(const asset of batch.assets||[]){if(!/^images\/[a-z0-9-]+\.(webp|png|jpe?g)$/i.test(asset.path)||assets.has(asset.path)||!/^image\/(webp|png|jpeg)$/.test(asset.mime)||typeof asset.data!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(asset.data))throw new Error('Invalid or duplicate image asset.');assets.add(asset.path);}
 for(const page of batch.pages){if(!id(page.id)||pageIds.has(page.id)||!batch.book.pages.some(p=>p.id===page.id)||!Array.isArray(page.sections)||!page.sections.length)throw new Error('Invalid or duplicate page.');pageIds.add(page.id);
  if(!String(page.label??'').trim())throw new Error('Every page needs a printed page label.');
  for(const section of page.sections){if(!id(section.id)||sectionIds.has(section.id)||typeof section.text!=='string'||typeof section.title!=='string')throw new Error('Invalid or duplicate section.');sectionIds.add(section.id);
   if(!Array.isArray(section.images))throw new Error('Section images must be a list.');
   for(const image of section.images){if(image.searchText!==undefined&&typeof image.searchText!=='string')throw new Error('Image search text must be text.');if(!safeImagePath(image.src))throw new Error('Invalid image path.');if(!/^https?:\/\//i.test(image.src)&&!assets.has(image.src))throw new Error(`Image missing from batch: ${image.src}`);}
  }
 }
 for(const ref of [...(batch.book.toc||[]),...(batch.book.glossary||[])]){const page=batch.pages.find(p=>p.id===ref.pageId);if(!page||ref.sectionId&&!page.sections.some(s=>s.id===ref.sectionId))throw new Error('Contents or glossary references an unknown section.');}
 return batch;
}
export function planBatch(currentBook,currentPages,batch){
 validateBatch(batch);if(currentBook&&currentBook.id!==batch.book.id)throw new Error('This batch belongs to a different book.');
 const byId=new Map(currentPages.map(p=>[p.id,structuredClone(p)]));let added=0,replaced=0;
 for(const incoming of batch.pages){const old=byId.get(incoming.id);if(old){const nextIds=new Set(incoming.sections.map(s=>s.id));if(old.sections.some(s=>!nextIds.has(s.id)))throw new Error(`Page ${old.label} would lose section links. Preserve existing section IDs before importing.`);replaced++;}else added++;byId.set(incoming.id,structuredClone(incoming));}
 const pages=[...byId.values()].sort((a,b)=>(a.order??a.pdfPage??Number.MAX_SAFE_INTEGER)-(b.order??b.pdfPage??Number.MAX_SAFE_INTEGER)||a.label.localeCompare(b.label,undefined,{numeric:true}));
 const ids=new Set();for(const page of pages)for(const section of page.sections){if(ids.has(section.id))throw new Error('Section IDs must be unique across the book.');ids.add(section.id);}
 const followers=new Set();
 for(let i=0;i<pages.length;i++)for(const section of pages[i].sections){const prev=section.continuesFrom;if(!prev)continue;const parentIndex=pages.findIndex(p=>p.id===prev.pageId);if(parentIndex<0||parentIndex>=i||!pages[parentIndex].sections.some(s=>s.id===prev.sectionId))throw new Error('A continuation must link to an existing section on an earlier page.');const key=prev.pageId+':'+prev.sectionId;if(followers.has(key))throw new Error('A section cannot continue into two different sections.');followers.add(key);}
 const incomingIds=new Set(batch.pages.map(p=>p.id));const combine=key=>[...(currentBook?.[key]||[]).filter(r=>!incomingIds.has(r.pageId)),...(batch.book[key]||[])];
 const book={...(currentBook||{}),...batch.book,pages:pages.map(({id,label,pdfPage,title,order})=>({id,label,pdfPage,title,...(order===undefined?{}:{order}),...(currentBook?.pages.find(p=>p.id===id)?.file?{file:currentBook.pages.find(p=>p.id===id).file}:{})})),toc:combine('toc'),glossary:combine('glossary')};book.toc.sort((a,b)=>pages.findIndex(p=>p.id===a.pageId)-pages.findIndex(p=>p.id===b.pageId));
 book.toc=pages.flatMap(p=>p.sections.map((s,i)=>({pageId:p.id,sectionId:s.id,title:s.title,level:i?2:1,...(s.continuesFrom?{continuesFrom:s.continuesFrom}:{})})));return {book,pages,added,replaced,changedPageIds:batch.pages.map(p=>p.id)};
}
export function buildSearchIndex(pages){return pages.flatMap(p=>p.sections.map(s=>({pageId:p.id,label:p.label,sectionId:s.id,title:s.title,text:s.text,...(s.images?.some(im=>im.searchText)?{imageText:s.images.map(im=>im.searchText||'').filter(Boolean).join('\n\n')} : {}),...(s.continuesFrom?{continuesFrom:s.continuesFrom}:{})})));}
export function reviewFingerprint(page){const value=JSON.stringify([page.label,page.sections.map(s=>[s.id,s.title,s.text,s.images,s.continuesFrom])]);let hash=2166136261;for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(16);}
export function reviewState(page,saved){if(!saved)return {status:'needs-review',note:''};if(saved.fingerprint!==reviewFingerprint(page))return {...saved,status:'needs-review',changed:true};return saved;}
export function moveReference(refs,key,direction){const result=structuredClone(refs),i=result.findIndex(r=>`${r.pageId}:${r.sectionId}`===key),next=i+direction;if(i>=0&&next>=0&&next<result.length)[result[i],result[next]]=[result[next],result[i]];return result;}
// Keep the old content path active until every upload and a read-back have succeeded.
export async function uploadBatch(plan,assets,{createDirectory,upload,readJson,folder,onProgress=()=>{}}){
 const root=folder.replace(/\/+$/,'');await createDirectory(root);await createDirectory(root+'/pages');if(assets.length)await createDirectory(root+'/images');
 let done=0,total=assets.length+plan.pages.length+2;const uploaded=new Map();
 for(const asset of assets){const path=await upload(root+'/images',asset.path.split('/').at(-1),asset);if(!path)throw new Error('Image upload failed. The previous book remains active.');uploaded.set(asset.path,path);onProgress(++done,total);}
 const pages=structuredClone(plan.pages);
 for(const page of pages){for(const section of page.sections)for(const image of section.images)if(uploaded.has(image.src))image.src=uploaded.get(image.src);const meta=plan.book.pages.find(p=>p.id===page.id);if(meta.file&&!plan.changedPageIds?.includes(page.id)){onProgress(++done,total);continue;}const path=await upload(root+'/pages',page.id+'.json',{json:page});if(!path)throw new Error('Page upload failed. The previous book remains active.');meta.file=path;onProgress(++done,total);}
 if(!await upload(root,'search.json',{json:buildSearchIndex(pages)}))throw new Error('Search index upload failed.');onProgress(++done,total);
 const manifestPath=await upload(root,'book.json',{json:plan.book});if(!manifestPath)throw new Error('Contents upload failed.');const readback=await readJson(manifestPath);validateBook(readback);if(readback.id!==plan.book.id||JSON.stringify(readback.pages)!==JSON.stringify(plan.book.pages))throw new Error('Uploaded book could not be verified.');onProgress(++done,total);
 return manifestPath.slice(0,manifestPath.lastIndexOf('/'));
}
export function manualPage({label,title,text,order,id:pageId}){
 if(!String(label||'').trim()||!String(title||'').trim()||!String(text||'').trim())throw new Error('Enter a page number, title, and text.');
 if(!id(pageId)||!Number.isFinite(order)||order<0)throw new Error('Invalid page order.');
 const sections=[];let heading=title,lines=[];const flush=()=>{if(lines.join('\n').trim())sections.push({id:`${pageId}-s${String(sections.length+1).padStart(2,'0')}`,title:heading.trim(),text:lines.join('\n').trim(),images:[]});lines=[];};
 for(const line of text.replace(/\r\n/g,'\n').split('\n')){const match=line.match(/^##\s+(.+)$/);if(match){flush();heading=match[1];}else lines.push(line);}flush();
 if(!sections.length)throw new Error('Add text beneath your headings.');
 return {id:pageId,label:String(label).trim(),title:String(title).trim(),order,sections,ocrReview:true};
}
