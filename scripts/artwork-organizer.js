import {articlePaths,childrenOf} from "./unified-core.js";

export const IMAGE_ROOT="root:images";

export function safeFolderName(value){return String(value??"").trim().replace(/[\\/:*?"<>|]/g,"-").replace(/\s+/g," ").replace(/[. ]+$/g,"")||"Uncategorized";}
export function assetFilename(value){try{return decodeURIComponent(new URL(String(value),"https://campaign-wiki.invalid/").pathname.split("/").pop()||"");}catch{return String(value??"").split(/[\\/]/).pop()||"";}}
export function pathWithinRoot(value,rootPath){let decoded=String(value??"");try{decoded=decodeURIComponent(decoded);}catch{}decoded=decoded.replace(/\\/g,"/");const needle=String(rootPath).replace(/^\/+|\/+$/g,"");const index=decoded.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase());return index<0?null:decoded.slice(index).split(/[?#]/)[0];}
export function artworkDestinations(database,article,rootPath){return[...new Set(articlePaths(database,article).filter(path=>path[0]===IMAGE_ROOT).map(path=>[rootPath,...path.slice(1,-1).map(id=>safeFolderName(database.articles[id]?.title))].join("/")))];}

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
export function representedArtworkPaths(plan,rootPath){const paths=new Set();for(const row of plan){const current=pathWithinRoot(row.current,rootPath);if(current)paths.add(current.toLocaleLowerCase());if(row.status==="ready"&&row.destination&&row.filename)paths.add(`${row.destination}/${row.filename}`.toLocaleLowerCase());}return paths;}

export function imageMenuArticleIds(database){return new Set(Object.values(database.articles).filter(article=>articlePaths(database,article).some(path=>path[0]===IMAGE_ROOT)).map(article=>article.id));}
export function isImageFolder(database,article){return Boolean(article?.organizer||!article?.image&&childrenOf(database,article?.id).length);}
