import {articlePaths,childrenOf} from "./unified-core.js";

export const IMAGE_ROOT="root:images";

export function safeFolderName(value){return String(value??"").trim().replace(/[\\/:*?"<>|]/g,"-").replace(/\s+/g," ").replace(/[. ]+$/g,"")||"Uncategorized";}
export function assetFilename(value){try{return decodeURIComponent(new URL(String(value),"https://campaign-wiki.invalid/").pathname.split("/").pop()||"");}catch{return String(value??"").split(/[\\/]/).pop()||"";}}
export function pathWithinRoot(value,rootPath){let decoded=String(value??"");try{decoded=decodeURIComponent(decoded);}catch{}decoded=decoded.replace(/\\/g,"/");const needle=String(rootPath).replace(/^\/+|\/+$/g,"");const index=decoded.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase());return index<0?null:decoded.slice(index).split(/[?#]/)[0];}
export function artworkDestinations(database,article,rootPath){return[...new Set(articlePaths(database,article).filter(path=>path[0]===IMAGE_ROOT).map(path=>[rootPath,...path.slice(1,-1).map(id=>safeFolderName(database.articles[id]?.title))].join("/")))];}
export function sidebarParentForArtworkPath(database,value,rootPath){const relative=pathWithinRoot(value,rootPath);if(!relative)return IMAGE_ROOT;const segments=relative.slice(String(rootPath).replace(/\/+$/g,"").length).split("/").filter(Boolean).slice(0,-1);let parentId=IMAGE_ROOT;for(const segment of segments){const child=childrenOf(database,parentId).find(article=>safeFolderName(article.title).toLocaleLowerCase()===segment.toLocaleLowerCase());if(!child)break;parentId=child.id;}return parentId;}
export function titleFromArtworkPath(value){return assetFilename(value).replace(/\.[^.]+$/," ").replace(/[_-]+/g," ").replace(/(?<=[a-z0-9])(?=[A-Z])/g," ").replace(/\s+/g," ").trim()||"Unclassified Artwork";}

export function buildArtworkPlan(database,rootPath){
  const rows=[];
  for(const article of Object.values(database.articles)){
    if(!article.image||article.organizer)continue;
    const destinations=artworkDestinations(database,article,rootPath);
    if(!destinations.length)continue;
    rows.push({articleId:article.id,title:article.title,current:article.image,currentRelative:pathWithinRoot(article.image,rootPath),filename:assetFilename(article.image),destinations,destination:destinations.length===1?destinations[0]:null,status:destinations.length===1?"ready":"ambiguous-path"});
  }
  const collisions=new Map();
  for(const row of rows)if(row.destination){const key=`${row.destination.toLocaleLowerCase()}/${row.filename.toLocaleLowerCase()}`;if(!collisions.has(key))collisions.set(key,[]);collisions.get(key).push(row);}
  for(const group of collisions.values())if(new Set(group.map(row=>row.current.toLocaleLowerCase())).size>1)for(const row of group)row.status="duplicate-destination";
  return rows.sort((a,b)=>a.destination?.localeCompare(b.destination??"")||a.title.localeCompare(b.title));
}

export function artworkFolders(plan,rootPath){const root=String(rootPath).replace(/\/+$/g,""),folders=new Set();for(const row of plan)for(const destination of row.destinations){let current=root;for(const segment of destination.slice(root.length).split("/").filter(Boolean)){current+=`/${segment}`;folders.add(current);}}return [...folders].sort((a,b)=>a.split("/").length-b.split("/").length||a.localeCompare(b));}
export function representedArtworkPaths(plan,rootPath,additionalPaths=[]){const paths=new Set();for(const row of plan){const current=pathWithinRoot(row.current,rootPath);if(current)paths.add(current.toLocaleLowerCase());if(row.status==="ready"&&row.destination&&row.filename)paths.add(`${row.destination}/${row.filename}`.toLocaleLowerCase());}for(const value of additionalPaths){const path=pathWithinRoot(value,rootPath);if(path)paths.add(path.toLocaleLowerCase());}return paths;}

export function analyzeArtworkDuplicates(files,plan,rootPath){
  const expected=new Map(),current=new Map(),plannedByCurrent=new Map();
  for(const row of plan){const currentPath=pathWithinRoot(row.current,rootPath)?.toLocaleLowerCase(),expectedPath=row.status==="ready"&&row.destination&&row.filename?`${row.destination}/${row.filename}`:null;if(currentPath){if(!current.has(currentPath))current.set(currentPath,[]);current.get(currentPath).push(row.articleId);if(expectedPath){if(!plannedByCurrent.has(currentPath))plannedByCurrent.set(currentPath,[]);plannedByCurrent.get(currentPath).push(expectedPath);}}if(expectedPath){const key=expectedPath.toLocaleLowerCase();if(!expected.has(key))expected.set(key,[]);expected.get(key).push(row.articleId);}}
  const byHash=new Map(),byName=new Map();
  for(const file of files){const path=pathWithinRoot(file.path,rootPath)??file.path,item={...file,path},hash=String(file.hash??"").toLocaleLowerCase();if(hash){if(!byHash.has(hash))byHash.set(hash,[]);byHash.get(hash).push(item);}const name=assetFilename(path).toLocaleLowerCase();if(!byName.has(name))byName.set(name,[]);byName.get(name).push(item);}
  const duplicateGroups=[];
  for(const[hash,members]of byHash)if(members.length>1){const expectedMembers=members.filter(item=>expected.has(item.path.toLocaleLowerCase())),currentMembers=members.filter(item=>current.has(item.path.toLocaleLowerCase())),planned=[...new Set(members.flatMap(item=>plannedByCurrent.get(item.path.toLocaleLowerCase())??[]))],canonical=expectedMembers.length?expectedMembers.map(item=>item.path):planned.length?planned:currentMembers.length===1?currentMembers.map(item=>item.path):[],canonicalPaths=new Set(canonical.map(path=>path.toLocaleLowerCase())),status=expectedMembers.length?"sidebar-canonical":planned.length?"planned-canonical-missing":currentMembers.length===1?"current-canonical":"ambiguous";duplicateGroups.push({hash,status,canonical,sources:status==="planned-canonical-missing"?members.map(item=>item.path):[],redundant:status==="planned-canonical-missing"?[]:members.filter(item=>!canonicalPaths.has(item.path.toLocaleLowerCase())).map(item=>item.path),members:members.map(item=>item.path)});}
  const filenameConflicts=[];
  for(const[name,members]of byName){const hashes=new Set(members.map(item=>String(item.hash??"").toLocaleLowerCase()).filter(Boolean));if(hashes.size>1)filenameConflicts.push({filename:name,files:members.map(item=>({path:item.path,hash:item.hash}))});}
  return{duplicateGroups:duplicateGroups.sort((a,b)=>a.members[0].localeCompare(b.members[0])),filenameConflicts:filenameConflicts.sort((a,b)=>a.filename.localeCompare(b.filename))};
}

export function imageMenuArticleIds(database){return new Set(Object.values(database.articles).filter(article=>articlePaths(database,article).some(path=>path[0]===IMAGE_ROOT)).map(article=>article.id));}
export function isImageFolder(database,article){return Boolean(article?.organizer||!article?.image&&childrenOf(database,article?.id).length);}
