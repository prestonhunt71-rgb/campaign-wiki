import { ATTENTION, VISIBILITY, makeId, putEntity, entitiesOf } from "./core.js";

const text = value => String(value ?? "").trim();
const list = value => Array.isArray(value) ? value : value ? [value] : [];
const slug = value => text(value).normalize("NFKD").replace(/[’']/g,"").replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-|-$/g,"").toLowerCase();
const date = value => text(value).replace(/^(\d{4})(\d{2})(\d{2})$/,"$1-$2-$3");
const plain = value => String(value ?? "").replace(/<br\s*\/?>/gi,"\n").replace(/<\/p\s*>/gi,"\n\n").replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").trim();
const aliases = value => text(value).split(/\s*[\n,]\s*/).filter(Boolean).filter(value => value.toLowerCase() !== "untitled");
const relationships = value => list(value).filter(item => item && typeof item === "object");

function actorDescription(old) {
  const sections = [old.description, old.backgroundHistory, old.personalityMotivation].map(plain).filter(Boolean);
  return [...new Set(sections)].join("\n\n");
}

function classification(old, tags) {
  const ids = new Set(text(old.tagIds).split(/\s+/));
  const ancestry = id => { const seen=new Set(); let current=tags.get(id); while(current&&!seen.has(current.id)){seen.add(current.id);if(current.id==="actors-heroes")return"hero";if(current.id==="actors-villains")return"villain";current=tags.get(current.parentId);} return null; };
  for(const id of ids){const found=ancestry(id);if(found)return found;} return "npc";
}

export function recoverLegacy(current, overlay, { sourceDocument = () => null } = {}) {
  const data = structuredClone(current);
  const records = Object.entries(overlay?.articles ?? {});
  const tags = new Map((overlay?.taxonomyTags ?? []).map(tag => [tag.id, tag]));
  const byLegacy = new Map();
  const bySemantic = new Map();
  const stats = { enriched:0, created:0, sessionsLinked:0, affiliationsCreated:0, dnpcsLinked:0, remediation:0 };
  const index = item => { bySemantic.set(`${item.type}:${slug(item.name)}`,item); if(item.type==="actor")bySemantic.set(`actor-${slug(item.name)}`,item); if(item.type==="scene")bySemantic.set(`scene-${slug(item.name)}`,item); };
  Object.values(data.entities).forEach(index);
  const find = (oldId,old,type) => {
    let item;
    if(oldId.startsWith("Actor.")||oldId.startsWith("Scene.")) item=Object.values(data.entities).find(value=>value.source?.uuid===oldId);
    if(!item&&type==="session") item=entitiesOf(data,"session").find(value=>value.name===old.name&&value.playDate===date(old.sessionDate));
    if(!item&&type) item=bySemantic.get(`${type}:${slug(old.name)}`);
    return item;
  };
  const typeOf = (oldId,old) => oldId.startsWith("Actor.")?"actor":oldId.startsWith("Scene.")?"scene":old.arcId&&old.sessionDate?"session":old.categoryId==="arcs"?"arc":null;

  // Existing source documents, Arcs, and Sessions are enriched before native Images are created.
  for(const [oldId,old] of records){const type=typeOf(oldId,old);if(!type)continue;let item=find(oldId,old,type);if(!item){const document=sourceDocument(oldId),name=text(old.name)||text(document?.name)||text(oldId.split(".").at(-1))||"Recovered article";const base={id:makeId(type),type,name,visibility:old.visibility==="public"?VISIBILITY.PUBLIC:VISIBILITY.AUTOMATIC,aliases:[],affiliationIds:[]};if(type==="actor")Object.assign(base,{classification:classification(old,tags),source:{uuid:oldId,id:oldId.split(".")[1],missing:!document},art:text(document?.img),portrait:text(document?.img),tokenArt:text(document?.tokenArt)});if(type==="scene")Object.assign(base,{source:{uuid:oldId,id:oldId.split(".")[1],missing:!document},art:text(document?.img)});if(type==="arc")Object.assign(base,{arcType:"arc",status:old.visibility==="public"?"complete":"in-progress"});if(type==="session")Object.assign(base,{arcId:old.arcId,playDate:date(old.sessionDate),synopsis:plain(old.manualHtml),memberIds:[]});item=putEntity(data,base);stats.created++;index(item);}else stats.enriched++;
    byLegacy.set(oldId,item); const mergedAliases=[...(item.aliases??[]),...aliases(old.aliases)].filter(value=>value.toLowerCase()!=="untitled");item.aliases=[...new Set(mergedAliases)];
    if(type==="actor"){item.classification=classification(old,tags);item.description=actorDescription(old)||item.description;item.quote=text(old.quote)||item.quote;item.art=text(old.image)||item.art;item.portrait=item.art||item.portrait;}
    if(type==="scene") item.description=plain(old.description)||plain(old.manualHtml)||item.description;
    if(type==="arc") item.art=text(old.image)||item.art;
    if(type==="session"){item.synopsis=plain(old.manualHtml)||item.synopsis;item.art=text(old.image)||item.art;}
    item.incomplete=false;
  }
  // Resolve Arc IDs after all Arc records exist.
  for(const [oldId,old] of records){if(!old.arcId||!old.sessionDate)continue;const session=byLegacy.get(oldId),arc=byLegacy.get(old.arcId);if(session&&arc)session.arcId=arc.id;}

  // Migrate intentional image/handout content. Art used by other pages is not cloned.
  for(const [oldId,old] of records){if(typeOf(oldId,old)||!text(old.name))continue;const category=text(old.categoryId).toLowerCase();let classificationValue=null;if(category.includes("vehicle")||category==="tag-the-comet")classificationValue="vehicle";else if(category.includes("equipment"))classificationValue="equipment";else if(category.includes("macguffin"))classificationValue="macguffin";else if(category.includes("handout")||category.startsWith("tag-switchboard")||category.startsWith("tag-the-anachronist"))classificationValue="media";if(!classificationValue)continue;let item=find(oldId,old,"image");if(!item){item=putEntity(data,{id:makeId("image"),type:"image",name:old.name,classification:classificationValue,art:text(old.image),description:plain(old.description)||plain(old.manualHtml),aliases:aliases(old.aliases),visibility:old.visibility==="public"?VISIBILITY.PUBLIC:VISIBILITY.AUTOMATIC,affiliationIds:[]});stats.created++;index(item);}else{item.classification=classificationValue;item.art=text(old.image)||item.art;item.description=plain(old.description)||plain(old.manualHtml)||item.description;item.incomplete=false;stats.enriched++;}byLegacy.set(oldId,item);bySemantic.set(oldId,item);
  }

  // Teams and employers become Affiliations; profession/archetype taxonomy is discarded.
  const affiliationTags=[...tags.values()].filter(tag=>tag.taxonomyRole==="team"||tag.parentId==="tag-by-employer");
  for(const tag of affiliationTags){let affiliation=bySemantic.get(`affiliation:${slug(tag.name)}`);if(!affiliation){affiliation=putEntity(data,{id:makeId("affiliation"),type:"affiliation",name:tag.name,description:"",visibility:VISIBILITY.AUTOMATIC,aliases:[],affiliationIds:[],incomplete:false,legacyTagId:tag.id});stats.affiliationsCreated++;index(affiliation);}affiliation.legacyTagId??=tag.id;bySemantic.set(tag.id,affiliation);}
  const legacyNames=new Set(affiliationTags.map(tag=>slug(tag.name)));
  for(const [oldId,old] of records){const actor=byLegacy.get(oldId);if(actor?.type!=="actor")continue;const ids=text(old.tagIds).split(/\s+/),mapped=ids.map(id=>bySemantic.get(id)?.id).filter(Boolean),preserved=(actor.affiliationIds??[]).filter(id=>{const affiliation=data.entities[id];return affiliation?.type==="affiliation"&&!affiliation.legacyTagId&&!legacyNames.has(slug(affiliation.name));});actor.affiliationIds=[...new Set([...preserved,...mapped])];}

  // Stable legacy targets often use type-name slugs rather than Foundry UUIDs.
  const resolveTarget = target => byLegacy.get(target)||bySemantic.get(target)||bySemantic.get(`actor:${slug(String(target).replace(/^actor-/,""))}`)||bySemantic.get(`scene:${slug(String(target).replace(/^scene-/,""))}`)||bySemantic.get(`image:${slug(String(target).replace(/^manual-/,""))}`);
  for(const [oldId,old] of records){const source=byLegacy.get(oldId);if(!source)continue;for(const relation of relationships(old.relationships)){const target=resolveTarget(relation.target);if(source.type==="session"&&target&&["featured-actors","featured-locations","link-to","linked-from"].includes(relation.type)){const before=source.memberIds.length;source.memberIds=[...new Set([...source.memberIds,target.id])];if(source.memberIds.length>before)stats.sessionsLinked++;}else if(["actor","scene","image"].includes(source.type)&&target?.type==="session"&&["featured-as-actor-in","featured-as-location-in","linked-from"].includes(relation.type)){const before=target.memberIds.length;target.memberIds=[...new Set([...target.memberIds,source.id])];if(target.memberIds.length>before)stats.sessionsLinked++;}else if(source.type==="actor"&&relation.type==="dnpc-of"&&target?.type==="actor"){source.dnpcOwnerId=target.id;stats.dnpcsLinked++;}}
  }
  data.migration ??= {};data.migration.repairVersion=2;data.migration.repairedAt=new Date().toISOString();data.migration.repairStats=stats;data.migration.remediation ??=[];
  stats.remediation=data.migration.remediation.length;
  return { database:data, stats };
}
